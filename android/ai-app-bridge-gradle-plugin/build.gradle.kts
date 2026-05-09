plugins {
    `java-gradle-plugin`
    `maven-publish`
}

group = "io.github.lidongping.aiappbridge"
version = "0.1.0"

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

dependencies {
    implementation("com.android.tools.build:gradle-api:8.9.1")
    implementation("org.ow2.asm:asm:9.7")
}

gradlePlugin {
    plugins {
        create("aiAppBridgeAndroid") {
            id = "io.github.lidongping.aiappbridge.android"
            implementationClass = "io.github.lidongping.aiappbridge.gradle.AiAppBridgeGradlePlugin"
            displayName = "AI App Bridge Android Plugin"
            description = "Debug-only automatic capture instrumentation for AI App Bridge."
        }
    }
}

