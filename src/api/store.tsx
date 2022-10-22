import { useLocalStorage, useToggle } from "@mantine/hooks";
import _ from "lodash";
import { createContext, useCallback, useContext } from "react";
import { getGroup, hasPermission, regKey } from "./permission";
import superjson from "superjson";
import { execute } from "./util";

export type StoreType = {
  [key: string]: ObjectStore;
};

const StoreContext = createContext<UseStore>({
  get$: (key, user, d) => d,
  set$: (key, value, user) => {},
  remove$: (key, user) => {},
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

    current_user: "Administrator",
  },
  profiles: {
    system: ["system", "trustedinstaller"],
    administrators: ["administrator", "user"],
  },
  "+Win!~": {
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

    "c2V0dGluZ3M=": {
      _: {
        $o: "system",
        administrators: "dlrwx",
        users: "dlrwx",
      },
    },

    "cmVnaXN0cnk=": {
      _: {
        $o: "system",
        system: "dlrwx",
        administrators: "dlrwx",
      },
    },
    "dXNlcnM=": {
      _: {
        $o: "TrustedInstaller",
        TrustedInstaller: "dlrwx",
        system: "dlrwx",
        administrators: "-lrwx",
      },
    },
    "cHJvZmlsZXM=": {
      _: {
        $o: "TrustedInstaller",
        TrustedInstaller: "dlrwx",
        system: "dlrwx",
        administrators: "-lrwx",
      },
    },
    c3lzdGVt: {
      _: {
        $o: "system",
        system: "dlrwx",
        everyone: "--r-x",
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

type UseStore = {
  get$: (key: string, user: string, d?: ObjectStore) => ObjectStore | undefined;
  set$: (
    key: string,
    fn: ObjectStore | ((v: any) => any),
    user: string
  ) => void;
  remove$: (key: string, user: string) => void;
};

export const StoreProvider = ({ children }: any) => {
  const [i, u] = useToggle();
  const [store, setStore] = useLocalStorage<StoreType>({
    key: "store",
    defaultValue: default_store,
    deserialize: (v) => (v === undefined ? default_store : superjson.parse(v)),
  });

  const get$ = (key: string, user: string, d: any) => {
    return hasPermission("r", store, key, user)
      ? _.get(store, key, d)
      : undefined;
  };

  const set$ = (key: string, fn: any, user: string) => {
    if (!hasPermission("w", store, key, user)) return;
    const elevated = user.includes("^");
    user = user.replace("^", "");
    const owner = elevated ? getGroup(store, user) : user;
    setStore((o: StoreType) => {
      const v = execute(fn, _.get(o, key));
      const a = _.set(o, key, v);
      const b = _.set(a, regKey(key), {
        _: {
          $o: owner,
          system: "dlrwx",
          [owner]: "dlrwx",
        },
      });
      console.log(b, key)
      return b;
    });

    u();
  };

  const remove$ = (key: string, user: string) => {
    hasPermission("w", store, key, user);
    setStore((o: StoreType) => {
      _.unset(o, [key, regKey(key)]);
      return o;
    });
  };

  return (
    <StoreContext.Provider value={{ ...store, get$, set$, remove$ }}>
      {children}
    </StoreContext.Provider>
  );
};
