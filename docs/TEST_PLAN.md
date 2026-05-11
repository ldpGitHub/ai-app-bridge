# Test Plan

## Static Checks

```bash
node -c desktop/ai-app-bridge-cli/bin/ai-app-bridge.js
node -c desktop/ai-app-bridge-cli/bin/mcp-server.js
cd desktop/ai-app-bridge-cli && npm test
node bin/ai-app-bridge.js --help
```

## Android Sample Smoke

Build and install the sample app, then run:

```bash
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js smoke --package-name io.github.lidongping.aiappbridge.sample
```

The smoke covers status, Android tree, UIAutomator tree, screenshot, native tap, native WebView DOM operations, logs, network, state, events, permission state, Flutter snapshot availability when a Flutter host is present, and OkHttp auto capture when the plugin is enabled.

## External App Validation

For unattended compatibility runs, validate at least:

```bash
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js status --package-name <package>
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js tree --package-name <package>
node desktop/ai-app-bridge-cli/bin/ai-app-bridge.js screenshot --package-name <package> --out-file <file>
```

Large Gradle apps should run under an external watchdog that records the last
output timestamp, build process state, and APK artifact presence before killing
a stale run.
