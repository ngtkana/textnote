import { storage } from '../lib/storage';
import type { TextFile } from '../types';
import { syncService } from './syncService';
import { auth } from '../lib/firebase';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class FileService {
  async init(): Promise<void> {
    await storage.init();

    // 初回起動時にサンプルデータを作成
    const files = await storage.getAllFiles();
    if (files.length === 0) {
      await this.createDefaultFiles();
    }
  }

  private async createDefaultFiles(): Promise<void> {
    const defaultFile: TextFile = {
      id: generateId(),
      title: 'メモ',
      order: 0,
      content: 'ここにテキストを入力してください。\n\n自由に書き込めます。',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storage.createFile(defaultFile);
  }

  async getAllFiles(): Promise<TextFile[]> {
    return await storage.getAllFiles();
  }

  async getFile(id: string): Promise<TextFile | null> {
    return await storage.getFile(id);
  }

  async createFile(title: string, content = ''): Promise<TextFile> {
    const files = await storage.getAllFiles();
    const maxOrder = files.reduce((max, f) => Math.max(max, f.order), -1);

    const newFile: TextFile = {
      id: generateId(),
      title,
      order: maxOrder + 1,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storage.createFile(newFile);

    if (auth.currentUser) {
      try {
        await syncService.saveFileToCloud(newFile);
      } catch (error) {
        console.error('クラウド同期エラー（createFile）:', error);
      }
    }

    return newFile;
  }

  async updateFileTitle(id: string, title: string): Promise<void> {
    const file = await storage.getFile(id);
    if (!file) throw new Error('File not found');

    file.title = title;
    file.updatedAt = Date.now();

    await storage.updateFile(file);

    if (auth.currentUser) {
      try {
        await syncService.saveFileToCloud(file);
      } catch (error) {
        console.error('クラウド同期エラー（updateFileTitle）:', error);
      }
    }
  }

  async updateFileContent(id: string, content: string): Promise<void> {
    const file = await storage.getFile(id);
    if (!file) throw new Error('File not found');

    file.content = content;
    file.updatedAt = Date.now();

    await storage.updateFile(file);

    if (auth.currentUser) {
      syncService.saveFileToCloud(file).catch((error) => {
        console.error('クラウド同期エラー（updateFileContent）:', error);
      });
    }
  }

  async deleteFile(id: string): Promise<void> {
    await storage.deleteFile(id);

    if (auth.currentUser) {
      try {
        await syncService.deleteFileFromCloud(id);
      } catch (error) {
        console.error('クラウド同期エラー（deleteFile）:', error);
      }
    }

    // 削除後、order を再計算
    await this.reorderFiles();
  }

  async reorderFiles(): Promise<void> {
    const files = await storage.getAllFiles();

    files.sort((a, b) => a.order - b.order);

    const changedFiles: typeof files = [];

    for (let i = 0; i < files.length; i++) {
      const oldOrder = files[i].order;
      files[i].order = i;

      // orderが変わったファイルのみ更新
      if (oldOrder !== i) {
        files[i].updatedAt = Date.now();
        await storage.updateFile(files[i]);
        changedFiles.push(files[i]);
      }
    }

    // 変更があったファイルのみクラウド同期
    if (auth.currentUser && changedFiles.length > 0) {
      try {
        for (const file of changedFiles) {
          await syncService.saveFileToCloud(file);
        }
      } catch (error) {
        console.error('クラウド同期エラー（reorderFiles）:', error);
      }
    }
  }

  async swapFileOrder(id1: string, id2: string): Promise<void> {
    const file1 = await storage.getFile(id1);
    const file2 = await storage.getFile(id2);

    if (!file1 || !file2) throw new Error('File not found');

    const tempOrder = file1.order;
    file1.order = file2.order;
    file2.order = tempOrder;

    file1.updatedAt = Date.now();
    file2.updatedAt = Date.now();

    await storage.updateFile(file1);
    await storage.updateFile(file2);
  }

  async exportData(): Promise<string> {
    const files = await storage.getAllFiles();
    return JSON.stringify(files, null, 2);
  }

  async importData(jsonString: string): Promise<void> {
    const files: TextFile[] = JSON.parse(jsonString);

    await storage.clear();

    for (const file of files) {
      await storage.createFile(file);
    }

    // ログイン中の場合、クラウドも置き換える
    if (auth.currentUser) {
      try {
        await syncService.clearCloud();
        await syncService.syncToCloud();
      } catch (error) {
        console.error('クラウド同期エラー（importData）:', error);
      }
    }
  }
}

export const fileService = new FileService();
