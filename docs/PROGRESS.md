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
- Observed runtime ports during validation were `18081`, `18082`, and `18083`;
  desktop tools must keep reading the per-app port file and must not assume
  `18080`.
- Next Android compatibility queue: `NewPipe` current, `AntennaPod`,
  `Now in Android`, `DuckDuckGo Android`, `AnkiDroid`, `Organic Maps`, and
  `WordPress Android`.
- Next Flutter compatibility queue: `flutter_inappwebview`,
  `openfoodfacts/smooth-app`, Flutter `add_to_app`, `put-flutter-to-work`,
  `AppFlowy`, `LocalSend`, `Hiddify`, and `flutter/gallery`.
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
