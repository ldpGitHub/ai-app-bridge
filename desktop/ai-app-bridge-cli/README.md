# AI App Bridge CLI

```bash
npm install -g @lidongping/ai-app-bridge

ai-app-bridge status --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge tree --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge install-apk --package-name io.github.lidongping.aiappbridge.sample --apk-path app-debug.apk
ai-app-bridge screenshot --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge input-text --text hello --hide-keyboard
ai-app-bridge network --package-name io.github.lidongping.aiappbridge.sample --compact --url-filter /api/
ai-app-bridge webview-network --package-name io.github.lidongping.aiappbridge.sample --duration-ms 3000
ai-app-bridge-mcp
```

WebView network and console capture use Android WebView DevTools/CDP when the
target app is debuggable and WebView debugging is enabled.

When `screenshot` or `smoke` runs without `--out-file`, the CLI writes a unique
PNG under `ai_app_bridge_artifacts` instead of reusing a stable filename.
Use `--artifact-dir` to choose that directory, or `--out-file` when a fixed path
is intentional.
