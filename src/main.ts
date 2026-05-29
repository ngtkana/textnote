import './styles/tailwind.css';
import { fileService } from './services/fileService';

let currentFiles: any[] = [];
let saveTimeouts = new Map<string, number>();

// アプリケーション初期化
async function init() {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (!app) {
    throw new Error('App element not found');
  }

  // 初期化中表示
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center">
      <div class="card text-center">
        <h1 class="text-2xl font-bold mb-4">TextNote</h1>
        <p class="text-text-secondary">初期化中...</p>
      </div>
    </div>
  `;

  try {
    // FileServiceの初期化（IndexedDB初期化 + デフォルトデータ作成）
    await fileService.init();

    // データを取得
    currentFiles = await fileService.getAllFiles();

    // テキストエディタUI
    app.innerHTML = `
      <div class="min-h-screen bg-background">
        <!-- ヘッダー -->
        <header class="bg-surface border-b border-gray-200 px-4 py-3">
          <div class="max-w-7xl mx-auto flex items-center justify-between">
            <h1 class="text-xl font-bold">TextNote</h1>
            <div class="flex gap-2">
              <button id="add-file" class="btn btn-primary text-sm">
                + 新規ファイル
              </button>
              <button id="export-data" class="btn text-sm">
                エクスポート
              </button>
            </div>
          </div>
        </header>

        <!-- エディタエリア -->
        <div class="max-w-7xl mx-auto p-4">
          <div class="grid desktop:grid-cols-3 mobile:grid-cols-1 gap-4" id="editors-container">
            ${currentFiles
              .map(
                (file) => `
              <div class="card">
                <!-- ファイルヘッダー -->
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <input
                    type="text"
                    value="${escapeHtml(file.title)}"
                    data-file-id="${file.id}"
                    class="file-title-input font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 flex-1"
                  />
                  <button
                    data-file-id="${file.id}"
                    class="delete-file-btn text-red-600 hover:bg-red-50 rounded p-2 ml-2"
                    title="削除"
                  >
                    ✕
                  </button>
                </div>

                <!-- テキストエディタ -->
                <textarea
                  data-file-id="${file.id}"
                  class="file-content-textarea w-full h-64 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  placeholder="ここにテキストを入力..."
                >${escapeHtml(file.content)}</textarea>

                <!-- メタ情報 -->
                <div class="mt-2 text-xs text-text-secondary">
                  更新: ${formatDate(file.updatedAt)}
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          ${currentFiles.length === 0 ? '<div class="text-center text-text-secondary mt-8">ファイルがありません。「+ 新規ファイル」から作成してください。</div>' : ''}
        </div>
      </div>
    `;

    // イベントリスナー設定
    setupEventListeners();
  } catch (error) {
    console.error('初期化エラー:', error);
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <div class="card text-center">
          <h1 class="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p class="text-text-secondary">${error instanceof Error ? error.message : '不明なエラー'}</p>
        </div>
      </div>
    `;
  }
}

// イベントリスナー設定
function setupEventListeners() {
  // ファイルタイトル編集（debounce付き）
  document.querySelectorAll('.file-title-input').forEach((input) => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const fileId = target.dataset.fileId!;
      const newTitle = target.value;

      // debounce: 500ms後に保存
      if (saveTimeouts.has(fileId)) {
        clearTimeout(saveTimeouts.get(fileId)!);
      }

      const timeoutId = window.setTimeout(async () => {
        await fileService.updateFileTitle(fileId, newTitle);
        saveTimeouts.delete(fileId);
      }, 500);

      saveTimeouts.set(fileId, timeoutId);
    });
  });

  // ファイル内容編集（debounce付き）
  document.querySelectorAll('.file-content-textarea').forEach((textarea) => {
    textarea.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      const fileId = target.dataset.fileId!;
      const newContent = target.value;

      // debounce: 1000ms後に保存
      const saveKey = `content-${fileId}`;
      if (saveTimeouts.has(saveKey)) {
        clearTimeout(saveTimeouts.get(saveKey)!);
      }

      const timeoutId = window.setTimeout(async () => {
        await fileService.updateFileContent(fileId, newContent);
        saveTimeouts.delete(saveKey);
      }, 1000);

      saveTimeouts.set(saveKey, timeoutId);
    });
  });

  // ファイル削除
  document.querySelectorAll('.delete-file-btn').forEach((button) => {
    button.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const fileId = target.dataset.fileId!;
      const file = currentFiles.find((f) => f.id === fileId);

      if (file && confirm(`「${file.title}」を削除しますか？`)) {
        await fileService.deleteFile(fileId);
        await init(); // 再描画
      }
    });
  });

  // 新規ファイル作成
  document.getElementById('add-file')?.addEventListener('click', async () => {
    const title = prompt('ファイル名を入力してください', '新しいメモ');
    if (title) {
      await fileService.createFile(title);
      await init(); // 再描画
    }
  });

  // データエクスポート
  document.getElementById('export-data')?.addEventListener('click', async () => {
    const data = await fileService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textnote-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ユーティリティ関数
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;

  return date.toLocaleDateString('ja-JP');
}

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
