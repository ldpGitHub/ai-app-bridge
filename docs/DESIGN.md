# Design

AI App Bridge gives desktop agents a repeatable app loop:

1. Observe structured app state.
2. Act on Android, Flutter, or H5 surfaces.
3. Read logs, network, state, events, view trees, widget trees, and DOM.
4. Decide the next action.

## Boundaries

- Android runtime SDK: local HTTP bridge, Android View tree, native WebView DOM, capture buffers, public record APIs, foreground Activity tracking.
- Android Gradle plugin: debug-only instrumentation such as OkHttp auto capture.
- Flutter plugin: WidgetInspector snapshots, runtime actions, Flutter log/network/state/event forwarding, Flutter H5 adapter registry.
- Desktop CLI/MCP: ADB, UIAutomator, screenshots, device input, port forwarding, and MCP command wrapping.

The core runtime must not depend on a business network stack or business page code.

## First Follow-Up

The Android and Flutter bridge can already support an AI loop by polling. The next infrastructure step is a higher-level MCP observation tool that returns incremental logs, network, state, events, and status by cursor.
