# Known Issues

This file records issues found while using ai-app-bridge as a development loop
for real Android apps. Keep each item evidence-based and include the current
workaround when one exists.

## Android runtime 0.1.4 cannot be consumed by minSdk 21 apps

- Status: fixed and remotely verified for `0.1.5`
- Found while validating: `D:\TestProject\android-architecture-samples`
- Bridge version: `0.1.4`
- Evidence:
  - The app declares `minSdk=21`.
  - `:app:processDebugMainManifest` failed with
    `uses-sdk:minSdkVersion 21 cannot be smaller than version 23 declared in library`.
- Impact: common Android apps that still support API 21 cannot consume the
  released `0.1.4` runtime dependency.
- Fix: lowered Android runtime SDK and Flutter wrapper Android `minSdk` from 23
  to 21.
- Verification: rebuilt and installed `android-architecture-samples` first with
  Maven Local `0.1.5`, then again after removing `mavenLocal()` and forcing
  JitPack remote `0.1.5`; `/v1/status` reported bridge `0.1.5`, and
  `/v1/view/tree` worked.

## Flutter pub package 0.1.4 still requires a manual Android runtime dependency

- Status: fixed and remotely verified in Flutter `0.1.5` plus Android runtime
  `0.1.5`
- Found while validating: `D:\TestProject\flutter-samples\platform_design`
- Bridge version: Flutter `0.1.4`, Android runtime `0.1.4`
- Evidence:
  - Adding only `ai_app_bridge_flutter` did not start an Android bridge server.
  - Adding `debugImplementation("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-android:0.1.4")`
    to the host Android app made `/v1/status` and `/v1/view/tree` work.
- Impact: Flutter users must know an Android implementation detail, and the
  README can easily drift from the actual pub package behavior.
- Fix: the Flutter plugin Android module now declares
  `debugImplementation("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-android:0.1.5")`.
  Kotlin calls stay reflection-based, so release variants can compile without
  the debug runtime class.
- Verification: `platform_design` removed the host Android app's manual runtime
  dependency and used the local Flutter plugin `0.1.5`; debug runtime classpath
  included `ai-app-bridge-android:0.1.5`, release runtime classpath did not.
  After removing `mavenLocal()`, the app rebuilt against JitPack remote
  Android runtime `0.1.5`, installed, and reported bridge `0.1.5` with Flutter
  widget snapshot and operable node data.
- Verification after pub.dev release: `platform_design` removed the local path
  override and resolved `ai_app_bridge_flutter: ^0.1.5` from pub.dev. The APK
  built, installed, and reported bridge `0.1.5`, Flutter app
  `platform_design`, `operableCount=6`, first widget `MyAdaptingApp`, and
  native child `FlutterView`.

## Flutter initialization before binding prevents snapshot delivery

- Status: documentation fixed for `0.1.5`
- Found while validating: `D:\TestProject\flutter-samples\platform_design`
- Evidence:
  - The native Android bridge server started and `/v1/status` worked.
  - `status.flutter` stayed empty until `WidgetsFlutterBinding.ensureInitialized()`
    was called before `AiAppBridge.instance.initialize(...)`.
- Impact: Flutter apps can appear connected at the native layer while widget
  snapshot data is missing.
- Fix: all Flutter quick-start snippets now call
  `WidgetsFlutterBinding.ensureInitialized()` before bridge initialization.

## Flutter package SDK constraint is narrower than the implementation requires

- Status: fixed and published in Flutter `0.1.5`
- Found while reviewing package metadata during Flutter sample validation
- Bridge version: Flutter `0.1.4`
- Evidence: `pubspec.yaml` required Dart `^3.9.2`, while the integration docs
  describe Flutter 3.10+ / Dart 3.0+ as the intended compatibility floor.
- Impact: Flutter 3.x projects on older stable channels can be rejected by
  `flutter pub get` before any real runtime compatibility check.
- Fix: changed the package constraint to Dart `>=3.0.0 <4.0.0` and Flutter
  `>=3.10.0`.

## Bridge port is not always 18080

- Status: documented
- Found while validating: `Jetchat`, `platform_design`, and
  `android-architecture-samples`
- Evidence: the three running apps reported bridge ports `18081`, `18082`, and
  `18083`.
- Impact: tools or docs that assume `127.0.0.1:18080` can report false
  negatives when another bridged app already owns that port.
- Current behavior: the runtime tries ports from 18080 upward, and the desktop
  CLI reads the per-app port file through ADB.
