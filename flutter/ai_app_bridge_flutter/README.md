# AI App Bridge Flutter

Flutter plugin for AI App Bridge. It exposes Flutter widget snapshots, runtime actions, structured logs, network records, state records, events, and H5 adapter registration so local AI agents can inspect, operate, verify, and iterate on Flutter apps.

## Install

```yaml
dependencies:
  ai_app_bridge_flutter:
    git:
      url: https://github.com/ldpGitHub/ai-app-bridge.git
      path: flutter/ai_app_bridge_flutter
      ref: 0.1.3
```

## Initialize

```dart
import 'package:ai_app_bridge_flutter/ai_app_bridge_flutter.dart';

AiAppBridge.instance.initialize(appName: 'sample_app');
```

## WebView Adapter

Flutter WebView DOM support requires a registered H5 adapter because the WebView controller lives in Dart:

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

AI App Bridge is intended for debug builds. Do not expose runtime control surfaces in production builds without a deliberate security review.
