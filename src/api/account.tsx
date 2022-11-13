import useFileManager from './filemanager';

type Account = {
  id: string;
  name: string;
  profile: string;
};

type AccountSettings = {
  name: string;
  profile: string;
};

type UseAccount =
  | {
      currentAccount: null;
      accounts: Account[];
      login(id: string): boolean;
    }
  | {
      accounts: Account[];
      currentAccount: Account;
      login(id: string): boolean;
      logout(): boolean;
      settings: {
        (): AccountSettings;
        set(key: 'name' | 'profile', value: string): boolean;
      };
    };

export function useAccount(): UseAccount {
  const fileManager = useFileManager();
  return {} as UseAccount;
}
