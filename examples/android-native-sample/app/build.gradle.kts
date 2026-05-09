plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("io.github.lidongping.aiappbridge.android")
}

android {
    namespace = "io.github.lidongping.aiappbridge.sample"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.lidongping.aiappbridge.sample"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }
}

dependencies {
    implementation(project(":ai-app-bridge-android"))
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
