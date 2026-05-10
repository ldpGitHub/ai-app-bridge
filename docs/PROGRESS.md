# Progress

## 2026-05-10

- Compatibility validation expanded to external projects under `D:\TestProject`:
  `compose-samples\Jetchat`, `android-architecture-samples`, and
  `flutter-samples\platform_design`.
- `Jetchat` validated with remote Android `0.1.4`: Gradle `9.4.1`, AGP
  `9.2.0`, Kotlin `2.3.21`; `:app:assembleDebug` succeeded, APK installed,
  `/v1/status` reported bridge `0.1.4`, and `/v1/view/tree` returned a Compose
  tree.
- `android-architecture-samples` exposed a release blocker in remote Android
  `0.1.4`: its app `minSdk=21` cannot consume runtime AAR `minSdk=23`.
  Lowering the runtime and Flutter wrapper Android `minSdk` to 21 was verified
  locally through Maven Local with build, install, `/v1/status`, and
  `/v1/view/tree`.
- `flutter-samples\platform_design` validated Flutter runtime data capture:
  after calling `WidgetsFlutterBinding.ensureInitialized()` before
  `AiAppBridge.instance.initialize(...)`, `/v1/status` included Flutter widget
  snapshot data and operable nodes such as list items and tabs.
- Flutter integration is being simplified for `0.1.5`: the Flutter plugin's
  Android debug variant now declares the Android runtime dependency, so Flutter
  consumers only need the pub package plus a JitPack repository. The release
  variant keeps the runtime absent.
- Flutter package SDK constraints were widened from Dart `^3.9.2` to
  `>=3.0.0 <4.0.0` and Flutter `>=3.10.0`, matching the documented runtime
  requirements instead of forcing latest Flutter projects only.
- `0.1.5` local verification completed:
  - Repository build passed with
    `:ai-app-bridge-android:build :ai-app-bridge-gradle-plugin:build`.
  - Flutter plugin passed `flutter pub get` and `flutter analyze --no-pub`.
  - Android artifacts were published to Maven Local under JitPack coordinates
    `com.github.ldpGitHub.ai-app-bridge:*:0.1.5` for local proof.
  - `android-architecture-samples` rebuilt with `0.1.5`, installed on device
    `b46093e6`, `/v1/status` reported bridge `0.1.5`, and `/v1/view/tree`
    returned the Compose root.
  - `platform_design` removed the host app's manual Android runtime dependency
    and used the local Flutter plugin `0.1.5`; debug runtime classpath included
    `ai-app-bridge-android:0.1.5`, release runtime classpath did not include
    it, the APK installed, `/v1/status` reported bridge `0.1.5`, and Flutter
    widget/operable data was present.
- `0.1.5` remote dependency verification completed after pushing tag `0.1.5`:
  - JitPack returned HTTP 200 for both `ai-app-bridge-android` and
    `ai-app-bridge-gradle-plugin` POMs.
  - `android-architecture-samples` removed `mavenLocal()`, rebuilt with
    `--refresh-dependencies`, installed, and reported bridge `0.1.5` through
    `/v1/status`; `/v1/view/tree` returned the Compose root.
  - `platform_design` removed `mavenLocal()`, rebuilt using the local Flutter
    plugin plus remote JitPack Android runtime, installed, and reported bridge
    `0.1.5` with Flutter widget/operable data.
- Flutter `ai_app_bridge_flutter` `0.1.5` was published to pub.dev. After
  pub.dev API and archive download showed `0.1.5`, `platform_design` removed
  the local path override and resolved `ai_app_bridge_flutter: ^0.1.5` from
  pub.dev. `flutter pub get`, `flutter analyze --no-pub`, `flutter build apk
  --debug --no-pub`, install, `/v1/status`, and `/v1/view/tree` all passed.
  The installed app reported bridge `0.1.5`, Flutter app
  `platform_design`, `operableCount=6`, first widget `MyAdaptingApp`, and
  native child `FlutterView`.
- `NewPipe` current validation completed from official `dev` at `cd171dab5402`:
  Gradle `9.4.1`, AGP `8.13.2`, Kotlin `2.3.21`, OkHttp `5.3.2`.
  Minimal debug integration added remote Android runtime `0.1.5` and enabled
  the debug Gradle plugin's OkHttp capture. `debugRuntimeClasspath` resolved
  `ai-app-bridge-android:0.1.5`; `:app:assembleDebug` succeeded and executed
  `:app:transformDebugClassesWithAsm`. The APK installed on device `b46093e6`
  after switching from adb streaming install to `--no-streaming`; `/v1/status`
  reported bridge `0.1.5` on port `18084`, `/v1/view/tree` returned the
  NewPipe home tree, and `/v1/network` returned `13` `okhttp-auto` records with
  redaction enabled.
