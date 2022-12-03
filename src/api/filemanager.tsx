/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cuid from 'cuid';
import { Dexie } from 'dexie';
import _, { isNumber, last, now } from 'lodash';
import { useEffect, useState } from 'react';
import './types';
import {
  PartitionDB,
  Byte,
  StorageState,
  Partition,
  FileMethods,
  FolderMethods,
  FileMethodsFn,
  PartitionRecord,
  File,
  Folder,
  FolderContent,
  FileManager,
  UseFileManager,
} from './types';

// [ ] Add functions for files
// [ ] Fix custom file and folder types
// [ ] Clean the code

class Disk extends Dexie {
  partition!: Dexie.Table<PartitionDB | { id: 'date'; value: number }, number>;
  bytes!: Dexie.Table<Byte, number>;

  constructor() {
    super('VirtualDisk');
    this.version(1).stores({
      partition: '++id',
      lastMod: '&key',
      bytes: '&address',
    });
  }
}

const dp = () => [];
dp.create = async () => undefined;

export const default_fm: FileManager = {
  partition: dp,
  getDir: () => undefined,
  getFile: () => undefined,
  rename: async () => false,
  set: async () => undefined,
  unset: async () => false,
};

const disk = new Disk();
export function useFileManager(): UseFileManager {
  const [error, setError] = useState(false);
  const [storage, setStorage] = useState<StorageState>();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        let lastMod = await disk.partition.where('id').equals('date').first();

        if (!lastMod) {
          lastMod = { id: 'date', value: now() };
          await disk.partition.put(lastMod);
        }

        if (lastMod.id != 'date') return;

        if (storage?.date == lastMod.value) return;
        const partitions = await disk.partition.toArray();
        console.log(partitions);
        setStorage(() => {
          const partition: Partition[] = [];

          partitions.forEach((partitionDb) => {
            if (partitionDb.id != 'date') {
              partition.push({
                ...partitionDb,
                record: JSON.parse(partitionDb.record),
              });
            }
          });

          if (lastMod?.id != 'date') return;
          return {
            date: lastMod?.value ?? now(),
            partitions: partition,
            loaded: true,
          };
        });
      } catch (error: unknown) {
        console.log(error);
        setError(error as boolean);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [storage]);

  if (error) return { loading: false, error };
  if (!storage) return { loading: true };

  console.log(storage);

  function customSet(content: any, path: (string | number)[], file: any) {
    let value = content;
    path.forEach((key, index, array) => {
      if (index + 1 == array.length) value[key] = file;
      if (!value[key]) {
        value[key] = {
          $$type: 'folder',
          $$icon: undefined,
          $$attr: {},
        };
      }
      value = value[key];
    });
    return content;
  }

  function customUnset(content: any, path: (string | number)[]) {
    let value = content;
    path.forEach((key, index, array) => {
      if (index + 1 == array.length) delete value[key];
      if (!value[key]) return;
      value = value[key];
    });
    return content;
  }

  const refresh = async () => {
    try {
      await disk.partition.where('id').equals('date').modify({
        value: now(),
      });
    } catch {
      console.log('error while refreshing db');
    }
  };

  const FileMethods: FileMethodsFn = (location, newFile) => {
    const [partition, ...path] = toPath(location);
    if (!isNumber(partition)) return undefined;

    const filePath = ['partitions', partition, 'record', ...path];
    const file =
      (_.get(storage, filePath) as PartitionRecord | Folder | File) ?? newFile;

    if (!file) return undefined;
    if (file.$$type != 'file') return undefined;

    const save = async (file: File) => {
      let storage: StorageState;

      try {
        setStorage((current) => {
          if (!current) return current;

          const saved = _.set(current, filePath, file);
          storage = saved;
          return saved;
        });

        if (!storage) return false;
        const part = storage.partitions[partition];

        await disk.partition
          .where('id')
          .equals(partition)
          .modify((oldPart, ctx) => {
            if (oldPart.id != 'date') {
              ctx.value = {
                ...oldPart,
                record: JSON.stringify(part.record),
              };
            }
          });
        await refresh();
      } catch {
        return false;
      }

      return true;
    };

    function getAttributeProp(): FileMethods['$attributes'] {
      const attribute: FileMethods['$attributes'] = () => file.$$attr;
      attribute.set = async (attribute, value) => {
        file.$$attr[attribute] = value;
        return save(file as File);
      };
      attribute.remove = async (attribute) => {
        delete file.$$attr[attribute];
        return save(file as File);
      };
      return attribute;
    }

    const stream: FileMethods['$stream'] = async () => {
      const address = file.$$data;
      if (!address) return undefined;

      const data = await disk.bytes.where('address').equals('address').first();
      if (!data) return undefined;

      return data.data;
    };

    stream.set = async (data) => {
      try {
        const address = file.$$data || cuid();
        await disk.bytes.add({ address, data });
        return true;
      } catch {
        return false;
      }
    };

    const final: File & FileMethods = {
      ...file,
      $attributes: getAttributeProp(),
      async $delete() {
        if (!isNumber(partition)) return false;
        let copyStorage: any = undefined;

        try {
          setStorage((storage) => {
            if (!storage) return storage;

            customUnset(storage, filePath);
            copyStorage = storage;
            return storage;
          });

          await disk.partition
            .where('id')
            .equals(partition)
            .modify((pDB, ctx) => {
              if (pDB.id != 'date') {
                ctx.value = {
                  ...pDB,
                  record: copyStorage.partitions[partition].record,
                };
              }
            });

          await disk.bytes.where('address').equals(file.$$data).delete();
        } catch {
          return false;
        } finally {
          await refresh();
        }

        return true;
      },
      $location: `${partition}:/${path.join('/')}`,
      async $rename(newName) {
        if (!storage) return false;
        const [part, ...path] = toPath(newName);

        if (!(part && storage.partitions[part])) return false;

        const renamed_path = ['partitions', part, 'record', ...path];
        const renamed = _.get(storage, renamed_path) as
          | File
          | PartitionRecord
          | Folder
          | undefined;

        if (renamed) return false;
        let copyStorage: any = undefined;

        try {
          setStorage((storage) => {
            if (!storage) return storage;

            customSet(storage, renamed_path, file);
            customUnset(storage, filePath);
            copyStorage = storage;
            return storage;
          });

          await disk.partition
            .where('id')
            .anyOf([partition, part])
            .modify((pDB, ctx) => {
              if (pDB.id != 'date') {
                ctx.value = {
                  ...pDB,
                  record: JSON.stringify(copyStorage.partitions[pDB.id].record),
                };
              }
            });
        } catch {
          return false;
        } finally {
          await refresh();
        }
        return true;
      },
      $stream: stream,
    };

    return final;
  };

  function FolderMethods(
    location: string,
    root: true
  ): (PartitionRecord & FolderMethods) | undefined;
  function FolderMethods(
    location: string
  ): (Folder & FolderMethods) | undefined;
  function FolderMethods(
    location: string,
    root: false,
    newFolder: Folder
  ): (Folder & FolderMethods) | undefined;
  function FolderMethods(
    location: string,
    root: true,
    newPartition: PartitionRecord
  ): (PartitionRecord & FolderMethods) | undefined;
  function FolderMethods(
    location: string,
    root?: boolean,
    newFolder?: Folder | PartitionRecord
  ) {
    let [partition, ...extra] = toPath(location);
    if (!isNumber(partition)) return undefined;

    const folderPath = ['partitions', partition, 'record', ...extra];
    let folder =
      (_.get(storage, folderPath) as PartitionRecord | Folder | File) ??
      newFolder;

    if (!folder) return undefined;
    if (folder.$$type == 'file') return undefined;

    const save = async (folder: Folder) => {
      let storage: StorageState;
      if (!isNumber(partition)) return false;

      try {
        setStorage((current) => {
          if (!current) return current;

          const saved = _.set(current, folderPath, folder);
          storage = saved;
          return saved;
        });

        if (!storage) return false;
        const part = storage.partitions[partition];

        await disk.partition
          .where('id')
          .equals(partition)
          .modify((oldPart, ctx) => {
            if (oldPart.id != 'date') {
              ctx.value = {
                ...oldPart,
                record: JSON.stringify(part.record),
              };
            }
          });
        await refresh();
      } catch {
        return false;
      }

      return true;
    };

    function getAttributeProp(): FolderMethods['$attributes'] {
      const attribute: FolderMethods['$attributes'] = () => folder.$$attr;
      attribute.set = async (attribute, value) => {
        folder.$$attr[attribute] = value;
        return save(folder as Folder);
      };
      attribute.remove = async (attribute) => {
        delete folder.$$attr[attribute];
        return save(folder as Folder);
      };
      return attribute;
    }

    if (root) {
      if (folder.$$type != 'root') return undefined;
      const labelPath = ['partitions', partition, 'label'];

      const final: PartitionRecord & FolderMethods = {
        ...folder,
        $attributes: getAttributeProp(),
        $delete: async () => false,
        $location: `${partition}:/${extra.join('/')}`,
        $contents() {
          const keys = Object.keys(folder).filter((k) => !k.startsWith('$'));
          let contents = {} as FolderContent;
          keys.forEach((key) => {
            const content: File | Folder = (folder as any)[key];
            const contentPath = this.$location + '/' + key;

            if (content == null) return;

            const methods =
              content.$$type == 'file'
                ? FileMethods(contentPath)
                : FolderMethods(contentPath);

            if (methods) {
              contents[key] = {
                ...content,
                ...methods,
              };
            }
          });
          return contents;
        },

        async $rename(newName) {
          if (!isNumber(partition)) return false;

          try {
            setStorage((storage) => {
              if (!storage) return storage;

              customSet(storage, labelPath, newName);
              return storage;
            });

            await disk.partition
              .where('id')
              .equals(partition)
              .modify((part, ctx) => {
                if (part.id != 'date') {
                  ctx.value = {
                    ...part,
                    label: newName,
                  };
                }
              });
          } catch {
            return false;
          }
          return true;
        },
      };
      return final;
    }

    if (folder.$$type == 'folder') {
      const final: Folder & FolderMethods = {
        ...folder,
        $attributes: getAttributeProp(),
        $location: `${partition}:/${extra.join('/')}`,

        $delete: async () => {
          if (!isNumber(partition)) return false;
          let copyStorage: any = undefined;

          try {
            setStorage(() => {
              if (!storage) return storage;

              customUnset(storage, folderPath);
              copyStorage = storage;
              return storage;
            });

            await disk.partition
              .where('id')
              .equals(partition)
              .modify((part, ctx) => {
                if (part.id != 'date') {
                  ctx.value = {
                    ...part,
                    record: JSON.stringify(copyStorage.part[part.id].record),
                  };
                }
              });
          } catch {
            return false;
          } finally {
            refresh();
          }

          return true;
        },
        $contents() {
          const keys = Object.keys(folder).filter((k) => !k.startsWith('$'));
          let contents: FolderContent = {};
          keys.forEach((key) => {
            const content: Folder | File = (folder as any)[key];
            const location = this.$location + '/' + key;

            if (content == null) return;
            const methods =
              content.$$type == 'file'
                ? FileMethods(location)
                : FolderMethods(location);

            if (methods) {
              contents = {
                ...contents,
                [key]: {
                  ...content,
                  ...methods,
                },
              };
            }
          });
          return contents;
        },
        $rename: async (newName) => {
          if (!(storage && partition)) return false;
          const [part, ...path] = toPath(newName);

          if (!(part && storage.partitions[part])) return false;

          const renamed_path = ['partitions', part, 'record', ...path];
          const renamed = _.get(storage, renamed_path) as
            | File
            | PartitionRecord
            | Folder
            | undefined;

          if (renamed) return false;
          let copyStorage: any = undefined;

          try {
            setStorage((storage) => {
              if (!storage) return storage;

              customSet(storage, renamed_path, folder);
              customUnset(storage, folderPath);
              return storage;
            });

            await disk.partition
              .where('id')
              .anyOf(part, partition)
              .modify((pDB, ctx) => {
                if (pDB.id != 'date') {
                  ctx.value = {
                    ...pDB,
                    record: JSON.stringify(
                      copyStorage.partitions[pDB.id].record
                    ),
                  };
                }
              });
          } catch {
            return false;
          }

          return true;
        },
      };

      return final;
    }

    return undefined;
  }

  const partition: FileManager['partition'] = () => {
    return storage.partitions
      .map((part) => {
        const methods = FolderMethods(part.id + ':/', true, part.record);

        if (methods) {
          return {
            id: part.id,
            methods,
          };
        }
      })
      .filter((p) => p) as any;
  };
  partition.create = async (label) => {
    let id = -1;
    const record: PartitionRecord = {
      $$attr: {},
      $$icon: '',
      $$type: 'root',
    };
    try {
      const last = await disk.partition.where('id').notEqual('date').last();
      if (last?.id != 'date') {
        id = (last?.id ?? -1) + 1;
        const partition: PartitionDB = {
          id,
          label,
          record: JSON.stringify(record),
        };

        await disk.partition.add(partition);
        await refresh();
      }
    } catch {
      return undefined;
    }

    return FolderMethods(id + ':/', true, record);
  };

  const fm: FileManager & { loading: false; error: false } = {
    loading: false,
    error: false,
    partition,
    getDir: (location) =>
      FolderMethods(location) ?? FolderMethods(location, true),
    getFile: FileMethods,
    rename: async (location, newLocation) => {
      const content =
        FileMethods(location) ??
        FolderMethods(location) ??
        FolderMethods(location, true);

      if (!content) return false;

      return await content.$rename(newLocation);
    },
    set: async (location, value, stream?: Blob) => {
      const [part, ...path] = toPath(location);
      if (!isNumber(part)) return undefined;
      const newPath = ['partitions', part, 'record', ...path];
      let copyStorage: any = undefined;
      const address = cuid();

      try {
        if (value.$$type == 'folder') {
          setStorage((storage) => {
            if (!storage) return storage;

            customSet(storage, newPath, value);
            copyStorage = storage;
            return storage;
          });

          await disk.partition
            .where('id')
            .equals(part)
            .modify((obj, ctx) => {
              if (obj.id != 'date') {
                ctx.value = {
                  ...obj,
                  record: JSON.stringify(copyStorage.partitions[part].record),
                };
              }
            });
        }

        if (value.$$type == 'file') {
          setStorage((storage) => {
            if (!storage) return storage;

            customSet(storage, newPath, { ...value, $$data: address });
            copyStorage = storage;
            return storage;
          });

          await disk.partition
            .where('id')
            .equals(part)
            .modify((obj, ctx) => {
              if (obj.id != 'date') {
                ctx.value = {
                  ...obj,
                  record: JSON.stringify(copyStorage.partitions[part].record),
                };
              }
            });

          await disk.bytes.add({
            address,
            data: stream ?? new Blob(),
          });
        }
      } catch {
        console.error('Set Failure');
        return undefined;
      }

      return (
        value.$$type == 'file'
          ? FileMethods(location, {
              ...value,
              $$data: address,
            })
          : FolderMethods(location, false, {
              ...value,
              $$icon: '',
            })
      ) as any;
    },

    unset: async (location) => {
      const method =
        FileMethods(location) ??
        FolderMethods(location) ??
        FolderMethods(location, true);

      if (!method) return false;

      return await method.$delete();
    },
  };

  return fm;
}

function toPath(path: string): [number?, ...string[]] {
  path = path.replaceAll('\\', '/');
  if (!path.match(/^[0-9]{1,}:\/[^<?>"|*:]*$/g)) return [];
  let [part, extra] = path.split(':/', 2);

  return [Number(part), ...extra.split('/').filter((e) => e)];
}

export default useFileManager;