- Desired rule: user-facing docs should describe `18080` as the first attempted
  port, not a fixed endpoint.

## Android PopupWindow is not included in `/v1/view/tree`

- Status: fixed in `0.1.3`
- Found while validating: `C:\project\reader`, home overflow menu
- Bridge version: `0.1.2`; fix version: `0.1.3`
- Evidence:
  - The overflow menu was visible in a device screenshot.
  - `/v1/view/tree` still returned only the Activity decor tree and did not
    include menu rows such as login, sync, scan, feedback, or settings.
  - `/v1/action/tap` on a visible menu row fell through to the underlying
    bookshelf item and opened `ReadActivity`.
- Likely cause: `/v1/action/tap` dispatches through the current Activity
  `decorView`, while PopupWindow owns a separate window root.
- Fix: `/v1/view/tree` now reports a `windows` array collected from Android
  window roots when reflection is available, and `/v1/action/tap` dispatches
  through the topmost root that contains the requested screen coordinates.
- Verified on `C:\project\reader` after installing the `0.1.3` debug build:
  the home overflow menu appeared as `type=popup`, and tapping the first row
  returned `windowType=popup` before navigating to `LoginActivity`.
- Remaining risk: Android hidden-API restrictions may block root reflection on
  some OS/device builds. Keep the explicit `root` field as the Activity decor
  compatibility path.

## Hidden child views can appear as visible in `/v1/view/tree`

- Status: fixed in `0.1.3`
- Found while validating: `C:\project\reader`, login page
- Bridge version: `0.1.2`; fix version: `0.1.3`
- Evidence:
  - On the logged-in login page, the not-login container was hidden.
  - `/v1/view/tree` still returned text from that hidden branch, for example
    the login title, with `visible=true` but zero-size bounds.
- Impact: text-based assertions can pass on content that is not actually
  visible to the user.
- Fix: each node now exposes `localVisible`, `effectiveVisible`, and keeps
  `visible` mapped to effective user-visible state. Zero-size, transparent, or
  hidden-ancestor nodes are marked not effectively visible.

## Network capture redaction does not cover query/body payloads

- Status: fixed in `0.1.3`
- Found while validating: `C:\project\reader`, login and bookshelf sync flow
- Bridge version: `0.1.2`; fix version: `0.1.3`
- Evidence:
  - `/v1/network` captures request URL, request body, and response body.
  - Login/sync requests can include phone numbers or mobile tokens in query or
    body payloads.
- Impact: test logs and exported bridge responses can contain user-sensitive
  data.
- Fix: network capture now redacts URL query values, JSON body fields, form
  fields, and header fields whose keys match auth/token/session/password/phone
  or verification-code style names. Captured network events include
  `redacted=true`.
- Remaining risk: free-form text bodies are only redacted when they are JSON or
  key-value form payloads. Do not treat bridge output as production-grade DLP.

## Launcher ambiguity with debug-only launcher activities

- Status: open
- Found while validating: `C:\project\reader`
- Bridge version: `0.1.2`
- Evidence:
  - Package-level launcher commands can enter LeakCanary's debug launcher
    instead of the app splash/main Activity when debug dependencies add their own
    launcher entry.
- Workaround: launch the app with an explicit component, such as
  `com.ldp.reader/.ui.activity.SplashActivity`.
- Desired fix: if bridge adds app launch helpers, allow explicit component
  selection and report all launcher candidates before choosing a default.

## Screenshot capture does not prove the target package is foreground

- Status: fixed in desktop CLI `0.1.8`
- Found while validating: `C:\project\reader`, home/login visual checks
- Bridge version: desktop CLI `0.1.6`, app bridge `0.1.4`
- Evidence:
  - `ai-app-bridge screenshot --package-name com.ldp.reader ...` can still
    return a valid PNG of the device's current foreground screen.
  - During reader validation, a screenshot request returned the Android
    launcher because the device was being used manually between bridge actions.
  - The command result was structurally successful (`ok=true`, width/height
    present), so screenshot success alone was not enough to prove the Reader
    app was visible.
- Impact: visual validation can falsely pass or fail if a human, launcher,
  permission surface, or another app takes foreground between `status/tree` and
  `screenshot`.
- Fix: `screenshot --package-name ...` now includes foreground package/activity
  metadata parsed from `dumpsys window` and returns
  `error=foreground_package_mismatch` when the foreground package does not match
  the requested package.
