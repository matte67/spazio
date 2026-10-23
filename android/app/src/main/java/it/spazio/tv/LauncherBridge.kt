package it.spazio.tv

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ExecutorService

/** Small RPC whitelist. Slow package/icon reads never block the UI thread. */
class LauncherBridge(
    private val activity: Activity,
    private val repository: ApplicationRepository,
    private val inputShortcuts: InputShortcutRepository,
    private val homeContent: HomeContentRepository,
    private val requestContentAccess: () -> Unit,
    private val executor: ExecutorService,
    private val respond: (String) -> Unit,
) {
    @JavascriptInterface
    fun postMessage(payload: String) {
        if (payload.length > MAX_REQUEST_LENGTH) return
        executor.execute {
            var id = ""
            try {
                val request = JSONObject(payload)
                id = request.getString("id")
                when (request.getString("method")) {
                    "getHomeContent" -> success(id, homeContent())
                    "requestContentAccess" -> {
                        activity.runOnUiThread { requestContentAccess() }
                        success(id, JSONObject.NULL)
                    }
                    "openHomeContent" -> {
                        val intent = homeContent.launchIntent(request.getJSONObject("params").getString("id"))
                            ?: throw IllegalArgumentException("Contenuto non più disponibile")
                        launch(id, intent)
                    }
                    "getInputShortcuts" -> success(id, JSONArray(inputShortcuts.availableIds()))
                    "openInputShortcut" -> {
                        val intent = inputShortcuts.launchIntent(request.getJSONObject("params").getString("id"))
                        if (intent == null) failure(id, "HDMI 3 non disponibile su questa TV.")
                        else launch(id, intent)
                    }
                    "getApplications" -> success(id, applications())
                    "getDeviceInfo" -> success(id, JSONObject()
                        .put("model", Build.MODEL).put("androidVersion", Build.VERSION.RELEASE))
                    "launchApplication" -> {
                        val intent = repository.launchIntent(request.getJSONObject("params").getString("id"))
                            ?: throw IllegalArgumentException("App non disponibile. Aggiorna l’elenco.")
                        launch(id, intent)
                    }
                    "openSystemSettings" -> launch(id, Intent(Settings.ACTION_SETTINGS))
                    else -> failure(id, "Operazione Android non supportata.")
                }
            } catch (error: Exception) {
                Log.w(TAG, "Native operation failed", error)
                failure(id, "Operazione non riuscita. Riprova o aggiorna le applicazioni.")
            }
        }
    }

    private fun homeContent(): JSONObject {
        val feed = homeContent.read()
        return JSONObject().put("status", feed.status).put("items", JSONArray().apply {
            feed.items.forEach { item ->
                put(JSONObject().put("id", item.id).put("title", item.title)
                    .put("appName", item.appName).put("appId", item.appId).put("kind", item.kind)
                    .put("image", if (item.image != null) "https://appassets.androidplatform.net/home-art/${android.net.Uri.encode(item.id)}" else item.appIcon ?: JSONObject.NULL)
                    .put("imageKind", if (item.image != null) "poster" else "app-icon")
                    .put("fallbackImage", item.appIcon ?: JSONObject.NULL)
                    .put("progress", item.progress ?: JSONObject.NULL))
            }
        })
    }

    private fun applications(): JSONArray = JSONArray().apply {
        repository.list().forEach { app ->
            put(JSONObject().put("id", app.id).put("name", app.name)
                .put("icon", app.icon ?: JSONObject.NULL)
                .put("banner", app.banner ?: JSONObject.NULL))
        }
    }

    private fun launch(id: String, intent: Intent) {
        activity.runOnUiThread {
            try { activity.startActivity(intent); success(id, JSONObject.NULL) }
            catch (error: Exception) {
                Log.w(TAG, "Activity unavailable", error)
                failure(id, "Impossibile aprire l’app sulla TV.")
            }
        }
    }

    private fun success(id: String, result: Any) = respond(JSONObject().put("id", id).put("result", result).toString())
    private fun failure(id: String, message: String) = respond(JSONObject().put("id", id).put("error", message).toString())
    companion object { private const val TAG = "SpazioBridge"; private const val MAX_REQUEST_LENGTH = 4096 }
}
