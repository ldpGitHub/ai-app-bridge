# AI App Bridge

English | [中文](README.md)

AI App Bridge is a runtime bridge for AI agents to close the loop on mobile app iteration: inspect the running app, operate UI and WebView surfaces, collect structured runtime state, verify results, and continue improving the app.

The project is designed for Android and Flutter apps first. The current implementation is debug-only by design, so teams can expose rich runtime control surfaces to local AI agents without shipping them in production builds.

## Why

Screenshot-only automation is fragile. A useful AI coding loop needs runtime evidence:

- What screen is currently visible?
- Which native views, WebViews, and Flutter widgets exist?
- What logs, network records, state changes, and events happened after an action?
- Did the app actually move into the expected state after the change?

AI App Bridge provides that structured runtime surface so an AI agent can inspect, act, verify, and iterate with less guesswork.

## Modules

```text
android/ai-app-bridge-android          Android runtime SDK
android/ai-app-bridge-gradle-plugin   Debug build instrumentation plugin
flutter/ai_app_bridge_flutter         Flutter plugin
desktop/ai-app-bridge-cli             Node CLI and MCP stdio server
examples/android-native-sample        Clean Android sample app
docs                                  Design, integration, and test notes
```

## Current Capabilities

- Android bridge status on `127.0.0.1:18080`
- Android View tree snapshots and screenshots
- Native Android WebView DOM snapshots and JavaScript evaluation
- Logs, network, state, and event buffers with `sinceId` / `sinceMs` filters
- Flutter widget snapshots and runtime action handling
- Flutter H5 adapter registry
- Desktop ADB operations and UIAutomator fallback
- MCP wrapper over the Node CLI command surface
- Debug Gradle plugin slice for OkHttp HTTP auto capture

## Android Quick Start

Add the Android runtime SDK to debug builds:

```kotlin
repositories {
    google()
    mavenCentral()
}

dependencies {
    debugImplementation("io.github.lidongping.aiappbridge:ai-app-bridge-android:0.1.0")
}
```

The runtime SDK starts automatically in debuggable Android apps through its init provider.

Optional OkHttp auto capture is provided by the debug Gradle plugin:

```kotlin
plugins {
    id("io.github.lidongping.aiappbridge.android") version "0.1.0"
}

aiAppBridge {
    okHttpCaptureEnabled = true
}
```

## Flutter Quick Start

Add the Flutter plugin:

```yaml
dependencies:
  ai_app_bridge_flutter: ^0.1.0
```

Initialize once:

```dart
import 'package:ai_app_bridge_flutter/ai_app_bridge_flutter.dart';

AiAppBridge.instance.initialize(appName: 'sample_app');
```

For Flutter WebView DOM support, register an H5 adapter because the WebView controller lives in Dart:

```dart
AiAppBridge.instance.registerH5Adapter(
  AiAppBridgeH5Adapter(
    id: 'main-webview',
    source: 'webview_flutter',
    evaluateJavascript: (script) {
      return controller.runJavaScriptReturningResult(script);
    },
  ),
);
```

## Desktop CLI / MCP

```bash
npm install -g @lidongping/ai-app-bridge

ai-app-bridge status --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge tree --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge smoke --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge-mcp
```

Use `--serial <deviceId>` when more than one Android device is connected.

## Publishing Status

The README is written for the normal published-package path: users should only need to add the relevant dependency for their platform, without cloning or compiling this repository.

Initial publishing targets:

- Android runtime SDK: Maven Central
- Gradle plugin: Gradle Plugin Portal
- Flutter package: pub.dev
- Node CLI / MCP server: npm

## Safety Boundary

AI App Bridge exposes runtime inspection and operation surfaces. It should be wired into debug builds only. Do not ship it in production/release builds unless you have made a deliberate security review for your own environment.

This repository is intentionally generic. Do not add company-specific app code, package names, host names, screenshots, device ids, credentials, or business fixtures.

## License

AI App Bridge is licensed under the [Apache License 2.0](LICENSE).

If you distribute modified versions, keep the license and copyright notices and clearly state that your version is based on or modified from AI App Bridge. See [NOTICE](NOTICE).