- Verification: the native sample returned `foregroundMatchesPackage=true` while
  foregrounded, then returned `ok=false` with `foreground_package_mismatch` after
  pressing Home and capturing the launcher.

## `tap-text` can report success for a node outside the tappable viewport

- Status: fixed in desktop CLI `0.1.8`
- Found while validating: `C:\project\reader`, bookshelf entry navigation
- Bridge version: desktop CLI `0.1.6`, app bridge `0.1.4`
- Evidence:
  - `ai-app-bridge tap-text --target-text 一气朝阳 --package-name com.ldp.reader`
    returned `ok=true`, `source=bridge-tree`, and tap coordinates `x=718`,
    `y=2810`.
  - The device viewport reported by the preceding tree/status pass was
    `1264x2780`, so the selected node center was below the visible screen.
  - The command did not navigate away from `com.ldp.reader.ui.activity.MainActivity`.
- Impact: agent flows can believe a tap succeeded even though the target node is
  clipped/offscreen and Android ignores or misroutes the tap.
- Fix: `tap-text` now filters bridge-tree matches by effective visibility,
  positive bounds, and center point inside the root/window viewport. It skips
  offscreen bridge nodes and falls back to UIAutomator; if only offscreen bridge
  matches exist, it returns `bridge_tree_node_not_tappable`.
- Verification: Node unit tests cover visible selection after an offscreen
  duplicate and the offscreen-only failure path. Native sample smoke still
  passed tap, input, dialog, scroll, and back navigation.

## `status --package-name` can expose a raw socket hang-up before app readiness

- Status: fixed in desktop CLI `0.1.8`
- Found while validating: `C:\project\reader`, post-install bridge readiness
- Bridge version: desktop CLI `0.1.6`, app bridge `0.1.4`
- Evidence:
  - After installing the debug APK and clearing logcat, before explicitly
    starting Reader, `ai-app-bridge status --package-name com.ldp.reader`
    failed with the raw Node error `Error: socket hang up`.
  - Starting the app with
    `adb shell am start -W -n com.ldp.reader/.ui.activity.MainActivity` and
    retrying the same status command returned structured JSON with
    `activity.current=com.ldp.reader.ui.activity.MainActivity`.
- Impact: agent loops cannot reliably distinguish "target app is not started or
  bridge is not ready yet" from a real transport failure when the CLI exposes
  the low-level socket exception directly.
- Fix: `status` now catches socket reset, HTTP timeout, refused connections,
  ADB timeout, and forward failures and returns structured JSON with the
  requested package, attempted local/device ports, port discovery source, and a
  suggested next action.
- Verification: Node unit tests cover socket hang-up, status HTTP timeout, and
  ADB timeout normalization.

## Package port discovery can hang the CLI when ADB stalls

- Status: fixed in desktop CLI `0.1.8`
- Found while validating: multiple installed apps under `D:\TestProject`
- Bridge version: desktop CLI `0.1.7`
- Evidence:
  - `adb shell run-as <package> cat files/ai_app_bridge_port.json` hung on some
    installed apps while the package had a previously written port file.
  - Because CLI ADB subprocesses had no timeout, `status --package-name` could
    block indefinitely before reaching the HTTP bridge request.
- Impact: batch unattended validation can stall on one unhealthy device/package
  instead of returning a diagnosable result.
- Fix: ADB subprocess calls now use a default timeout
  (`AI_APP_BRIDGE_ADB_TIMEOUT_MS`, default 15000 ms, or `--adb-timeout-ms`) and
  classify timeouts as `adb_timeout` for `status`.

## Multiple package probes can fight over local port 18080

- Status: fixed in desktop CLI `0.1.8`
- Found while validating: multiple installed apps under `D:\TestProject`
- Bridge version: desktop CLI `0.1.7`
- Evidence:
  - Separate status/tree probes for different packages reused local
    `tcp:18080`, so later `adb forward` calls could remap the same local port
    to another device bridge port.
  - This produced false `HTTP timeout` results even when app-specific port files
    existed.
- Impact: parallel or rapid sequential validation across several bridged apps
  can report false negatives.
- Fix: when a package port file is discovered and `--port` was not explicitly
  supplied, the CLI now forwards local `tcp:<devicePort>` to the same device
  port instead of always using local 18080.

## Very large Gradle builds need watchdog and heartbeat handling