- `AntennaPod` current validation completed from official `develop` at
  `78594ec`: Gradle `8.13`, AGP `8.11.0`, Kotlin BOM `1.9.24`, OkHttp
  `4.12.0`. Minimal debug integration added remote Android runtime `0.1.5`
  and enabled the debug Gradle plugin's OkHttp capture. `freeDebugRuntimeClasspath`
  resolved `ai-app-bridge-android:0.1.5`; `:app:assembleDebug` succeeded and
  executed `transformFreeDebugClassesWithAsm` plus `transformPlayDebugClassesWithAsm`.
  `app-free-debug.apk` installed on device `b46093e6`; `/v1/status` reported
  bridge `0.1.5` on port `18085`, and `/v1/view/tree` returned the AntennaPod
  home tree.
- `Now in Android` current build validation completed from official `main` at
  `7d45eae`: Gradle `9.4.0`, AGP `9.0.0`, Kotlin `2.3.0`, OkHttp `4.12.0`,
  Retrofit `2.11.0`. Minimal debug integration added remote Android runtime
  `0.1.5` and enabled the debug Gradle plugin's OkHttp capture.
  `demoDebugRuntimeClasspath` resolved `ai-app-bridge-android:0.1.5`;
  `:app:assembleDemoDebug` succeeded and produced `app-demo-debug.apk`. The
  APK installed on device `b46093e6`; `/v1/status` reported bridge `0.1.5` on
  port `18087`, `/v1/view/tree` returned the Compose root, and `/v1/network`
  returned `6` `okhttp-auto` records with Firebase URL token redaction.
- `openfoodfacts/smooth-app` current validation is environment-blocked, not
  bridge-blocked. The official `develop` branch at `4adadbb` was minimally
  wired with `ai_app_bridge_flutter: ^0.1.5`, JitPack in Android repositories,
  and `AiAppBridge.instance.initialize(...)` after
  `WidgetsFlutterBinding.ensureInitialized()`, without a manual host Android
  runtime dependency. `flutter pub get` fails before Gradle because the app
  requires Dart `^3.11.5`; the default Flutter is `3.35.8-ohos-0.0.3`
  with Dart `3.9.2`, and the highest checked local Flutter `3.41.6` still has
  Dart `3.11.4`.
- `flutter_inappwebview` Android example validation completed from official
  `master` at `17527ca`: repository `.fvmrc` expects Flutter `3.38.6`, while
  the available Flutter was `3.35.8-ohos-0.0.3` with Dart `3.9.2`. The
  `flutter_inappwebview_android/example` app resolved
  `ai_app_bridge_flutter: ^0.1.5` from pub.dev, initialized the bridge after
  `WidgetsFlutterBinding.ensureInitialized()`, and added JitPack to Android
  repositories without a manual host Android runtime dependency. `flutter pub
  get`, `flutter analyze --no-pub`, and `flutter build apk --debug` succeeded.
  `debugRuntimeClasspath` proved `ai-app-bridge-android:0.1.5` came through
  `project :ai_app_bridge_flutter`. The APK installed on device `b46093e6`;
  `/v1/status` reported bridge `0.1.5` on port `18086`, with Flutter snapshot
  data including `MaterialApp`, `MyApp`, `Scaffold`, `PlatformViewLink`, and
  `AndroidViewSurface`; the operable tree included the title
  `Official InAppWebView website`.
- Observed runtime ports during validation were `18081`, `18082`, `18083`,
  `18084`, `18085`, `18086`, and `18087`; desktop tools must keep reading the
  per-app port file and must not assume `18080`.
- Next Android compatibility queue: `DuckDuckGo Android`, `AnkiDroid`,
  `Organic Maps`, and `WordPress Android`.
- Next Flutter compatibility queue: Flutter `add_to_app`, `put-flutter-to-work`,
  `AppFlowy`, `LocalSend`, `Hiddify`, and `flutter/gallery`.
  `openfoodfacts/smooth-app` needs Flutter `3.41.9` or newer before it can be
  fully validated.
- Published local Android bridge `0.1.3` with `./gradlew.bat build publishToMavenLocal --no-daemon`.
- Added multi-window view-tree reporting for PopupWindow/Dialog roots through
  `/v1/view/tree.windows`.
- Updated `/v1/action/tap` to dispatch through the topmost window root that
  contains the requested screen coordinate.
- Added effective visibility metadata: `localVisible`, `effectiveVisible`, and
  compatibility `visible`.
- Added safe-default network redaction for sensitive URL query, header, JSON,
  and form keys.
- Reader app-level verification target for this slice: install `C:\project\reader` with bridge
  `0.1.3`, open the home overflow menu, verify menu rows appear in
  `/v1/view/tree.windows`, and verify bridge tap can enter `LoginActivity`
  without falling through to the bookshelf item.
- Reader verification completed on a OnePlus `PKR110` / Android SDK 36 device:
  `/v1/status` reported bridge `0.1.3`, `/v1/view/tree.windows` included a
  `popup` root for the overflow menu, `/v1/action/tap` on the menu row returned
  `windowType=popup`, and the app navigated to `LoginActivity`.
- Network redaction was verified with a synthetic `/v1/network` payload:
  `mobile`, `token`, `Authorization`, `phone`, and nested `mobileToken` values
  were captured as `[redacted]`.
