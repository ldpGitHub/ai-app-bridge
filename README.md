# AI App Bridge

[English](README.en.md)

AI App Bridge 让 AI agent 可以直接接入正在运行的 Android / Flutter 应用。它提供原生 UI、WebView、View tree / Widget tree / DOM、网络请求和运行日志等运行时能力，让 AI 不只看截图，也能基于真实状态推进移动端开发。

它的核心目标是让 AI agent 按“观察 -> 操作 -> 读取结果 -> 验证 -> 继续迭代”的方式自主推进，而不是在缺少运行证据时猜测。

AI App Bridge is a mobile runtime bridge for autonomous AI agents. It lets agents inspect running Android and Flutter apps, operate native UI and WebViews, read view/widget/DOM trees, collect logs and network records, then follow an observe -> act -> read results -> verify -> iterate loop with real evidence.

## 解决的问题

移动端自动化如果只依赖截图，AI 很容易在关键细节上猜错。要让 AI 自主迭代，运行时需要同时提供两类能力：看清当前应用状态，并执行下一步动作。

- 当前页面处在什么状态？
- 原生 View、WebView DOM、Flutter Widget 的真实结构是什么？
- 哪些元素可以点击、输入或滚动？WebView 中能执行哪些脚本？
- 执行动作后产生了哪些网络请求、日志、状态变化和事件？
- 修改代码或触发操作后，应用是否真的进入了预期状态？

## 模块结构

```text
android/ai-app-bridge-android          Android runtime SDK
android/ai-app-bridge-gradle-plugin   Debug 构建插桩插件
flutter/ai_app_bridge_flutter         Flutter 插件
desktop/ai-app-bridge-cli             Node CLI 和 MCP stdio server
examples/android-native-sample        干净的 Android 示例应用
docs                                  设计、集成和测试文档
```

## 核心能力

- 本地 bridge 状态查询：`127.0.0.1:18080`
- Android View tree、窗口树和截图
- 原生 UI 点击，以及桌面端 ADB / UIAutomator 兜底操作
- 原生 Android WebView DOM 快照和 JavaScript 执行
- Flutter Widget 快照、语义动作信息和运行时动作处理
- Flutter H5 adapter registry，把 Dart 层 WebView 暴露给 AI agent
- 日志、网络请求、状态和事件缓冲区，支持 `sinceId` / `sinceMs` 增量读取
- Debug Gradle 插件支持 OkHttp HTTP 自动捕获
- Node CLI / MCP stdio server，方便 AI 工具接入运行时能力

## Android 快速接入

在目标 App 的 debug 构建里引入 Android runtime SDK：

`settings.gradle.kts`：

```kotlin
dependencyResolutionManagement {
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
    debugImplementation("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-android:0.1.4")
}
```

Runtime SDK 会在 debuggable Android 应用中通过 init provider 自动启动。

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
    id("io.github.lidongping.aiappbridge.android") version "0.1.4"
}

aiAppBridge {
    setOkHttpCaptureEnabled(true)
}
```

## Flutter 快速接入

在 Flutter 项目中添加插件：

```yaml
dependencies:
  ai_app_bridge_flutter: ^0.1.4
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
git clone https://github.com/ldpGitHub/ai-app-bridge.git
cd ai-app-bridge/desktop/ai-app-bridge-cli
npm install -g .

ai-app-bridge status --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge tree --package-name io.github.lidongping.aiappbridge.sample
ai-app-bridge-mcp
```

如果连接了多个 Android 设备，使用 `--serial <deviceId>` 指定设备。

`smoke` 是给本仓库 sample app 使用的完整自检命令；安装 `examples/android-native-sample` 后可以运行：

```bash
ai-app-bridge smoke --package-name io.github.lidongping.aiappbridge.sample
```

## 仅限 debug 构建

AI App Bridge 会暴露运行时检查和操作能力，建议只在 debug 构建接入。除非已经完成针对自身环境的安全评审，否则不要把它打进 production / release 包。

## 开源协议

AI App Bridge 使用 [Apache License 2.0](LICENSE) 开源。

如果你分发修改后的版本，请保留许可证和版权声明，并明确说明你的版本基于或修改自 AI App Bridge。详见 [NOTICE](NOTICE)。
