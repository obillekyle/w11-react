import useIDB, { IDBFunc } from '@api/idb';
import Image from 'image-js';
import { addListener, launch, stop } from 'devtools-detector';
import CrashHandler from '@ui/crash';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const default_func = {
  get: (key: string, d?: unknown) => d,
  set: () => void '',
  remove: () => void '',
};

const OS = createContext<Record<'settings' | 'system' | 'user', IDBFunc>>({
  settings: default_func,
  system: default_func,
  user: default_func,
});

const crash = (error: string) => <CrashHandler error={error} />;
export const useSettings = () => useContext(OS).settings;
export const useSystem = () => useContext(OS).system;
export const useUsers = () => useContext(OS).user;

const OperatingSystem = (props: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const settings = useIDB('settings');
  const system = useIDB('system');
  const user = useIDB('users');

  useEffect(() => {
    if (import.meta.env.PROD) {
      addListener((e) => {
        setOpen((v) => (v ? v : e));
        if (e) stop();
      });
      launch();
    }
    return stop;
  }, []);

  const splash = <div className="boot-splash" />;
  const loading = settings.loading || system.loading || user.loading;
  if (loading) return splash;

  const errored = settings.error || system.error || user.error;
  if (errored) return crash('database_initialization_failed');
  if (!window['chrome']) return crash('unsupported_platform');
  if (import.meta.env.PROD && open) return crash('devtools_open');

  return (
    <OS.Provider value={{ settings, system, user }}>
      <Startup />
      <Variables />
      {props.children}
    </OS.Provider>
  );
};

async function cacheWallpaper(settings: IDBFunc) {
  const wallpaper: Wallpaper = settings.get('wallpaper');
  const wcache: WCache = settings.get('wallpaper-cache');

  if (!wallpaper) return;
  if (wallpaper.type != 'image') return;
  if (wallpaper.url == wcache?.url ?? '') return;

  const data = (await Image.load(wallpaper.url))
    .resize({ width: 512 })
    .blurFilter({ radius: 30 })
    .toDataURL();

  settings.set('wallpaper-cache', { url: wallpaper.url, cache: data });
}

function Startup() {
  const settings = useSettings();
  const wallpaper = settings.get('wallpaper');

  useEffect(() => {
    settings.set('boot-times', (v) => (v ?? 0) + 1);

    if (!wallpaper)
      settings.set('wallpaper', {
        type: 'image',
        url: '/assets/Web/4k/Wallpapers/default.jpg',
        layout: 'cover',
      });
  }, []);

  useEffect(() => {
    cacheWallpaper(settings).then();
  }, [wallpaper?.url]);

  return null;
}

function getWallpaperObject(wp: Wallpaper) {
  if (!wp) return {};
  const isImage = wp.type == 'image';

  return {
    url: isImage ? `url("${wp.url}")` : wp.color,
    size: isImage && wp.layout != 'tiled' ? wp.layout : 'auto',
    repeat: isImage && wp.layout != 'tiled' ? 'no-repeat' : 'repeat',
  };
}

function Variables() {
  const settings = useSettings();
  const wallpaper = settings.get('wallpaper') as Wallpaper;
  const wcache = settings.get('wallpaper-cache') as WCache;
  const obj = useMemo(
    () => getWallpaperObject(wallpaper),
    [wallpaper && wcache]
  );

  return (
    <style>
      {`
      :root {
        --scaling: ${settings.get('scaling', 1)};
        --timing: ${settings.get('timing', 1)};
        --taskbar-opacity: ${settings.get('transparency', 0.6)};
        --wp: ${obj.url};
        --wp-size: ${obj.size};
        --wp-repeat: ${obj.repeat}; 
        --wp-cache: ${
          wcache && wallpaper?.type != 'color'
            ? `url(${wcache.cache})`
            : obj.url
        }
      }
    `}
    </style>
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

export default OperatingSystem;
