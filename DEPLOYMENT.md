# TextNote - デプロイ方法

スマホの実機でTextNoteを使うためのデプロイ手順です。

## 🚀 推奨デプロイ方法

### オプション1: Vercel（最も簡単）⭐️

**メリット**:
- 完全無料
- GitHub連携で自動デプロイ
- HTTPS自動設定
- グローバルCDN
- 設定ファイル不要

**手順**:

1. GitHubにリポジトリをプッシュ
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/textnote.git
   git push -u origin main
   ```

2. [Vercel](https://vercel.com/)にサインアップ（GitHubアカウントで）

3. 「New Project」→ GitHubリポジトリを選択

4. 設定（自動検出されます）:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. 「Deploy」をクリック

6. デプロイ完了後、`https://textnote-xxx.vercel.app` のようなURLが発行されます

7. スマホでそのURLを開く → ホーム画面に追加

---

### オプション2: Firebase Hosting（GCP連携可）

**メリット**:
- GCPプロジェクトと統合可能
- 無料枠が大きい（10GB/月）
- Firebase他機能との連携が容易

**手順**:

1. Firebase CLIをインストール
   ```bash
   npm install -g firebase-tools
   ```

2. Firebaseにログイン
   ```bash
   firebase login
   ```

3. プロジェクト初期化
   ```bash
   firebase init hosting
   ```
   
   質問に以下のように回答:
   - 新規プロジェクト作成 or 既存選択
   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub自動デプロイ: お好みで

4. `firebase.json` が生成されたことを確認

5. ビルド&デプロイ
   ```bash
   npm run build
   firebase deploy
   ```

6. デプロイ完了後、`https://YOUR-PROJECT.web.app` のようなURLが発行されます

7. スマホでそのURLを開く → ホーム画面に追加

**firebase.json の例**:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

---

### オプション3: Cloudflare Pages（最速）

**メリット**:
- 無制限の帯域幅（無料）
- 世界最速級のCDN
- GitHub連携

**手順**:

1. [Cloudflare Pages](https://pages.cloudflare.com/)にサインアップ

2. 「Create a project」→ GitHubリポジトリ連携

3. ビルド設定:
   - Build command: `npm run build`
   - Build output: `dist`

4. デプロイ

5. `https://textnote.pages.dev` のようなURLが発行されます

---

### オプション4: Netlify

**メリット**:
- ドラッグ&ドロップでデプロイ可能
- GitHub連携も可能

**手順**:

1. ビルド
   ```bash
   npm run build
   ```

2. [Netlify](https://www.netlify.com/)にサインアップ

3. `dist` フォルダをドラッグ&ドロップ

4. URLが発行されます

---

## 📱 スマホでの使い方

### iOS（Safari）

1. デプロイされたURLをSafariで開く
2. 下部の「共有」ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ
5. ホーム画面にアイコンが追加されます

### Android（Chrome）

1. デプロイされたURLをChromeで開く
2. 右上のメニュー（︙）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ
5. ホーム画面にアイコンが追加されます

---

## 🔧 ローカルネットワークでテスト（デプロイ前）

スマホとPCが同じWi-Fiにいる場合、デプロイせずにテスト可能:

1. 開発サーバーを `--host` フラグ付きで起動
   ```bash
   npm run dev -- --host
   ```

2. ターミナルに表示される `Network: http://192.168.x.x:5173/` のURLをコピー

3. スマホのブラウザでそのURLを開く

4. 動作確認（ホーム画面追加も可能）

**注意**: この方法はローカルネットワーク内でのみ有効で、外出先では使えません。

---

## 📊 デプロイ先の比較

| サービス | 無料枠 | 自動デプロイ | カスタムドメイン | おすすめ度 |
|---------|--------|-------------|----------------|-----------|
| **Vercel** | 無制限 | ✅ GitHub連携 | ✅ | ⭐️⭐️⭐️⭐️⭐️ |
| **Firebase** | 10GB/月 | ✅ (要設定) | ✅ | ⭐️⭐️⭐️⭐️ |
| **Cloudflare** | 無制限 | ✅ GitHub連携 | ✅ | ⭐️⭐️⭐️⭐️ |
| **Netlify** | 100GB/月 | ✅ GitHub連携 | ✅ | ⭐️⭐️⭐️ |

---

## 🎯 推奨フロー

1. **まずはVercelでクイックデプロイ**（5分）
   - GitHubにpush → Vercelで連携 → 完了
   
2. **スマホで動作確認**
   - ホーム画面に追加
   - オフライン動作確認
   - スワイプジェスチャー確認

3. **必要に応じて他のサービスに移行**
   - GCP統合が必要 → Firebase
   - 最速CDN → Cloudflare
   - 現状維持 → Vercel

---

## ❓ トラブルシューティング

### Service Workerが登録されない

`vite.config.ts` の `devOptions.enabled: true` を確認。または本番ビルドで確認:
```bash
npm run build
npm run preview
```

### PWAとして認識されない

- HTTPS必須（ローカルネットワークテスト時は除く）
- manifest.webmanifest の存在確認
- アイコンファイルの存在確認

### オフラインで動作しない

- ブラウザのDevToolsで Application → Service Workers を確認
- キャッシュが正しく設定されているか確認
