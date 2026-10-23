plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
    namespace = "it.spazio.tv"
    compileSdk = 35
    defaultConfig {
        applicationId = "it.spazio.tv"
        minSdk = 30
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildTypes { release { isMinifyEnabled = false } }
}
dependencies { implementation("androidx.webkit:webkit:1.12.1") }
