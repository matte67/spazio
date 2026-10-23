package it.spazio.tv

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.URL

/** Bounded image-only loader. Sources come from the provider, never from WebView URLs. */
class HomeArtworkLoader(private val context: Context, private val repository: HomeContentRepository) {
    private val cache = object : LruCache<String, ByteArray>(CACHE_BYTES) {
        override fun sizeOf(key: String, value: ByteArray): Int = value.size
    }
    fun response(id: String): WebResourceResponse {
        val source = repository.artwork(id) ?: return unavailable()
        val bytes = cache.get(source.toString()) ?: try {
            val encoded = when (source.scheme) {
                "content", "android.resource" -> context.contentResolver.openInputStream(source)?.use(::readBounded)
                "https" -> download(source.toString())
                else -> null
            } ?: return unavailable()
            thumbnail(encoded)?.also { cache.put(source.toString(), it) } ?: return unavailable()
        } catch (_: Exception) { return unavailable() }
        return WebResourceResponse("image/jpeg", null, ByteArrayInputStream(bytes))
    }
    private fun download(source: String): ByteArray? {
        var target = source
        repeat(MAX_REDIRECTS + 1) {
            val url = URL(target)
            if (url.protocol != "https" || url.userInfo != null || url.host.isBlank()) return null
            if (InetAddress.getAllByName(url.host).any { it.isAnyLocalAddress || it.isLoopbackAddress ||
                it.isLinkLocalAddress || it.isSiteLocalAddress || it.isMulticastAddress }) return null
            val connection = url.openConnection() as HttpURLConnection
            try {
                connection.connectTimeout = NETWORK_TIMEOUT_MS
                connection.readTimeout = NETWORK_TIMEOUT_MS
                connection.instanceFollowRedirects = false
                val status = connection.responseCode
                if (status in 300..399) {
                    target = URL(url, connection.getHeaderField("Location") ?: return null).toString()
                } else {
                    if (status != 200 || connection.contentLengthLong > MAX_SOURCE_BYTES ||
                        connection.contentType?.startsWith("image/") != true) return null
                    return connection.inputStream.use(::readBounded)
                }
            } finally { connection.disconnect() }
        }
        return null
    }
    private fun readBounded(input: InputStream): ByteArray? = ByteArrayOutputStream().use { output ->
        val buffer = ByteArray(16 * 1024)
        var total = 0
        while (true) {
            val count = input.read(buffer)
            if (count == -1) break
            total += count
            if (total > MAX_SOURCE_BYTES) return null
            output.write(buffer, 0, count)
        }
        output.toByteArray()
    }
    private fun thumbnail(bytes: ByteArray): ByteArray? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0 || bounds.outWidth.toLong() * bounds.outHeight > MAX_SOURCE_PIXELS) return null
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > MAX_ARTWORK_EDGE) sample *= 2
        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size,
            BitmapFactory.Options().apply { inSampleSize = sample }) ?: return null
        return try {
            ByteArrayOutputStream().use { stream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 85, stream)
                stream.toByteArray()
            }
        } finally { bitmap.recycle() }
    }
    private fun unavailable() = WebResourceResponse("text/plain", "utf-8", 404,
        "Not Found", emptyMap(), ByteArrayInputStream(byteArrayOf()))
    companion object {
        private const val CACHE_BYTES = 4 * 1024 * 1024
        private const val MAX_SOURCE_BYTES = 2 * 1024 * 1024
        private const val MAX_SOURCE_PIXELS = 24_000_000L
        private const val MAX_ARTWORK_EDGE = 640
        private const val MAX_REDIRECTS = 2
        private const val NETWORK_TIMEOUT_MS = 3500
        const val PATH_PREFIX = "/home-art/"
    }
}
