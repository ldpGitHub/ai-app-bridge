# AI App Bridge

AI App Bridge is a debug-only Android and Flutter bridge that lets a desktop AI agent inspect and operate an app through structured state instead of screenshots alone.

It is organized as one monorepo with independently publishable modules:

```text
android/ai-app-bridge-android          Android runtime SDK
android/ai-app-bridge-gradle-plugin   Debug build instrumentation plugin
flutter/ai_app_bridge_flutter         Flutter plugin
desktop/ai-app-bridge-cli             Node CLI and MCP stdio server
examples/android-native-sample        Clean Android sample app
docs                                  Design and integration notes
```

Package naming:

- Android namespace and Maven group: `io.github.lidongping.aiappbridge`
- Flutter package: `ai_app_bridge_flutter`
- Node package: `@lidongping/ai-app-bridge`
- Gradle plugin id: `io.github.lidongping.aiappbridge.android`

This repository is intentionally generic. Do not add company-specific app code, package names, host names, screenshots, device ids, or business fixtures.

## Current Scope

Proven Android/Flutter bridge surfaces extracted into this repository:

- Android bridge status on `127.0.0.1:18080`
- Android View tree and screenshots
- Native Android WebView DOM and JavaScript evaluation
- Logs, network, state, and event buffers with `sinceId` / `sinceMs` filters
- Flutter widget snapshot and runtime action handler
- Flutter H5 adapter registry
- Desktop ADB operations and UIAutomator fallback
- MCP wrapper over the Node CLI command surface
- Debug Gradle plugin first slice for OkHttp HTTP auto capture

The first public version should stay debug-only and source-installable. Maven, pub.dev, Gradle Plugin Portal, and npm publishing can come after API names and integration shape stabilize.

## Quick Commands

```bash
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js status --package-name io.github.lidongping.aiappbridge.sample
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js tree --package-name io.github.lidongping.aiappbridge.sample
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js smoke --package-name io.github.lidongping.aiappbridge.sample
node desktop/ai-app-bridge-cli/bin/mcp-server.js
```

Use `--serial <deviceId>` when more than one Android device is connected.