- Status: open
- Found while validating: `D:\TestProject\DuckDuckGo-Android`
- Evidence:
  - After repairing the required NDK and fixing the dependency configuration,
    `:app:assembleInternalDebug -PuseProprietaryFont=false --no-daemon` reached
    real multi-module resource, manifest, Kotlin, KSP, and Anvil work.
  - The build then produced no new Gradle output for more than an hour and no
    APK was created under `app\build\outputs`.
  - A JVM thread dump showed the Gradle daemon worker waiting for included build
    task completion while process CPU still advanced slowly.
- Impact: unattended production validation can burn hours on one large app
  without a clear "failed" result unless the harness has task-level heartbeats,
  log-stall detection, and a timeout policy.
- Workaround: for production-scale apps, run builds under an external watchdog
  that records the last output timestamp, current task evidence, JVM thread
  state, and artifact presence before terminating a stale run.

## `--help` should not probe ADB or the default sample package

- Status: fixed in desktop CLI `0.1.10`
- Found while validating: `D:\TestProject\DuckDuckGo-Android`
- Evidence:
  - Running `node ...\ai-app-bridge.js --help` did not print help. Because the
    parser treated `--help` as an option and no command was present, it fell
    through to default `status`.
  - The command then attempted to query the default sample package
    `io.github.lidongping.aiappbridge.sample` and waited for bridge readiness.
- Impact: unattended scripts and humans can trigger device I/O while only trying
  to inspect CLI usage, which is confusing during multi-app validation.
- Fix: `--help` and `help` now print static usage text and return without
  constructing an ADB context or touching the device. Unit tests execute both
  forms with a deliberately invalid `ADB` value to prove no ADB subprocess is
  used.

## Windows KSP incremental processing can fail across drive roots

- Status: open environment/toolchain issue
- Found while validating: `D:\TestProject\DuckDuckGo-Android`
- Evidence:
  - `:app:kspInternalDebugKotlin` failed in Glide KSP with
    `this and base files have different roots`.
  - The processor attempted to associate
    `C:\Users\ldp\.gradle\caches\...\okhttp3-integration-4.16.0-api.jar!...`
    with base project path `D:\TestProject\DuckDuckGo-Android\app`.
  - A narrower retry with quoted PowerShell argument `"-Pksp.incremental=false"`
    and `--no-build-cache` passed `:app:kspInternalDebugKotlin` in 4m12s.
- Impact: a production app can fail after dependency resolution and manifest
  merge even though the bridge runtime is not involved.
- Workaround: for Windows cross-drive builds, retry with
  `"-Pksp.incremental=false" --no-build-cache`; quote the `-P` argument in
  PowerShell so Gradle does not parse `.incremental=false` as a task name.

## Production Android clones may be missing native submodules

- Status: open repository setup issue
- Found while validating: `D:\TestProject\DuckDuckGo-Android`
- Evidence:
  - After KSP was fixed, `:httpsupgrade-impl:configureCMakeDebug[arm64-v8a]`
    failed because CMake could not find
    `src/main/cpp/bloom_cpp/src/BloomFilter.cpp`.
  - `git submodule status` showed leading `-` entries for
    `httpsupgrade/httpsupgrade-impl/src/main/cpp/bloom_cpp` and
    `submodules/privacy-grade`.
  - `git submodule update --init --recursive` checked out both modules and the
    nested `bloom_cpp/third-party/catch2`, after which the native CMake step and
    full APK build passed.
- Impact: unattended validation can misclassify a missing repository bootstrap
  step as a native toolchain or bridge integration failure.
- Workaround: before building large production Android repos, record
  `git submodule status` and run `git submodule update --init --recursive` when
  any required submodule is uninitialized.

## SDK manager can leave partial Android package downloads

- Status: open environment issue
- Found while validating: `D:\TestProject\DuckDuckGo-Android`
- Evidence:
  - Gradle attempted to auto-install `ndk;21.4.7075529` and failed with
    `ZipException: Archive is not a ZIP archive`.
  - The SDK temp area contained a partial
    `android-ndk-r21e-windows-x86_64.zip` of `545710784` bytes.
  - Resuming the official download to `1109665123` bytes and verifying SHA-1
    `FC44FEA8BB3F5A6789821F40F41DCE2D2CD5DC30` allowed the NDK to be installed
    with `Pkg.Revision = 21.4.7075529`.
- Impact: failures can look like app/Gradle failures while the actual problem
  is a corrupted SDK component download.
- Workaround: verify SDK component file size/hash before retrying the build; if
  the package is partial, remove only the exact failed component directory and
  install a verified archive.
