import useIDB, { IDBFunc } from '@api/idb';
import Image from 'image-js';
import { useCrash } from '@ui/crash';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import useFileManager, { default_fm } from '@api/filemanager';
import { FileManager } from '@api/types';
import { isNumber } from 'lodash';

const default_func = {
  get: (key: string, d?: unknown) => d,
  set: () => void '',
  remove: () => void '',
};

type OSHooks = Record<'settings' | 'system' | 'user', IDBFunc> &
  Record<'fileManager', FileManager>;

const OS = createContext<OSHooks>({
  settings: default_func,
  system: default_func,
  user: default_func,
  fileManager: default_fm,
});

function useHooks(): null | OSHooks {
  const settings = useIDB('settings');
  const system = useIDB('system');
  const user = useIDB('users');
  const fileManager = useFileManager();
  const crash = useCrash();

  const loading =
    settings.loading || system.loading || user.loading || fileManager.loading;
  if (loading) return null;

  const errored =
    settings.error || system.error || user.error || fileManager.error;
  if (errored) return crash('database_initialization_failed');
  if (!('chrome' in window)) return crash('unsupported_platform');

  return { settings, system, fileManager, user };
}

export const useSettings = () => useContext(OS).settings;
export const useSystem = () => useContext(OS).system;
export const useUsers = () => useContext(OS).user;
export const useFM = () => useContext(OS).fileManager;

const OperatingSystem = (props: { children: ReactNode }) => {
  const hooks = useHooks();

  if (!hooks) return <div className="boot-splash" />;

  return (
    <OS.Provider value={hooks}>
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
  const fileManager = useFM();
  const settings = useSettings();
  const wallpaper = settings.get('wallpaper');

  useEffect(() => {
    settings.set('boot-times', (v) => (v ?? 0) + 1);

    if (!wallpaper) {
      settings.set('wallpaper', {
        type: 'image',
        url: '/assets/Web/4k/Wallpapers/default.jpg',
        layout: 'cover',
      });
    }

    const partitions = fileManager.partition();
    console.log(partitions.length);
    console.log('102', partitions);

    if (!partitions.some((a) => isNumber(a.id))) {
      fileManager.partition.create('Windows').then((partition) => {
        if (!partition) return;
      });
    }

    fileManager.set('0:/wow', { $$attr: {}, $$type: 'folder' }).then((file) => {
      console.log(file);
      file?.$delete().then(console.log);
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
