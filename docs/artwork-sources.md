# Artwork sources

The supplied `public/sfondo-in-basso.png` is displayed without modification.

Transparent app artwork is separate from Android launcher icons:

- YouTube, Netflix and Spotify: SVG paths from [Simple Icons](https://github.com/simple-icons/simple-icons), using the installed package. The package includes source and license metadata.
- Prime Video: [official Amazon artwork](https://m.media-amazon.com/images/G/01/digital/video/web/logo-min-remaster.png), saved as `public/app-logos/prime.png`.
- Disney+: transparent logo served by the [official Disney+ website](https://www.disneyplus.com), saved as `public/app-logos/disney.png` from [its CDN](https://cnbl-cdn.bamgrid.com/assets/e41a64255b8a5840df6162a10642ad98f42a80d3ca8aeb5ebcd70f74d096c0b0/original).
- RaiPlay: transparent WebP embedded in the official [RaiPlay site stylesheet](https://www.raiplay.it/assets/css/components/base.css), saved as `public/app-logos/rai.webp`.

Artwork stays local for offline WebView operation. Unknown apps use the existing Lucide app symbol and their actual label. To support another transparent logo, extend the presentation registry in `application-logo.tsx`; no Android bridge changes are required.

The six `public/app-banners/*.png` fixtures are the original banners read from installed applications on the authorized MiTV-MSSP2. The Android adapter continues to read current installed app artwork directly.

`public/preview-content/*.svg` contains original vector illustrations for fictional browser examples:
orbital sky, mountains, city, coast, forest and sound waves. Titles and playback progress are synthetic;
association with a provider demonstrates layout and ordering only. These assets are used by
`PreviewPlatform`, never as a replacement for unavailable Android content.

Theme dock logos are bundled unchanged as local SVGs:

- Louis Vuitton monogram: [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:Louis_Vuitton_SVG_Monogram_Logo.svg), attributed there to Louis Vuitton. Displayed in white using CSS for the dark dock.
- Rick and Morty wordmark: [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:Rick_and_Morty.svg), attributed there to Adult Swim.
  Both source pages identify the artwork as text logos and retain their brand attribution.

- Minecraft wordmark: [Mojang Studios source SVG](https://github.com/Mojang/web-theme-bootstrap/blob/main/assets/svg/logos/minecraft-core-brand.svg), stored as `public/theme-logos/minecraft.svg`.
- Marvel wordmark: [Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:Marvel_Logo.svg), stored as `public/theme-logos/marvel.svg`; only the external DTD declaration was removed for offline loading.
