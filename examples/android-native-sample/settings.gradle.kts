pluginManagement {
    includeBuild("../../android/ai-app-bridge-gradle-plugin")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ai-app-bridge-android-native-sample"

include(":app")
include(":ai-app-bridge-android")
project(":ai-app-bridge-android").projectDir = file("../../android/ai-app-bridge-android")
