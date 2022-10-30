import './App.scss';
import './scrollbar.scss';
import { MantineProvider } from '@mantine/core';
import _ from 'lodash';
import { StoreProvider, useStore } from '#api/store';
import Desktop from '#ui/desktop';
import Taskbar from '#ui/taskbar';
import { WindowManager } from '#ui/window';
import { useEffect, useMemo } from 'react';
import { Image } from 'image-js';

function Providers({ children }: any) {
  return (
    <MantineProvider>
      <StoreProvider>
        <WindowManager>
          <Variables />
          <Startup />
          <App />
        </WindowManager>
      </StoreProvider>
    </MantineProvider>
  );
}

type Wallpaper =
  | {
      type: 'image';
      url: string;
      layout: 'contain' | 'tiled' | 'cover';
    }
  | {
      type: 'color';
      color: string;
    }
  | undefined;

type WCache =
  | {
      url: string;
      cache: string;
    }
  | undefined;

async function cacheWallpaper(store: any) {
  const wallpaper: Wallpaper = store.get$('settings.wallpaper', 'system', '');
  const wcache: WCache = store.get$('settings.wcache', 'system', undefined);

  if (!wallpaper) return;
  if (wallpaper.type == 'color') return;
  if (wallpaper.url == wcache?.url ?? '') return;

  const data = (await Image.load(wallpaper.url))
    .blurFilter({ radius: 100 })
    .resize({ width: 512 })
    .toDataURL();

  store.set$('settings.wcache', { url: wallpaper.url, cache: data }, 'system');
}

function Startup() {
  const store = useStore();
  useEffect(() => {
    store.set$('system.boot_times', (v) => v + 1, 'system');
    store.set$(
      'settings.wallpaper',
      {
        type: 'image',
        url: '/assets/Web/4k/Wallpapers/default.jpg',
        layout: 'cover',
      },
      'system'
    );

    cacheWallpaper(store).then();
  }, []);

  return <></>;
}

function getWallpaperObject(wp: Wallpaper) {
  if (!wp) return {};
  return {
    url: wp.type == 'image' ? `url("${wp.url}")` : wp.color,
    size: wp.type == 'image' && wp.layout != 'tiled' ? wp.layout : 'auto',
    repeat: wp.type == 'image' && wp.layout != 'tiled' ? 'no-repeat' : 'repeat',
  };
}

function Variables() {
  const store = useStore();
  const wallpaper = store.get$('settings.wallpaper', 'system') as Wallpaper;
  const wcache = store.get$('settings.wcache', 'system') as WCache;
  const obj = useMemo(() => getWallpaperObject(wallpaper), [wallpaper]);

  return (
    <style>
      {`
    :root {
      --scaling: ${store.get$('settings.scaling', 'user', 1)};
      --timing: ${store.get$('settings.timing', 'user', 1)};
      --taskbar-opacity: ${store.get$('settings.transparency', 'user', 0.6)};
      --wp: ${obj.url};
      --wp-size: ${obj.size};
      --wp-repeat: ${obj.repeat}; 
      --wp-cache: ${!!wcache ? `url(${wcache.cache})` : obj.url}
    }
  `}
    </style>
  );
}

function App() {
  return (
    <MantineProvider
      inherit
      theme={{
        fontFamily: 'Segoe UI Variable',
        colorScheme: 'dark',
      }}
    >
      <Desktop />
      <Taskbar />
    </MantineProvider>
  );
}

export default Providers;
