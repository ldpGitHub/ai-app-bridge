# AI App Bridge

[English](README.en.md)

AI App Bridge 是一个面向 AI 闭环迭代的移动端运行时桥接工具：让 AI agent 能检查正在运行的应用、操作 UI 和 WebView、收集结构化运行时状态、验证结果，并继续迭代改进应用。

项目优先支持 Android 和 Flutter。当前实现刻意限定为 debug-only，方便团队在本地把运行时检查和操作能力暴露给 AI agent，同时避免这些能力进入生产包。

English summary: AI App Bridge is a runtime bridge for AI agents to inspect, operate, verify, and iterate on Android and Flutter apps. It exposes structured runtime state and control surfaces in debug builds, helping local AI agents close the mobile app iteration loop without shipping these capabilities in production builds.

## 为什么需要

只靠截图做自动化很脆弱。真正可用的 AI 编码闭环需要运行时证据：

- 当前屏幕是什么？
- 原生 View、WebView、Flutter Widget 的真实结构是什么？
- 执行动作后产生了哪些日志、网络记录、状态变化和事件？
- 修改代码后，应用是否真的进入了预期状态？

AI App Bridge 提供这些结构化运行时能力，让 AI agent 能更少猜测，完成“检查 -> 操作 -> 验证 -> 继续迭代”的闭环。

## 模块结构

```text
android/ai-app-bridge-android          Android runtime SDK
android/ai-app-bridge-gradle-plugin   Debug 构建插桩插件
flutter/ai_app_bridge_flutter         Flutter 插件
desktop/ai-app-bridge-cli             Node CLI 和 MCP stdio server
examples/android-native-sample        干净的 Android 示例应用
docs                                  设计、集成和测试文档
```

## 当前能力

- Android bridge 状态：`127.0.0.1:18080`
- Android View tree 快照和截图
- 原生 Android WebView DOM 快照和 JavaScript 执行
- 日志、网络、状态、事件缓冲区，支持 `sinceId` / `sinceMs` 过滤
- Flutter widget 快照和运行时动作处理
- Flutter H5 adapter registry
- 桌面端 ADB 操作和 UIAutomator 兜底
- Node CLI 命令面的 MCP 包装
- Debug Gradle 插件中的 OkHttp HTTP 自动捕获能力

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
    debugImplementation("com.github.ldpGitHub.ai-app-bridge:ai-app-bridge-android:0.1.0")
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
    id("io.github.lidongping.aiappbridge.android") version "0.1.0"
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

## 发布状态

Android 依赖首发走 JitPack：创建 Git tag 后，JitPack 会从 GitHub 拉取源码构建并提供 Maven 依赖。使用者只需要添加 JitPack 仓库并引入依赖，不需要 clone 或编译本仓库。

当前发布路径：

- Android runtime SDK：JitPack
- Gradle plugin：JitPack

后续独立发布目标：

- Flutter package：pub.dev
- Node CLI / MCP server：npm

## 安全边界

AI App Bridge 会暴露运行时检查和操作能力，应该只接入 debug 构建。除非你已经针对自己的环境做过明确的安全评审，否则不要把它打进 production/release 包。

这个仓库保持通用化。不要提交公司业务代码、业务包名、内部域名、截图、设备 id、凭据或业务测试数据。

## License

AI App Bridge 使用 [Apache License 2.0](LICENSE) 开源。

如果你分发修改后的版本，请保留许可证和版权声明，并明确说明你的版本基于或修改自 AI App Bridge。详见 [NOTICE](NOTICE)。
