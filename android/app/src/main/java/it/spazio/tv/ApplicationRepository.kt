package it.spazio.tv

import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream

/** Native DTOs are mapped explicitly to the web contract by the bridge. */
data class TvApplication(val id: String, val name: String, val icon: String?, val banner: String?)

interface ApplicationRepository {
    fun list(): List<TvApplication>
    fun launchIntent(id: String): Intent?
}

/** Package visibility is limited to TV-launchable activities in the manifest. */
class AndroidApplicationRepository(
    private val packageManager: PackageManager,
    private val ownPackage: String,
) : ApplicationRepository {
    private fun activities() = packageManager.queryIntentActivities(
        Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER), 0,
    ).filter { it.activityInfo.packageName != ownPackage }

    override fun list(): List<TvApplication> = activities()
        .distinctBy { it.activityInfo.packageName }
        .map { info ->
            val icon = encodeIcon(info.loadIcon(packageManager))
            val banner = info.activityInfo.loadBanner(packageManager)?.let { encodeIcon(it) }
            TvApplication(info.activityInfo.packageName, info.loadLabel(packageManager).toString(), icon, banner)
        }
        .sortedBy { it.name.lowercase() }

    override fun launchIntent(id: String): Intent? {
        // Never accept arbitrary intents/components from JavaScript.
        val activity = activities().firstOrNull { it.activityInfo.packageName == id } ?: return null
        return Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
            .setClassName(id, activity.activityInfo.name).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    private fun encodeIcon(drawable: Drawable): String? = runCatching {
        val width = 192
        val height = if (drawable.intrinsicWidth > drawable.intrinsicHeight) 108 else 192
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        drawable.setBounds(0, 0, width, height)
        drawable.draw(Canvas(bitmap))
        val bytes = ByteArrayOutputStream().use { stream ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            stream.toByteArray()
        }
        bitmap.recycle()
        "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
    }.getOrNull()
}
