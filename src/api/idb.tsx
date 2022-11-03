/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLayoutEffect, useState } from 'react';
import { now } from 'lodash';
import Dexie from 'dexie';

import { execute } from './util';
import { useCallback } from 'react';

class WinDB extends Dexie {
  settings!: Dexie.Table<Settings, string>;
  system!: Dexie.Table<Settings, string>;
  users!: Dexie.Table<Settings, string>;

  constructor() {
    super('Windows');
    this.version(1).stores({
      settings: '&key',
      system: '&key',
      users: '&key',
    });
  }
}

interface Settings {
  key: string;
  value: string;
}

export type IDBFunc = {
  get: {
    (key: string): any;
    <T>(key: string, defaultValue?: T): T;
    (key: string, defaultValue?: any): any;
  };
  set: {
    (key: string, v: (v: any) => any, error?: (e: any) => any): void;
    (key: string, v: any, error?: (e: any) => any): void;
  };
  remove: (key: string, onError: (e: any) => any) => void;
};

export type UseIDBProps =
  | {
      loading: true;
    }
  | {
      loading: false;
      error: true;
    }
  | ({
      loading: false;
      error: false;
    } & IDBFunc);

const db = new WinDB();
function useIDB(table = 'settings'): UseIDBProps {
  const [error, setError] = useState(false);
  const [data, setData] = useState<Record<string, string>>();

  const process = useCallback((value: string) => {
    if (typeof value != 'string') return value;
    const array = value.split('$;');
    if (!array[1]) return value;

    if (array[0] == 'json') return JSON.parse(array[1]);
    if (array[0] == 'number') return Number(array[1]);
    if (array[0] == 'date') return new Date(array[1]);
    return value;
  }, []);

  useLayoutEffect(() => {
    const i = setInterval(async () => {
      if (error) return;
      try {
        let lastMod = await db.table(table).where({ key: '$date' }).first();

        if (!lastMod) {
          lastMod = { key: '$date', value: now() + '' };
          await db.table(table).put(lastMod);
        }

        if (data?.$date == lastMod.value) return;
        const a = await db.table(table).toArray();
        const b = a.reduce((prev, current) => {
          return { ...prev, [current.key]: process(current.value) };
        }, {} as Record<string, string>);

        setData(b);
      } catch (e: any) {
        setError(e);
      }
    }, 200);
    return () => clearInterval(i);
  }, [data]);

  if (error) return { loading: false, error: true };
  if (!data) return { loading: true };

  return {
    loading: false,
    error: false,
    get(key: string, d = undefined) {
      if (!(data && data[key])) return d;
      return data[key];
    },

    set(key: string, value: any, error) {
      if (!data) return;

      setData((d) => ({ ...d, [key]: value }));
      value = execute(value, this.get(key, undefined));

      if (value instanceof Date) value = `date$;${value}`;
      if (typeof value == 'object') value = `json$;${JSON.stringify(value)}`;
      if (typeof value == 'number') value = `number$;${Number(value)}`;

      db.settings
        .bulkPut([
          { key, value },
          { key: '$date', value: now() },
        ])
        .catch(error);
    },

    remove(key, error) {
      if (!data) return;
      setData((d) => ({ ...d, key: undefined as any }));
      db.settings.where({ key }).delete().catch(error);
      db.settings.put({ key: '$date', value: now() + '' }).catch(error);
    },
  };
}

export default useIDB;
