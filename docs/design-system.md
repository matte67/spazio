# Spazio · Product Design System

Primary hierarchy: compact glass navigation → preferred applications.
The user's IMG_3374.HEIC sketch is the layout reference: dark frame, vertical dock,
large application artwork fading into the card and the trailing screen edge, progressive
wallpaper blur. The TV canvas remains 1920×1080; mobile has a horizontal dock, a single favorite column and two application columns.

- Palette: ink `#101719`, warm white `#f4f5f0`, secondary `#bac3bf`, sage accent `#dce6ce`.
- Favorite rail: 64px transparent edge fades on both sides, with 78px left and 90px right
  content/scroll insets so focused logos remain visible. Static mobile favorites have no mask.
- Home placement: section top padding 46px on desktop, 34px below 1400px, 28px on mobile.
- Typography: local system sans, section heading 40px at 1920px, app labels 21px.
- Geometry: dark frame inset 20px, screen radius 34px; app tiles 24px; panels 28px.
- Dock geometry: outer radius 44px, inset 10px, control radius 34px. Mobile 36 / 8 / 28px.
- Independent app surfaces represent actions. No decorative nested cards. Every app surface has the explicitly requested soft Apple-style shadow (`--card-shadow`).
- White 3px focus outlines are an explicit accessibility exception to the border rule.
- Wallpaper: shared WallpaperBackdrop component, base blur 12px and masked lower blur 42px.
  The same treatment applies to its optional imageUrl replacement; mobile uses 8 / 24px.
  Available local sources: the original SVG variants and user-supplied `bg-1.jpg`, `bg-2.jpg`,
  every supported image in `public/wallpapers`, discovered automatically at development/build time.
  One presentation catalog supplies both the backdrop and settings thumbnails;
  the persisted domain identifier selects the source. No remote catalog is fetched.
- App wordmarks in the browser are illustrative; installed Android apps supply their own icons,
  banners and labels. Favorite app logos are transparent SVG or official transparent artwork,
  independent of opaque Android icons. The large logo floats to the left of the inset card surface,
  with a dark fade behind it overlapping the actual application banner. The fade is a separate
  unclipped layer whose radial falloff reaches transparency inside its bounds, preventing a hard
  edge at the scrolling rail.
  Cards use the application's own banner, never the launcher's wallpaper. Missing banners
  leave the neutral surface visible. Desktop fixtures are sourced from the installed TV apps.
  Favorite banners use the configurable `--favorite-banner-blur` with 12% overscan; transparent foreground logos stay sharp.
- Ecosystem: greenfield repository. Semantic buttons, Lucide icons, Radix Dialog for focus trapping,
  announcements and accessible modal semantics; CSS for simple transitions. No need for a layout animation library.
- Focus scales app tiles in 180ms. Page changes fade/translate in 260ms. Settings drawer enters
  in 280ms. Reduced motion and the in-app animation switch remove travel and scaling.
- User-requested exceptions: glass treatment and capsule geometry for the compact navigation dock;
  the dark outer frame directly follows the sketch. No decorative card nesting is introduced.
- Mobile preserves all navigation/actions with an in-flow dock; it is a development convenience.
- No concentric decorative surfaces: dialog actions, app icons and option buttons are independent controls.
- No launcher wordmark, remote hints or model/preview footer. Browser app launch opens an explicit preview dialog.
- “Mostra decorazioni” in Personalizza toggles only the bottom artwork, persists across reloads,
  and defaults to enabled for existing preferences. The wallpaper selection remains independent.
- Bottom artwork: user-supplied `public/sfondo-in-basso.png`, intrinsic aspect ratio, 60% of the inner
  screen width, centered and anchored to its bottom, translated down by 8% of the artwork height. It stays sharp, above the blurred wallpaper
  and below all controls; the screen clips it beneath the outer frame.
- The Android adapter never substitutes fake apps on failure.

## Shared app content

- Both rows follow the favorite app order. Provider order stays intact within each app;
  nonfavorite app content follows after favorites. App package IDs, never translated labels,
  establish this mapping.
- Optional home rows below favorites: “Continua a guardare” and “Consigli dalle tue app”.
- On Android, content comes only from the TV provider with `READ_TV_LISTINGS`; no inferred history
  or synthetic fallback. The browser adapter supplies 11 fictional examples, labelled as synthetic,
  with local vector cover illustrations and varied playback progress. They never represent a user account
  or real provider recommendations; selecting one explains that there is no real video to play.
