import _ from 'lodash';
import { createContext, useContext } from 'react';
import { getGroup, hasPermission, regKey } from './permission';
import { execute } from './util';
import { useLocalStorage } from 'usehooks-ts';

export type StoreType = {
  readonly settings: ObjectStore;
  readonly registry: ObjectStore;
  readonly profiles: ObjectStore;
  readonly system: ObjectStore;
  readonly users: ObjectStore;
  [key: string]: ObjectStore;
};

type UseStore = {
  get$: {
    (key: string, user: string): ObjectStore | undefined;
    <T>(key: string, user: string, d: T): T;
  };
  set$: {
    (key: string, value: (v: any) => any, user: string): boolean;
    (key: string, value: ObjectStore, user: string): boolean;
  };
  remove$: (key: string, user: string) => boolean;
};

const StoreContext = createContext<UseStore>({
  get$: (() => {}) as any,
  set$: (() => {}) as any,
  remove$: (() => {}) as any,
});

export const useStore = () => useContext(StoreContext);

export const default_store: StoreType = {
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

export const StoreProvider = ({ children }: any) => {
  const [store, setStore] = useLocalStorage<StoreType>('store', default_store);

  const get$ = (key: string, user: string, d: any = undefined) => {
    return hasPermission('r', store, key, user) ? _.get(store, key, d) : d;
  };

  const set$ = (key: string, fn: any, user: string) => {
    if (!hasPermission('w', store, key, user)) return false;
    const elevated = user.includes('^');
    user = user.replace('^', '');
    const owner = elevated ? getGroup(store, user) : user;
    setStore((o) => {
      const v = execute(fn, _.get(o, key));
      const a = _.set(o, key, v);
      const f = _.set(a, regKey(key), {
        _: {
          $o: owner,
          system: 'dlrwx',
          [owner]: 'dlrwx',
        },
      });
      return f;
    });
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
    <StoreContext.Provider
      value={{
        get$,
        set$,
        remove$,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
