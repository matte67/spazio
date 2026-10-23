plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

// Release credentials come from the local environment, never from committed files.
val releaseStoreFile = System.getenv("SPAZIO_KEYSTORE_PATH")
val releaseStorePassword = System.getenv("SPAZIO_KEYSTORE_PASSWORD")
val releaseKeyAlias = System.getenv("SPAZIO_KEY_ALIAS")
val releaseKeyPassword = System.getenv("SPAZIO_KEY_PASSWORD")
val hasReleaseSigning = listOf(
    releaseStoreFile,
    releaseStorePassword,
    releaseKeyAlias,
    releaseKeyPassword,
).all { !it.isNullOrBlank() }
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
    signingConfigs {
        if (hasReleaseSigning) {
            create("production") {
                storeFile = file(requireNotNull(releaseStoreFile))
                storePassword = requireNotNull(releaseStorePassword)
                keyAlias = requireNotNull(releaseKeyAlias)
                keyPassword = requireNotNull(releaseKeyPassword)
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("production")
        }
    }
}
dependencies { implementation("androidx.webkit:webkit:1.12.1") }
