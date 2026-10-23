package it.spazio.tv

import android.content.pm.PackageManager
import android.annotation.SuppressLint
import android.content.Intent
import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.util.concurrent.Executors

/** Offline WebView host with native Home intent and remote input handling. */
class MainActivity : Activity() {
    private lateinit var webView: WebView
    private val executor = Executors.newSingleThreadExecutor()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        webView.setBackgroundColor(0xff101719.toInt())
        setContentView(webView)
        // Android 11's PhoneWindow needs its decor attached before this lookup.
        webView.post {
            window.insetsController?.apply {
                hide(WindowInsets.Type.systemBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        }
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            allowFileAccess = false
            allowContentAccess = false
            setSupportMultipleWindows(false)
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        val repository = AndroidApplicationRepository(packageManager, packageName)
        val homeContent = AndroidHomeContentRepository(this, repository)
        val artwork = HomeArtworkLoader(this, homeContent)
        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = !trusted(request)
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                if (request.url.scheme == "https" && request.url.host == "appassets.androidplatform.net" &&
                    request.url.path?.startsWith(HomeArtworkLoader.PATH_PREFIX) == true) {
                    return artwork.response(request.url.lastPathSegment ?: "")
                }
                if (trusted(request)) return loader.shouldInterceptRequest(request.url)
                return WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(byteArrayOf()))
            }
        }
        val bridge = LauncherBridge(this, repository, AndroidInputShortcutRepository(this), homeContent, {
            requestPermissions(arrayOf(TvContentAccess.READ_PERMISSION), CONTENT_PERMISSION_REQUEST)
        }, executor) { response ->
            webView.post {
                if (!isDestroyed) webView.evaluateJavascript("window.spazioNativeResponse && window.spazioNativeResponse($response)", null)
            }
        }
        webView.addJavascriptInterface(bridge, "AndroidLauncher")
        webView.setInitialScale(0)
        webView.loadUrl(START_URL)
        webView.requestFocus()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CONTENT_PERMISSION_REQUEST) {
            webView.evaluateJavascript("window.dispatchEvent(new Event('spazio-content-changed'))", null)
        }
    }

    /** Reusing the Home task must return to favorites rather than an open panel. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.hasCategory(Intent.CATEGORY_HOME)) showHome()
    }

    private fun showHome() {
        webView.evaluateJavascript("window.dispatchEvent(new Event('spazio-home'))", null)
    }

    private fun trusted(request: WebResourceRequest): Boolean = request.url.scheme == "https" &&
        request.url.host == "appassets.androidplatform.net" && request.url.path?.startsWith("/assets/launcher/") == true

    /** Forward D-pad explicitly; synthetic Enter is activated by the web input adapter. */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_MENU) {
            if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) showHome()
            return true
        }
        val key = when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
            KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
            KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> "Enter"
            KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE -> "Escape"
            else -> return super.dispatchKeyEvent(event)
        }
        if (event.action == KeyEvent.ACTION_DOWN) {
            val quoted = JSONObject.quote(key)
            webView.evaluateJavascript(
                "document.dispatchEvent(new KeyboardEvent('keydown',{key:$quoted,bubbles:true,cancelable:true,repeat:${event.repeatCount > 0}}))", null,
            )
        }
        return true
    }

    override fun onDestroy() {
        webView.removeJavascriptInterface("AndroidLauncher")
        webView.destroy()
        executor.shutdownNow()
        super.onDestroy()
    }
    companion object { private const val CONTENT_PERMISSION_REQUEST = 40; private const val START_URL = "https://appassets.androidplatform.net/assets/launcher/index.html" }
}
