# Test Plan

## Static Checks

```bash
node -c desktop/ai-app-bridge-cli/bin/ai-app-bridge.js
node -c desktop/ai-app-bridge-cli/bin/mcp-server.js
```

## Android Sample Smoke

Build and install the sample app, then run:

```bash
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js smoke --package-name io.github.lidongping.aiappbridge.sample
```

The smoke covers status, Android tree, UIAutomator tree, screenshot, native tap, native WebView DOM operations, logs, network, state, events, permission state, Flutter snapshot availability when a Flutter host is present, and OkHttp auto capture when the plugin is enabled.
