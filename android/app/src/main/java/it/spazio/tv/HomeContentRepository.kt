package it.spazio.tv

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.media.tv.TvContract

/** Permission declared by the TV provider; not exported as a public SDK constant. */
object TvContentAccess { const val READ_PERMISSION = "android.permission.READ_TV_LISTINGS" }

/** Only identifiers and display metadata cross the WebView bridge; intents stay native. */
data class HomeContentItem(
    val id: String, val title: String, val appName: String, val appId: String, val kind: String,
    val image: Uri?, val appIcon: String?, val target: Intent, val progress: Double?,
)
data class HomeContentFeed(val status: String, val items: List<HomeContentItem>)

interface HomeContentRepository {
    fun read(): HomeContentFeed
    fun launchIntent(id: String): Intent?
    fun artwork(id: String): Uri?
}

/** Reads only content shared through Android TV's public provider under this app's UID. */
class AndroidHomeContentRepository(
    private val context: Context,
    private val applications: ApplicationRepository,
) : HomeContentRepository {
    @Volatile private var visibleItems: Map<String, HomeContentItem> = emptyMap()

    override fun read(): HomeContentFeed {
        if (context.checkSelfPermission(TvContentAccess.READ_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
            visibleItems = emptyMap()
            return HomeContentFeed("permission-required", emptyList())
        }
        val allowedApps = applications.list().associateBy { it.id }
        val items = mutableListOf<HomeContentItem>()
        var successfulQueries = 0
        for ((kind, table) in TABLES) {
            try {
                context.contentResolver.query(table, if (kind == "continue") PROJECTION + TvContract.WatchNextPrograms.COLUMN_WATCH_NEXT_TYPE else PROJECTION, null, null, null)?.use { cursor ->
                    successfulQueries++
                    val perApp = mutableMapOf<String, Int>()
                    var count = 0
                    while (cursor.moveToNext() && count < MAX_PER_KIND) {
                        if (cursor.number("browsable") == 0L) continue
                        val owner = cursor.text("package_name") ?: continue
                        val app = allowedApps[owner] ?: continue
                        if ((perApp[owner] ?: 0) >= MAX_PER_APP) continue
                        val title = cursor.text("title")?.take(MAX_TITLE_LENGTH) ?: continue
                        val target = safeIntent(cursor.text("intent_uri"), owner) ?: continue
                        val key = "$kind:${cursor.getLong(cursor.getColumnIndexOrThrow("_id"))}"
                        val image = cursor.text("poster_art_uri") ?: cursor.text("thumbnail_uri")
                        val position = cursor.number("last_playback_position_millis")
                        val duration = cursor.number("duration_millis")
                        val displayKind = if (kind == "continue" && cursor.number(TvContract.WatchNextPrograms.COLUMN_WATCH_NEXT_TYPE) != TvContract.WatchNextPrograms.WATCH_NEXT_TYPE_CONTINUE.toLong()) "recommendation" else kind
                        val progress = if (displayKind == "continue" && duration > 0 && position >= 0)
                            (position.toDouble() / duration).coerceIn(0.0, 1.0) else null
                        items += HomeContentItem(key, title, app.name, owner, displayKind, safeArtwork(image), app.icon, target, progress)
                        perApp[owner] = (perApp[owner] ?: 0) + 1
                        count++
                    }
                }
            } catch (_: SecurityException) {
                // Some firmware restricts one table even when other shared content is readable.
            } catch (_: IllegalArgumentException) {
                // An unsupported provider must not prevent application launching.
            }
        }
        visibleItems = items.associateBy { it.id }
        return HomeContentFeed(if (successfulQueries > 0) "ready" else "unavailable", items)
    }

    override fun launchIntent(id: String): Intent? = visibleItems[id]?.target?.let(::Intent)
    override fun artwork(id: String): Uri? = visibleItems[id]?.image

    private fun safeIntent(value: String?, owner: String): Intent? {
        if (value.isNullOrBlank()) return null
        return try {
            val intent = Intent.parseUri(value, Intent.URI_INTENT_SCHEME)
            if (intent.component?.packageName?.let { it != owner } == true) return null
            if (intent.`package`?.let { it != owner } == true) return null
            if (intent.data?.scheme in setOf("file", "content", "javascript")) return null
            intent.selector = null
            intent.clipData = null
            intent.setPackage(owner)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            if (intent.resolveActivity(context.packageManager) == null) null else intent
        } catch (_: Exception) { null }
    }

    private fun safeArtwork(value: String?): Uri? = value?.let(Uri::parse)?.takeIf {
        it.scheme in setOf("https", "content", "android.resource")
    }

    private fun Cursor.text(name: String): String? {
        val index = getColumnIndex(name)
        return if (index < 0 || isNull(index)) null else getString(index)?.takeIf { it.isNotBlank() }
    }
    private fun Cursor.number(name: String): Long {
        val index = getColumnIndex(name)
        return if (index < 0 || isNull(index)) -1 else getLong(index)
    }

    companion object {
        private const val MAX_PER_KIND = 20
        private const val MAX_PER_APP = 8
        private const val MAX_TITLE_LENGTH = 200
        private val TABLES = listOf("continue" to TvContract.WatchNextPrograms.CONTENT_URI,
            "recommendation" to TvContract.PreviewPrograms.CONTENT_URI)
        private val PROJECTION = arrayOf("_id", "package_name", "title", "intent_uri",
            "poster_art_uri", "thumbnail_uri", "last_playback_position_millis", "duration_millis", "browsable")
    }
}