- Switch “Consigli e continua a guardare” in Personalizza, persisted independently of favorites.
  Turning it off hides the section and stops reads and periodic refreshes.
- Rails fade at both edges (40px desktop, 24px mobile); matching scroll padding keeps
  focused controls inside the fully opaque area. `useRailEdgeFade` aligns pane-level masks with
  the scroll viewport; the rail and card must not mask their backdrop descendants.
- Existing semantic buttons and spatial navigation; content columns are 320px wide on desktop,
  264px on mobile. One transparent button groups three visually separate, spaced elements:
  cover → optional playback state → provider metadata. There is no shared surface or inset frame.
- The 16:9 cover has no background fill, with a 24px radius (20px mobile).
- Playback state and metadata each own the exact navbar background/filter tokens
  (`--navigation-surface`, `--navigation-filter`), including actual backdrop blur, without an opaque base.
  The compact progress container uses a 10px radius and 8px vertical / 12px horizontal padding.
  The text container uses a 20px radius (18px mobile) and 14px vertical / 16px horizontal padding.
  All three blocks span the same width and are separated by 10px gaps.
- There are no decorative nested surfaces: these panes are siblings with distinct content roles.
  Shadows retain the user's explicit preference. Keyboard focus outlines only the cover.
- Only real supplied progress produces a playback pane; recommendations do not imply viewing history.
  Metadata is one title and one provider line. Local app icons remain the explicit artwork fallback.
- Content cards lift 4px on focus in the existing motion duration; row entrance uses `scene-enter`.
  Existing reduced-motion settings suppress both motions.
- Empty, permission, preview and unavailable states have one heading and one sentence.
- The UI receives opaque provider IDs. Android owns deep links, validates the source app and
  resolves them within that package. Browsable records only; no private account access.
- Artwork sources are provider-owned local images or HTTPS cover URLs, with installed app icons
  as fallback. The user explicitly authorized Internet access for these covers. The WebView
  still cannot navigate remote pages; native image requests are bounded, decoded and cached.

## Settings focus on TV

- Dock hover styling is gated by `(hover: hover) and (pointer: fine)`; Android WebView's
  persistent synthetic `:hover` must not leave a dock highlight or tooltip behind.
- Focus styling remains independent and visible for D-pad navigation. On Android, closing
  Personalizza by Back or its close button resumes focus at the first available content action,
  with Home as the empty fallback. An explicit Home event still focuses Home.
- Browser dialogs restore their trigger for mouse/keyboard use.

## Time and theme dock

- A noninteractive glass dock sits at the top-left, aligned with the navigation dock's left edge.
  Shared `--dock-inset`, `--dock-size`, `--dock-padding`, `--dock-radius` and glass tokens keep
  geometry and surface consistent. The status dock exactly swaps the vertical navigation dimensions:
  252×88px at 1920px, 222×78px below 1400px, with all clock/theme combinations retaining this size.
  At 1920px its radius is 44px, 38px from
  the inner frame's top and left. Below 1400px: 78px / 39px / 28px.
- The clock in this dock shows hours/minutes only, with no date. For unbranded wallpapers,
  the day/night symbol is to the left:
  sun from 06:00 to before 18:00, moon otherwise, using the device's local clock, not weather data.
- The wallpaper catalog supplies optional logos: Louis Vuitton, Rick and Morty, Minecraft and Marvel.
  When a logo is present it replaces the sun/moon symbol, keeping only time plus logo.
  The logo remains when the clock is disabled; an empty dock is not rendered.
  `bg-7` is abstract illustrated artwork, not identified as a Rick and Morty theme.
- The dock is informational and adds no D-pad stops. Clock state updates inside its own component.
  Mobile stacks it above the already horizontal navigation dock, matching its 204×72px geometry
  and 36px radius. Theme layouts use a compact wordmark so the dock never grows.

## Wallpaper catalog and blur control

- Vite's build-time adapter discovers image files recursively, generates a static manifest and watches
  additions/removals during development. No filesystem API or Mac path leaks into the TV UI.
- The composition root injects catalog IDs into preference validation. Existing numbered JPG IDs stay
  stable; other relative paths receive encoded IDs, including extensions to prevent collisions.
- All current wallpapers have descriptive names. Unknown new filenames become readable labels.
- “Sfoca sfondo” persists `blurWallpaper` (default true). Off removes both wallpaper blur layers and
  their overscan; native glass and card artwork retain their own blur. Image shading is independent.
