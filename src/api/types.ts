export type lastMod = {
  key: string;
  value: number;
};

export type Byte = {
  address: string;
  data: Blob;
};

export type File = {
  readonly $$type: 'file';
  $$data: Byte['address'];
  $$attr: Record<string, string>;
};

export type FileMethods = {
  readonly $location: string;
  readonly $attributes: {
    (): Record<string, string | undefined>;
    set(attribute: string, value: string): Promise<boolean>;
    remove(attribute: string): Promise<boolean>;
  };
  readonly $stream: {
    (): Promise<Blob | undefined>;
    set: (data: Blob) => Promise<boolean>;
  };
  $rename(newName: string): Promise<boolean>;
  $delete(): Promise<boolean>;
};

export type Folder = {
  readonly $$type: 'folder';
  $$icon: Byte['address'];
  $$attr: Record<string, string>;
};

export type FolderMethods = {
  readonly $location: string;
  $contents(): {
    [key: string]: (File & FileMethods) | (Folder & FolderMethods);
  };
  readonly $attributes: {
    (): Record<string, string>;
    set(attribute: string, value: string): Promise<boolean>;
    remove(attribute: string): Promise<boolean>;
  };
  $rename(newName: string): Promise<boolean>;
  $delete(): Promise<boolean>;
};

export type FolderContent = Record<
  string,
  (File & FileMethods) | (Folder & FolderMethods)
>;

export type FileMethodsFn = (
  location: string
) => (File & FileMethods) | undefined;

export type FolderMethodsFn = (
  location: string
) => (Folder & FolderMethods) | undefined;

export type PartitionRecord = {
  $$type: 'root';
  $$icon: Byte['address'];
  $$attr: Record<string, string>;
};

export type Partition = {
  id: number;
  label: string;
  record: PartitionRecord;
};

export type PartitionDB = {
  id: number;
  label: string;
  record: string;
};

export type FileManager = {
  loading: false;
  error: false;
  getDir(
    location: string
  ): (Folder & FolderMethods) | (PartitionRecord & FolderMethods) | undefined;
  getFile(location: string): (File & FileMethods) | undefined;
  set: {
    (
      location: string,
      value: Omit<File, '$$data'>,
      stream: Blob
    ): Promise<boolean>;
    (location: string, value: Omit<Folder, '$$icon'>): Promise<boolean>;
  };
  unset(location: string): Promise<boolean>;
  rename(location: string, newLocation: string): Promise<boolean>;
};

export type UseFileManager =
  | {
      loading: true;
      error: false;
    }
  | {
      loading: false;
      error: true;
    }
  | FileManager;

export type StorageState =
  | {
      date: number;
      partitions: Partition[];
    }
  | undefined;

export type FolderMethodsFN = {
  (partition: number, path: (string | number)[]):
    | (Folder & FolderMethods)
    | undefined;
  (partition: number, path: (string | number)[], root: true):
    | (PartitionRecord & FolderMethods)
    | undefined;
};