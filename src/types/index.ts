// TextFile: 複数のテキストファイルが本体
export interface TextFile {
  id: string; // UUID
  title: string; // ファイル名（例: "メモ", "買い物リスト"）
  order: number; // 表示順序（0, 1, 2...）
  content: string; // プレーンテキスト内容
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

// IndexedDBのストア名
export const DB_NAME = 'textnote-db';
export const DB_VERSION = 2; // データ構造変更のためバージョンアップ
export const STORE_NAME = 'textfiles';
