plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("maven-publish")
}

group = "io.github.lidongping.aiappbridge"
version = "0.1.0-SNAPSHOT"

android {
    namespace = "io.github.lidongping.aiappbridge.android"
    compileSdk = 35

    defaultConfig {
        minSdk = 23
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])
                groupId = "io.github.lidongping.aiappbridge"
                artifactId = "ai-app-bridge-android"
                version = "0.1.0-SNAPSHOT"
            }
        }
    }
}

