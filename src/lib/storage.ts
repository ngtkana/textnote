import { DB_NAME, DB_VERSION, STORE_NAME } from '../types';
import type { TextFile } from '../types';

class Storage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('IndexedDB の初期化に失敗しました'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // textfilesストアが存在しない場合は作成
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          // orderでソートできるようにインデックス作成
          store.createIndex('order', 'order', { unique: false });
        }
      };
    });
  }

  async getAllFiles(): Promise<TextFile[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('order');
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(request.result as TextFile[]);
      };

      request.onerror = () => {
        reject(new Error('ファイル一覧の取得に失敗しました'));
      };
    });
  }

  async getFile(id: string): Promise<TextFile | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('ファイルの取得に失敗しました'));
      };
    });
  }

  async createFile(file: TextFile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(file);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('ファイルの作成に失敗しました'));
      };
    });
  }

  async updateFile(file: TextFile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(file);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('ファイルの更新に失敗しました'));
      };
    });
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('ファイルの削除に失敗しました'));
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('データのクリアに失敗しました'));
      };
    });
  }
}

export const storage = new Storage();
