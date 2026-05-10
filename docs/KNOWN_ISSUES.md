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

- Status: open
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
- Current workaround: before screenshots, explicitly bring the app back with a
  known component or real navigation path, then verify `/v1/status.activity`
  and/or `/v1/view/tree` contains expected visible nodes.
- Desired fix: when `packageName` is supplied, screenshot results should include
  foreground package/activity metadata, and optionally fail or warn when the
  foreground package does not match the requested target.

## `tap-text` can report success for a node outside the tappable viewport

- Status: open
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
- Current workaround: for navigation-critical assertions, verify the activity or
  expected visible text after every `tap-text`; prefer UIAutomator-visible taps
  or explicit coordinates after confirming bounds are inside the viewport.
- Desired fix: `tap-text` should ignore bridge-tree nodes whose center is
  outside the current viewport, or return a warning/failure when the selected
  node is not tappable on screen.

## `status --package-name` can expose a raw socket hang-up before app readiness

- Status: open
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
- Current workaround: explicitly launch the target package/component first, then
  retry `status` and follow with visible-text or activity assertions.
- Desired fix: return a structured not-ready/connection-failed result that
  includes the requested package name, attempted port/source, and a suggested
  launch-or-retry action instead of surfacing the raw socket error.
