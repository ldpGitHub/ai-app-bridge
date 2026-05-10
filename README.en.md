# AI App Bridge

English | [中文](README.md)

AI App Bridge is a mobile runtime bridge for autonomous AI agents. It turns a running Android / Flutter app into an observable, operable, and verifiable environment: an AI agent can inspect the current app, operate native UI and WebViews, read View tree / Widget tree / DOM data, collect network requests and logs, verify runtime results, and continue the next iteration.

Its goal is to let AI agents drive mobile development from real runtime results: observe the current screen, perform the next action, read the resulting state changes, then decide the next fix or verification step.

## Why

Screenshot-only automation is fragile. A useful autonomous AI iteration loop needs runtime evidence and operation channels:

- What screen is currently visible?
- What native View, WebView DOM, and Flutter Widget structure exists?
- Where should the AI tap, what should it type, where should it scroll, or what script should it run inside a WebView?
- What network requests, logs, state changes, and events happened after an action?
- Did the app actually move into the expected state after a code change or runtime action?

AI App Bridge provides that structured runtime surface so an AI agent can observe, act, read results, verify, and keep iterating with less guesswork.

## Modules

```text
android/ai-app-bridge-android          Android runtime SDK
android/ai-app-bridge-gradle-plugin   Debug build instrumentation plugin
flutter/ai_app_bridge_flutter         Flutter plugin
desktop/ai-app-bridge-cli             Node CLI and MCP stdio server
examples/android-native-sample        Clean Android sample app
docs                                  Design, integration, and test notes
```

## Capabilities For AI Agents

- Android bridge status on `127.0.0.1:18080`
- Android View tree, window tree, and screenshots for understanding the current UI
- Native Android UI tap support, with desktop-side ADB / UIAutomator fallback operations
- Native Android WebView DOM snapshots and JavaScript evaluation
- Flutter Widget snapshots, semantic action metadata, and runtime action handling
- Flutter H5 adapter registry for exposing Dart-side WebViews to AI agents
- Logs, network requests, state records, and event buffers with incremental `sinceId` / `sinceMs` reads
- Debug Gradle plugin support for OkHttp HTTP auto capture
- Node CLI and MCP stdio server so AI tools can access these runtime capabilities through a standard command surface

## Android Quick Start

Add the Android runtime SDK to debug builds:

`settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
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
    debugImplementation("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-android:0.1.3")
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
    id("io.github.lidongping.aiappbridge.android") version "0.1.3"
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

## Debug-only

AI App Bridge exposes runtime inspection and operation surfaces. It should be wired into debug builds only. Do not ship it in production/release builds unless you have made a deliberate security review for your own environment.

## License

AI App Bridge is licensed under the [Apache License 2.0](LICENSE).

If you distribute modified versions, keep the license and copyright notices and clearly state that your version is based on or modified from AI App Bridge. See [NOTICE](NOTICE).
