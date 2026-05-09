# Integration

## Android

Add the runtime SDK to debug builds:

```kotlin
dependencies {
    debugImplementation("io.github.lidongping.aiappbridge:ai-app-bridge-android:0.1.0-SNAPSHOT")
}
```

During local source development, use a project dependency instead.

The runtime SDK starts automatically in debuggable apps through its init provider. Optional structured records can be emitted from app code:

```kotlin
AiAppBridge.recordLog("info", "OrderPage", "loaded", """{"id":"1"}""")
AiAppBridge.recordState("order", "current", """{"status":"open"}""")
AiAppBridge.recordEvent("ui", "submit_clicked", null)
```

Optional OkHttp HTTP auto capture is owned by the debug Gradle plugin:

```kotlin
plugins {
    id("io.github.lidongping.aiappbridge.android")
}

aiAppBridge {
    okHttpCaptureEnabled = true
}
```

## Flutter

Use the Flutter plugin:

```yaml
dependencies:
  ai_app_bridge_flutter:
    git:
      url: https://github.com/ldpGitHub/ai-app-bridge.git
      path: flutter/ai_app_bridge_flutter
```

Initialize once:

```dart
import 'package:ai_app_bridge_flutter/ai_app_bridge_flutter.dart';

AiAppBridge.instance.initialize(appName: 'sample_app');
```

Flutter WebView DOM requires a registered H5 adapter because the WebView controller lives in Dart:

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

## Desktop / MCP

```bash
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js status --package-name <android.package>
node desktop/ai-app-bridge-cli/bin/mcp-server.js
```

The desktop tool owns ADB port forwarding, UIAutomator, screenshots, input, permission dialogs, and MCP transport.

## Compatibility Notes

### Android / Native
- **OkHttp Auto Capture**: The Gradle plugin is compatible with OkHttp 3.12+ and 4.x. For versions below 3.12, the response body may not be fully captured due to API differences. If using R8/ProGuard, ensure OkHttp is kept from obfuscation to maintain reflection compatibility.
- **WebView Variants**: The bridge automatically recognizes `android.webkit.WebView`, Tencent X5 (`smtt`), UCWeb, and Crosswalk (`xwalk`). For other custom WebView implementations, register a custom `WebViewAdapter`.
- **Multi-Process Apps**: The bridge HTTP server binds to port 18080 and only initializes on the main app process.

### Flutter
- **Flutter SDK Requirements**: The bridge plugin depends on Flutter 3.10+ (Dart 3.0+) to utilize the latest `SemanticsNode` APIs and `rootPipelineOwner`. Older Flutter versions are not supported out of the box.
