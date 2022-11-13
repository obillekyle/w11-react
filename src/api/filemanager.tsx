/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cuid from 'cuid';
import { Dexie } from 'dexie';
import _, { now } from 'lodash';
import { useEffect, useState } from 'react';
import './types';
import {
  lastMod,
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
} from './types';

// [ ] Add functions for files
// [ ] Fix custom file and folder types
// [ ] Clean the code

class Disk extends Dexie {
  lastMod!: Dexie.Table<lastMod>;
  partition!: Dexie.Table<PartitionDB, number>;
  bytes!: Dexie.Table<Byte, number>;

  constructor() {
    super('VirtualDisk');
    this.version(1).stores({
      partition: '++id',
      bytes: '&address',
    });
  }
}

const disk = new Disk();

export function useFileManager() {
  const [error, setError] = useState(false);
  const [storage, setStorage] = useState<StorageState>();

  useEffect(() => {
    setInterval(async () => {
      try {
        let lastMod = await disk.lastMod.where('key').equals('date').first();
        if (!lastMod) {
          lastMod = { key: 'date', value: now() };
          await disk.lastMod.put(lastMod);
        }

        if (storage?.date == lastMod.value) return;

        const partitions = await disk.partition.toArray();
        setStorage(() => {
          const partition: Partition[] = [];

          partitions.forEach((partitionDb) => {
            partition.push({
              ...partitionDb,
              record: JSON.parse(partitionDb.record),
            });
          });

          return {
            date: lastMod?.value ?? now(),
            partitions: partition,
          };
        });
      } catch (error: unknown) {
        setError(error as boolean);
      }
    }, 300);
  }, []);

  if (!storage) return { loading: true, error: false };
  if (error) return { loading: false, error };

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
      await disk.lastMod.where('key').equals('date').modify({
        value: now(),
      });
    } catch {
      console.log('error while refreshing db');
    }
  };

  const FileMethods: FileMethodsFn = (location) => {
    const [partition, ...path] = toPath(location);
    if (!partition) return undefined;

    const filePath = ['partitions', partition, 'record', ...path];
    const file = _.get(storage, filePath) as PartitionRecord | Folder | File;

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
            ctx.value = {
              ...oldPart,
              record: JSON.stringify(part.record),
            };
          });
        await disk.lastMod.where('key').equals('date').modify({
          value: now(),
        });
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
        if (!partition) return false;
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
              ctx.value = {
                ...pDB,
                record: copyStorage.partitions[partition].record,
              };
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
              ctx.value = {
                ...pDB,
                record: JSON.stringify(copyStorage.partitions[pDB.id].record),
              };
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
  function FolderMethods(location: string, root?: boolean) {
    let [partition, ...extra] = toPath(location);
    if (!partition) return undefined;

    const folderPath = ['partitions', partition, 'record', ...extra];
    const folder = _.get(storage, folderPath) as
      | PartitionRecord
      | Folder
      | File;

    if (folder.$$type == 'file') return undefined;

    const save = async (folder: Folder) => {
      let storage: StorageState;
      if (!partition) return false;

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
            ctx.value = {
              ...oldPart,
              record: JSON.stringify(part.record),
            };
          });
        await disk.lastMod.where('key').equals('date').modify({
          value: now(),
        });
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
        $location: `${partition}:/${folderPath.join('/')}`,
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
          if (!partition) return false;

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
                if (!part) return false;

                ctx.value = {
                  ...part,
                  label: newName,
                };
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
        $location: `${partition}:/${folderPath.join('/')}`,

        $delete: async () => {
          if (!partition) return false;
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
              .modify((partitions, ctx) => {
                if (!(storage && partition)) {
                  return false;
                }
                ctx.value = {
                  ...partitions,
                  record: JSON.stringify(
                    copyStorage.partitions[partition].record
                  ),
                };
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
                ctx.value = {
                  ...pDB,
                  record: JSON.stringify(copyStorage.partitions[pDB.id].record),
                };
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

  const fm: FileManager = {
    loading: false,
    error: false,
    getDir: (location) =>
      FolderMethods(location) ?? FolderMethods(location, true),
    getFile(location) {
      return FileMethods(location);
    },
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
      if (!part) return false;
      const newPath = ['partitions', part, 'record', ...path];
      let copyStorage: any = undefined;

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
              if (!copyStorage) return false;

              ctx.value = {
                ...obj,
                record: JSON.stringify(copyStorage.partitions[part].record),
              };
            });
        }

        if (value.$$type == 'file') {
          const address = cuid();
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
              if (!copyStorage) return false;

              ctx.value = {
                ...obj,
                record: JSON.stringify(copyStorage.partitions[part].record),
              };
            });

          await disk.bytes.add({
            address,
            data: stream ?? new Blob(),
          });
        }
      } catch {
        console.error('Set Failure');
        return false;
      }

      return true;
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
