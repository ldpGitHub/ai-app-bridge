# AI App Bridge CLI

```bash
npm install -g @lidongping/ai-app-bridge

ai-app-bridge status --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge tree --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge install-apk --package-name io.github.lidongping.aiappbridge.sample --apk-path app-debug.apk
ai-app-bridge input-text --text hello --hide-keyboard
ai-app-bridge webview-network --package-name io.github.lidongping.aiappbridge.sample --duration-ms 3000
ai-app-bridge-mcp
```

WebView network and console capture use Android WebView DevTools/CDP when the
target app is debuggable and WebView debugging is enabled.
