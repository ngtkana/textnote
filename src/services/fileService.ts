import { storage } from '../lib/storage';
import type { TextFile } from '../types';

// UUID生成（簡易版）
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// FileService: TextFileのビジネスロジック層
export class FileService {
  // 初期化（Storageの初期化を呼び出す）
  async init(): Promise<void> {
    await storage.init();

    // 初回起動時にサンプルデータを作成
    const files = await storage.getAllFiles();
    if (files.length === 0) {
      await this.createDefaultFiles();
    }
  }

  // デフォルトファイルを作成
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

  // 全ファイルを取得
  async getAllFiles(): Promise<TextFile[]> {
    return await storage.getAllFiles();
  }

  // ファイルをIDで取得
  async getFile(id: string): Promise<TextFile | null> {
    return await storage.getFile(id);
  }

  // 新規ファイルを作成
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
    return newFile;
  }

  // ファイルのタイトルを更新
  async updateFileTitle(id: string, title: string): Promise<void> {
    const file = await storage.getFile(id);
    if (!file) throw new Error('File not found');

    file.title = title;
    file.updatedAt = Date.now();

    await storage.updateFile(file);
  }

  // ファイルの内容を更新
  async updateFileContent(id: string, content: string): Promise<void> {
    const file = await storage.getFile(id);
    if (!file) throw new Error('File not found');

    file.content = content;
    file.updatedAt = Date.now();

    await storage.updateFile(file);
  }

  // ファイルを削除
  async deleteFile(id: string): Promise<void> {
    await storage.deleteFile(id);

    // 削除後、order を再計算
    await this.reorderFiles();
  }

  // ファイルの順序を変更
  async reorderFiles(): Promise<void> {
    const files = await storage.getAllFiles();

    // order順にソートして再割り当て
    files.sort((a, b) => a.order - b.order);

    for (let i = 0; i < files.length; i++) {
      files[i].order = i;
      files[i].updatedAt = Date.now();
      await storage.updateFile(files[i]);
    }
  }

  // ファイルの順序を入れ替え
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

  // データエクスポート（JSON）
  async exportData(): Promise<string> {
    const files = await storage.getAllFiles();
    return JSON.stringify(files, null, 2);
  }

  // データインポート（JSON）
  async importData(jsonString: string): Promise<void> {
    const files: TextFile[] = JSON.parse(jsonString);

    // 既存データをクリア
    await storage.clear();

    // インポート
    for (const file of files) {
      await storage.createFile(file);
    }
  }
}

// シングルトンインスタンス
export const fileService = new FileService();
