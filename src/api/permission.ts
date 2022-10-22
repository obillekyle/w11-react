import _ from "lodash";
import { ObjectStore } from "./store";

export const getGroup = (store: ObjectStore, user: string) => {
  const profiles: ObjectStore = _.get(store, "profiles");
  return (
    _.findKey(profiles, (o: any[]) => o.includes(user.toLowerCase())) ??
    "everyone "
  );
};

export const hasPermission = (
  perm: string,
  store: any,
  path: string,
  user: string
) => {
  const key = ["+Win!~", ...path.split(".").map((i) => btoa(i))];

  const elevated = user.includes("^");
  user = user.replace("^", "");

  const group = getGroup(store, user);
  const permDir = _.get(store, key.join(".") + `._`) ??
    _.get(store, _.remove(key, -1).join(".") + `._`) ?? {
      $o: "everyone",
      everyone: "dlrwx",
    };

  const curr = elevated ? group : user;

  if (perm)
    return [permDir.everyone, elevated && permDir[curr], permDir[user]]
      .join()
      .includes(perm);

  return false;
};

export const regKey = (key: string, serialize?: boolean) => {
  return (
    "+Win!~." +
    key
      .split(".")
      .map((k) => (serialize ? atob(k) : btoa(k)))
      .join(".")
  );
};
