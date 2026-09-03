import type { IStorageProvider } from './StorageProvider';

export class LocalStorageProvider implements IStorageProvider {
  private readonly storage: Storage;

  constructor(storage?: Storage) {
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      throw new Error('localStorage is not available in the current environment');
    }
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  key(index: number): string | null {
    return this.storage.key(index);
  }

  get length(): number {
    return this.storage.length;
  }
}
