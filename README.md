# TextNote - テキストエディタPWA

軽量でオフライン動作するテキストエディタアプリ

## 特徴

- **超軽量**: バンドルサイズ ~15KB（gzip圧縮後）
- **オフライン対応**: ネットワーク不要で完全動作
- **マルチデバイス**: モバイル・デスクトップ両対応
- **PWA**: インストール可能なアプリとして動作
- **自動保存**: 入力後1秒で自動保存（debounce処理）
- **レスポンシブ**: モバイル/デスクトップで最適化されたUI

## 技術スタック

- **Vanilla TypeScript**: フレームワークなしで最小限の依存
- **Vite**: 高速ビルドツール
- **Tailwind CSS**: ユーティリティファーストCSS
- **IndexedDB**: ブラウザネイティブのストレージ
- **PWA**: Service Worker + Manifest

## UI設計

### モバイル（< 768px）
- 1画面に1つのファイル表示
- 左右スワイプでファイル切り替え
- ドットナビゲーション
- タップで編集

### デスクトップ（>= 768px）
- グリッドレイアウトで複数ファイル表示
- 2-3カラム表示
- クリックで編集
- キーボードナビゲーション対応

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

## 開発コマンド

```bash
# 型チェック
npm run lint

# コード整形
npm run format
```

## デプロイ方法

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### クイックデプロイ（Vercel推奨）

1. GitHubにpush
2. [Vercel](https://vercel.com/)で連携
3. 自動デプロイ完了

## データ構造

```typescript
interface TextFile {
  id: string;        // UUID
  title: string;     // ファイル名
  order: number;     // 表示順序
  content: string;   // プレーンテキスト
  createdAt: number;
  updatedAt: number;
}
```

## ブラウザ対応

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+

## ライセンス

このプロジェクトにはライセンスが設定されていません。
