import { useLocalStorage, useToggle } from '@mantine/hooks';
import _ from 'lodash';
import { createContext, useCallback, useContext } from 'react';
import { getGroup, hasPermission, regKey } from './permission';
import superjson from 'superjson';
import { execute } from './util';

export type StoreType = {
  [key: string]: ObjectStore;
};

function getStore(key: string, user: string): ObjectStore | undefined;
function getStore<T>(key: string, user: string, d: T): typeof d;
function getStore(key: string, user: string, d?: any) {
  return undefined as any;
}
function setStore(key: string, value: (v: any) => any, user: string): boolean;
function setStore(key: string, value: ObjectStore, user: string): boolean;
function setStore(key: string, value: any, user: string): boolean {
  return false;
}

function remStore(key: string, user: string) {
  return false;
}

const StoreContext = createContext({
  get$: getStore,
  set$: setStore,
  remove$: remStore,
});

export const useStore = () => useContext(StoreContext);

export const default_store = {
  settings: {},
  registry: {},
  users: {},
  system: {
    first_boot: Date.now() * 1000,
    boot_times: 0,
    is_boot: 1,

    current_user: 'Administrator',
  },
  profiles: {
    system: ['system', 'trustedinstaller'],
    administrators: ['administrator', 'user'],
  },
  '+Win!~': {
    // encoded base64 keys
    // _ is permissions
    // $o: "owner",
    // ...other users,
    // Permissions Cheat Sheet
    // example = dlrwx
    // d - directory access
    // l - ls file
    // r - read
    // w - write
    // x - read & execute

    'c2V0dGluZ3M=': {
      _: {
        $o: 'system',
        administrators: 'dlrwx',
        users: 'dlrwx',
      },
    },

    'cmVnaXN0cnk=': {
      _: {
        $o: 'system',
        system: 'dlrwx',
        administrators: 'dlrwx',
      },
    },
    'dXNlcnM=': {
      _: {
        $o: 'TrustedInstaller',
        TrustedInstaller: 'dlrwx',
        system: 'dlrwx',
        administrators: '-lrwx',
      },
    },
    'cHJvZmlsZXM=': {
      _: {
        $o: 'TrustedInstaller',
        TrustedInstaller: 'dlrwx',
        system: 'dlrwx',
        administrators: '-lrwx',
      },
    },
    c3lzdGVt: {
      _: {
        $o: 'system',
        system: 'dlrwx',
        everyone: '--r-x',
      },
    },
  },
};

export type ObjectStore =
  | null
  | number
  | string
  | boolean
  | ObjectStore[]
  | { [key: string]: ObjectStore };

const a = getStore('1', '1', 1);

export const StoreProvider = ({ children }: any) => {
  const [i, u] = useToggle();
  const [store, setStore] = useLocalStorage<StoreType>({
    key: 'store',
    defaultValue: default_store,
    deserialize: (v) => (v === undefined ? default_store : superjson.parse(v)),
  });

  const get$ = (key: string, user: string, d: any = undefined) => {
    return hasPermission('r', store, key, user) ? _.get(store, key, d) : d;
  };

  const set$ = (key: string, fn: any, user: string) => {
    if (!hasPermission('w', store, key, user)) return false;
    const elevated = user.includes('^');
    user = user.replace('^', '');
    const owner = elevated ? getGroup(store, user) : user;
    setStore((o: StoreType) => {
      const v = execute(fn, _.get(o, key));
      const a = _.set(o, key, v);
      return _.set(a, regKey(key), {
        _: {
          $o: owner,
          system: 'dlrwx',
          [owner]: 'dlrwx',
        },
      });
    });
    u();
    return true;
  };

  const remove$ = (key: string, user: string) => {
    const perm = hasPermission('w', store, key, user);
    if (perm) return false;
    setStore((o: StoreType) => {
      _.unset(o, [key, regKey(key)]);
      return o;
    });
    return true;
  };

  return (
    <StoreContext.Provider value={{ ...store, get$, set$, remove$ }}>
      {children}
    </StoreContext.Provider>
  );
};
