# AI App Bridge

English | [中文](README.md)

AI App Bridge gives autonomous AI agents a runtime interface to running Android and Flutter apps. Agents can inspect the current screen, operate native UI and WebViews, read View tree / Widget tree / DOM data, collect network requests and logs, verify outcomes, and keep iterating from real evidence.

Its goal is to help AI agents move through an observe -> act -> read results -> verify -> iterate loop, instead of guessing without runtime evidence.

## What It Solves

Screenshot-only automation is fragile. For autonomous iteration, an AI agent needs both runtime evidence and a way to act on the running app.

- What screen is currently visible?
- What native View, WebView DOM, and Flutter Widget structure exists?
- Which elements can be tapped, typed into, or scrolled? What scripts can run inside a WebView?
- What network requests, logs, state changes, and events happened after an action?
- Did the app actually move into the expected state after a code change or runtime action?

## Modules

```text
android/ai-app-bridge-android          Android runtime SDK
android/ai-app-bridge-gradle-plugin   Debug build instrumentation plugin
flutter/ai_app_bridge_flutter         Flutter plugin
desktop/ai-app-bridge-cli             Node CLI and MCP stdio server
examples/android-native-sample        Clean Android sample app
docs                                  Design, integration, and test notes
```

## Core Capabilities

- Local bridge status on `127.0.0.1:18080`
- Android View tree, window tree, and screenshots
- Native UI tap support, with desktop-side ADB / UIAutomator fallback operations
- Native Android WebView DOM snapshots and JavaScript evaluation
- Flutter Widget snapshots, semantic action metadata, and runtime action handling
- Flutter H5 adapter registry for exposing Dart-side WebViews to AI agents
- Logs, network requests, state records, and event buffers with incremental `sinceId` / `sinceMs` reads
- Debug Gradle plugin support for OkHttp auto capture
- Node CLI / MCP stdio server for connecting AI tools to runtime capabilities

## Android Quick Start

Add the Android runtime SDK to debug builds:

`settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven("https://jitpack.io")
    }
}
```

`app/build.gradle.kts`:

```kotlin
dependencies {
    debugImplementation("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-android:0.1.4")
}
```

The runtime SDK starts automatically in debuggable Android apps through its init provider.

Optional OkHttp auto capture is provided by the debug Gradle plugin:

`settings.gradle.kts`:

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
        maven("https://jitpack.io")
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.id == "io.github.lidongping.aiappbridge.android") {
                useModule("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-gradle-plugin:${requested.version}")
            }
        }
    }
}
```

`app/build.gradle.kts`:

```kotlin
plugins {
    id("io.github.lidongping.aiappbridge.android") version "0.1.4"
}

aiAppBridge {
    setOkHttpCaptureEnabled(true)
}
```

## Flutter Quick Start

Add the Flutter plugin:

```yaml
dependencies:
  ai_app_bridge_flutter:
    git:
      url: https://github.com/ldpGitHub/ai-app-bridge.git
      path: flutter/ai_app_bridge_flutter
      ref: 0.1.4
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
git clone https://github.com/ldpGitHub/ai-app-bridge.git
cd ai-app-bridge/desktop/ai-app-bridge-cli
npm install -g .

ai-app-bridge status --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge tree --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge-mcp
```

Use `--serial <deviceId>` when more than one Android device is connected.

`smoke` is the full self-test command for this repository's sample app. After installing `examples/android-native-sample`, run:

```bash
ai-app-bridge smoke --package-name io.github.lidongping.aiappbridge.sample
```

## Debug Builds Only

AI App Bridge exposes runtime inspection and operation surfaces. Wire it into debug builds only. Do not ship it in production / release builds unless you have completed a deliberate security review for your own environment.

## License

AI App Bridge is licensed under the [Apache License 2.0](LICENSE).

If you distribute modified versions, keep the license and copyright notices and clearly state that your version is based on or modified from AI App Bridge. See [NOTICE](NOTICE).
