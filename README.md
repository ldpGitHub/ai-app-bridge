# AI App Bridge

[English](README.en.md)

AI App Bridge 是一个面向 AI 自主运行和闭环迭代的移动端运行时桥接工具。它把正在运行的 Android / Flutter App 暴露成一个可观测、可操作、可验证的环境：AI agent 可以检查当前应用、操作原生 UI 和 WebView、读取 View tree / Widget tree / DOM、收集网络请求与运行日志、判断操作结果，并继续下一轮改进。

它的核心目标是让 AI agent 直接基于真实运行结果推进移动端开发：看见当前界面、执行下一步动作、读取动作后的状态变化，再决定下一轮修复或验证。

AI App Bridge is a mobile runtime bridge for autonomous AI agents. It lets agents inspect running Android and Flutter apps, operate native UI and WebViews, read view/widget/DOM trees, collect logs and network records, verify runtime results, and keep iterating with real evidence.

## 为什么需要

只靠截图做自动化很脆弱。真正可用的 AI 自主迭代需要运行时证据和操作通道：

- 当前屏幕是什么？
- 原生 View、WebView DOM、Flutter Widget 的真实结构是什么？
- AI 应该点击哪里、输入什么、滚动到哪里，或在 WebView 中执行什么脚本？
- 执行动作后产生了哪些网络请求、日志、状态变化和事件？
- 修改代码或触发操作后，应用是否真的进入了预期状态？

AI App Bridge 提供这些结构化运行时能力，让 AI agent 能按“观察 -> 操作 -> 读取结果 -> 验证 -> 继续迭代”的方式自主推进，而不是在缺少运行证据时猜测。

## 模块结构

```text
android/ai-app-bridge-android          Android runtime SDK
android/ai-app-bridge-gradle-plugin   Debug 构建插桩插件
flutter/ai_app_bridge_flutter         Flutter 插件
desktop/ai-app-bridge-cli             Node CLI 和 MCP stdio server
examples/android-native-sample        干净的 Android 示例应用
docs                                  设计、集成和测试文档
```

## 为 AI agent 提供的能力

- Android bridge 状态：`127.0.0.1:18080`
- Android View tree、窗口树和截图，用于理解当前 UI
- 原生 Android UI 点击能力，配合桌面端 ADB / UIAutomator 兜底操作
- 原生 Android WebView DOM 快照和 JavaScript 执行
- Flutter Widget 快照、语义动作信息和运行时动作处理
- Flutter H5 adapter registry，用于把 Dart 层 WebView 暴露给 AI
- 日志、网络请求、状态、事件缓冲区，支持 `sinceId` / `sinceMs` 增量读取
- Debug Gradle 插件中的 OkHttp HTTP 自动捕获能力
- Node CLI 和 MCP stdio server，让 AI 工具可以通过标准命令面接入这些运行时能力

## Android 快速接入

在业务 App 的 debug 构建里引入 Android runtime SDK：

`settings.gradle.kts`：

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

`app/build.gradle.kts`：

```kotlin
dependencies {
    debugImplementation("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-android:0.1.3")
}
```

Runtime SDK 会通过 init provider 在 debuggable Android 应用中自动启动。

可选的 OkHttp 自动捕获由 debug Gradle 插件提供：

`settings.gradle.kts`：

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

`app/build.gradle.kts`：

```kotlin
plugins {
    id("io.github.lidongping.aiappbridge.android") version "0.1.3"
}

aiAppBridge {
    okHttpCaptureEnabled = true
}
```

## Flutter 快速接入

在 Flutter 项目里引入插件：

```yaml
dependencies:
  ai_app_bridge_flutter: ^0.1.0
```

初始化一次：

```dart
import 'package:ai_app_bridge_flutter/ai_app_bridge_flutter.dart';

AiAppBridge.instance.initialize(appName: 'sample_app');
```

Flutter WebView DOM 支持需要注册 H5 adapter，因为 WebView controller 在 Dart 层：

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

如果连接了多个 Android 设备，使用 `--serial <deviceId>` 指定设备。

## Debug-only

AI App Bridge 会暴露运行时检查和操作能力，应该只接入 debug 构建。除非你已经针对自己的环境做过明确的安全评审，否则不要把它打进 production/release 包。

## License

AI App Bridge 使用 [Apache License 2.0](LICENSE) 开源。

如果你分发修改后的版本，请保留许可证和版权声明，并明确说明你的版本基于或修改自 AI App Bridge。详见 [NOTICE](NOTICE)。
