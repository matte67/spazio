package it.spazio.tv

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.tv.TvContract
import android.media.tv.TvInputInfo
import android.media.tv.TvInputManager

/** Input shortcuts are capabilities, kept separate from installed application packages. */
interface InputShortcutRepository {
    fun availableIds(): List<String>
    fun launchIntent(id: String): Intent?
}

/** Verified MiTV-MSSP2 mapping: HDMI port 3 is MediaTek hardware input 4. */
class AndroidInputShortcutRepository(context: Context) : InputShortcutRepository {
    private val inputs = context.getSystemService(TvInputManager::class.java)
    private val packages = context.packageManager

    override fun availableIds(): List<String> =
        if (launchIntent(PS4_SHORTCUT_ID) != null) listOf(PS4_SHORTCUT_ID) else emptyList()

    override fun launchIntent(id: String): Intent? {
        if (id != PS4_SHORTCUT_ID) return null
        val input = inputs?.getTvInputInfo(HDMI_THREE_INPUT_ID) ?: return null
        if (!input.isPassthroughInput || input.type != TvInputInfo.TYPE_HDMI) return null
        // This firmware resolves passthrough links only with the explicit channel MIME type.
        val intent = Intent(Intent.ACTION_VIEW).setDataAndType(
            TvContract.buildChannelUriForPassthroughInput(input.id),
            TvContract.Channels.CONTENT_ITEM_TYPE,
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val activity = packages.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
            ?.activityInfo ?: return null
        if (!activity.exported) return null
        return intent.setClassName(activity.packageName, activity.name)
    }

    companion object {
        private const val PS4_SHORTCUT_ID = "shortcut:ps4-hdmi3"
        private const val HDMI_THREE_INPUT_ID = "com.mediatek.tvinput/.hdmi.HDMIInputService/HW4"
    }
}
