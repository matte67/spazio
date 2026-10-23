import React from 'react';
import ReactDOM from 'react-dom/client';
import { HomeContentService } from './application/home-content-service';
import { LauncherService } from './application/launcher-service';
import { AndroidPlatform } from './infrastructure/android-platform';
import { PreviewPlatform } from './infrastructure/preview-platform';
import { LocalPreferenceRepository } from './infrastructure/preferences';
import { WALLPAPER_OPTIONS } from './presentation/wallpapers';
import { LauncherApp } from './presentation/launcher-app';
import './presentation/styles.css';
// Composition root: platform selection happens once, outside the presentation layer.
const platform = window.AndroidLauncher
  ? new AndroidPlatform(window.AndroidLauncher)
  : new PreviewPlatform();
const homeContentService = new HomeContentService(platform);
const service = new LauncherService(
  platform,
  new LocalPreferenceRepository(
    window.localStorage,
    WALLPAPER_OPTIONS.map((option) => option.id),
  ),
);
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LauncherApp service={service} homeContentService={homeContentService} />
  </React.StrictMode>,
);
