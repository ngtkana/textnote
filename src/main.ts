import './styles/tailwind.css';
import { fileService } from './services/fileService';
import { syncService } from './services/syncService';
import { SwipeDetector } from './lib/gestures';
import type { TextFile } from './types';
import { auth } from './lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { createIcons, User, LogOut, CheckCircle, Menu, Download, Upload } from 'lucide';

let currentFiles: TextFile[] = [];
let saveTimeouts = new Map<string, number>();
let currentFileIndex = 0;
let swipeDetector: SwipeDetector | null = null;
let lastViewportWidth = window.innerWidth;
let isLoggedIn = false;
let currentUser: { displayName: string | null; email: string | null; photoURL: string | null } | null =
  null;
let isMenuOpen = false;

// モバイル判定
function isMobile(): boolean {
  return window.innerWidth < 768;
}

// ビューポート幅が実際に変わったか（キーボード表示によるリサイズを無視）
function hasViewportWidthChanged(): boolean {
  const currentWidth = window.innerWidth;
  const changed = Math.abs(currentWidth - lastViewportWidth) > 50; // 50px以上変化した場合のみ
  if (changed) {
    lastViewportWidth = currentWidth;
  }
  return changed;
}

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
    // Firebase リダイレクト結果を確認（モバイルログイン後）
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        // リダイレクトログイン成功
        console.log('リダイレクトログイン成功:', result.user.email);
      }
    } catch (error: any) {
      console.error('リダイレクトログインエラー:', error);
      alert(
        `リダイレクトログインエラー\n\nエラーコード: ${error.code}\nメッセージ: ${error.message}`
      );
    }

    // FileServiceの初期化（IndexedDB初期化 + デフォルトデータ作成）
    await fileService.init();

    // データを取得
    currentFiles = await fileService.getAllFiles();

    // Firebase認証状態の監視
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        isLoggedIn = true;
        currentUser = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };

        // ログイン時、クラウドから同期
        try {
          await syncService.syncFromCloud();
          currentFiles = await fileService.getAllFiles();
        } catch (error) {
          console.error('クラウド同期エラー:', error);
        }

        // リアルタイム同期を開始
        syncService.enableRealtimeSync(async () => {
          currentFiles = await fileService.getAllFiles();
          render();
        });
      } else {
        isLoggedIn = false;
        currentUser = null;

        // ログアウト時、リアルタイム同期を停止
        syncService.disableRealtimeSync();
      }

      render();
    });

    // UIレンダリング
    render();

    // リサイズ時に再描画（ただし幅が大きく変わった場合のみ）
    window.addEventListener(
      'resize',
      debounce(() => {
        if (hasViewportWidthChanged()) {
          render();
        }
      }, 300)
    );
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

// UIレンダリング
function render() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  // 現在フォーカス中の要素を保存
  const activeElement = document.activeElement as HTMLElement;
  const activeFileId = activeElement?.dataset?.fileId;
  const isTextarea = activeElement?.classList?.contains('file-content-textarea');
  const isTitleInput = activeElement?.classList?.contains('file-title-input');

  if (isMobile()) {
    renderMobileView(app);
  } else {
    renderDesktopView(app);
  }

  setupEventListeners();

  // Lucideアイコンを初期化
  createIcons({
    icons: {
      User,
      LogOut,
      CheckCircle,
      Menu,
      Download,
      Upload,
    },
  });

  // フォーカスを復元
  if (activeFileId && (isTextarea || isTitleInput)) {
    const selector = isTextarea
      ? `.file-content-textarea[data-file-id="${activeFileId}"]`
      : `.file-title-input[data-file-id="${activeFileId}"]`;
    const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (element) {
      element.focus();
      // カーソル位置を最後に移動
      const length = element.value.length;
      element.setSelectionRange(length, length);
    }
  }
}

// モバイルビュー（1画面1ファイル + スワイプ）
function renderMobileView(app: HTMLDivElement) {
  // スワイプ検出クリーンアップ
  if (swipeDetector) {
    swipeDetector.destroy();
    swipeDetector = null;
  }

  if (currentFiles.length === 0) {
    app.innerHTML = `
      <div class="min-h-screen bg-background flex flex-col">
        <header class="bg-surface border-b border-gray-200 px-4 py-3 relative">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold">TextNote</h1>
            <div class="flex gap-2">
              <button id="add-file" class="btn btn-primary text-sm">+</button>
              <button id="menu-btn" class="btn text-sm">
                <i data-lucide="menu" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
          ${
            isMenuOpen
              ? `
          <div id="dropdown-menu" class="absolute right-4 top-14 bg-white border border-gray-200 rounded shadow-lg py-2 z-50 min-w-[180px]">
            ${
              isLoggedIn
                ? `
            <div class="px-4 py-2 border-b border-gray-200 text-xs text-text-secondary">
              ${currentUser?.email || 'ログイン中'}
            </div>
            <button id="logout-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span>ログアウト</span>
            </button>
            `
                : `
            <button id="login-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
              <i data-lucide="user" class="w-4 h-4"></i>
              <span>ログイン</span>
            </button>
            `
            }
            <hr class="my-2">
            <button id="export-data" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>エクスポート</span>
            </button>
            <button id="import-data" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
              <i data-lucide="upload" class="w-4 h-4"></i>
              <span>インポート</span>
            </button>
          </div>
          `
              : ''
          }
        </header>
        <input type="file" id="import-file-input" accept=".json" style="display: none;" />
        <div class="flex-1 flex items-center justify-center text-text-secondary px-4 text-center">
          ファイルがありません。<br>「+」から作成してください。
        </div>
      </div>
    `;
    return;
  }

  // インデックス範囲チェック
  if (currentFileIndex >= currentFiles.length) {
    currentFileIndex = currentFiles.length - 1;
  }
  if (currentFileIndex < 0) {
    currentFileIndex = 0;
  }

  const file = currentFiles[currentFileIndex];

  app.innerHTML = `
    <div class="min-h-screen bg-background flex flex-col">
      <!-- ヘッダー -->
      <header class="bg-surface border-b border-gray-200 px-4 py-3 relative">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">TextNote</h1>
          <div class="flex gap-2">
            <button id="add-file" class="btn btn-primary text-sm">+</button>
            <button id="menu-btn" class="btn text-sm">
              <i data-lucide="menu" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        ${
          isMenuOpen
            ? `
        <div id="dropdown-menu" class="absolute right-4 top-14 bg-white border border-gray-200 rounded shadow-lg py-2 z-50 min-w-[180px]">
          ${
            isLoggedIn
              ? `
          <div class="px-4 py-2 border-b border-gray-200 text-xs text-text-secondary">
            ${currentUser?.email || 'ログイン中'}
          </div>
          <button id="logout-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>ログアウト</span>
          </button>
          `
              : `
          <button id="login-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="user" class="w-4 h-4"></i>
            <span>ログイン</span>
          </button>
          `
          }
          <hr class="my-2">
          <button id="export-data" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>エクスポート</span>
          </button>
          <button id="import-data" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="upload" class="w-4 h-4"></i>
            <span>インポート</span>
          </button>
        </div>
        `
            : ''
        }
      </header>
      <input type="file" id="import-file-input" accept=".json" style="display: none;" />

      <!-- スワイプエリア -->
      <div id="swipe-container" class="flex-1 flex flex-col p-4 overflow-hidden">
        <!-- ファイルヘッダー -->
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <input
            type="text"
            value="${escapeHtml(file.title)}"
            data-file-id="${file.id}"
            class="file-title-input font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 flex-1"
            placeholder="タイトル"
          />
          <span class="text-sm text-text-secondary ml-2">(${currentFileIndex + 1}/${currentFiles.length})</span>
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
          class="file-content-textarea flex-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="ここにテキストを入力..."
        >${escapeHtml(file.content)}</textarea>

        <!-- メタ情報 -->
        <div class="mt-2 text-xs text-text-secondary">
          更新: ${formatDate(file.updatedAt)}
        </div>

        <!-- ドットナビゲーション -->
        ${
          currentFiles.length > 1
            ? `
        <div class="flex justify-center gap-2 mt-4">
          ${currentFiles
            .map(
              (_, index) => `
            <button
              class="dot-nav ${index === currentFileIndex ? 'bg-primary' : 'bg-gray-300'} w-2 h-2 rounded-full transition-colors"
              data-index="${index}"
            ></button>
          `
            )
            .join('')}
        </div>
        `
            : ''
        }
      </div>
    </div>
  `;

  // スワイプ検出設定
  const swipeContainer = document.getElementById('swipe-container');
  if (swipeContainer) {
    swipeDetector = new SwipeDetector(swipeContainer, (event) => {
      if (event.direction === 'left' && currentFileIndex < currentFiles.length - 1) {
        currentFileIndex++;
        render();
      } else if (event.direction === 'right' && currentFileIndex > 0) {
        currentFileIndex--;
        render();
      }
    });
  }
}

// デスクトップビュー（グリッドレイアウト）
function renderDesktopView(app: HTMLDivElement) {
  // スワイプ検出クリーンアップ
  if (swipeDetector) {
    swipeDetector.destroy();
    swipeDetector = null;
  }

  app.innerHTML = `
    <div class="min-h-screen bg-background">
      <!-- ヘッダー -->
      <header class="bg-surface border-b border-gray-200 px-4 py-3 relative">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold">TextNote</h1>
          <div class="flex gap-2 items-center">
            ${
              isLoggedIn
                ? `
              <span class="text-xs text-text-secondary flex items-center gap-1">
                <i data-lucide="check-circle" class="w-3 h-3"></i>
                ${currentUser?.displayName || currentUser?.email || 'ログイン中'}
              </span>
            `
                : ''
            }
            <button id="add-file" class="btn btn-primary text-sm">
              + 新規ファイル
            </button>
            <button id="menu-btn" class="btn text-sm flex items-center gap-1">
              <i data-lucide="menu" class="w-4 h-4"></i>
              <span>メニュー</span>
            </button>
          </div>
        </div>
        ${
          isMenuOpen
            ? `
        <div id="dropdown-menu" class="absolute right-4 top-14 bg-white border border-gray-200 rounded shadow-lg py-2 z-50 min-w-[200px]">
          ${
            isLoggedIn
              ? `
          <button id="logout-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>ログアウト</span>
          </button>
          <hr class="my-2">
          `
              : `
          <button id="login-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="user" class="w-4 h-4"></i>
            <span>ログイン</span>
          </button>
          <hr class="my-2">
          `
          }
          <button id="export-data" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>エクスポート</span>
          </button>
          <button id="import-data" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <i data-lucide="upload" class="w-4 h-4"></i>
            <span>インポート</span>
          </button>
        </div>
        `
            : ''
        }
      </header>
      <input type="file" id="import-file-input" accept=".json" style="display: none;" />

      <!-- エディタエリア -->
      <div class="max-w-7xl mx-auto p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="editors-container">
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
                  placeholder="タイトル"
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
}

// イベントリスナー設定
function setupEventListeners() {
  // メニューボタン
  document.getElementById('menu-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    isMenuOpen = !isMenuOpen;
    render();
  });

  // メニュー外クリックで閉じる
  if (isMenuOpen) {
    document.addEventListener(
      'click',
      (e) => {
        const menu = document.getElementById('dropdown-menu');
        if (menu && !menu.contains(e.target as Node)) {
          isMenuOpen = false;
          render();
        }
      },
      { once: true }
    );
  }

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
        currentFiles = await fileService.getAllFiles();

        // モバイルビューの場合、削除後のインデックス調整
        if (isMobile() && currentFileIndex >= currentFiles.length) {
          currentFileIndex = Math.max(0, currentFiles.length - 1);
        }

        render();
      }
    });
  });

  // ドットナビゲーション
  document.querySelectorAll('.dot-nav').forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const index = parseInt(target.dataset.index!, 10);
      currentFileIndex = index;
      render();
    });
  });

  // 新規ファイル作成
  document.getElementById('add-file')?.addEventListener('click', async () => {
    const title = prompt('ファイル名を入力してください', '新しいメモ');
    if (title) {
      await fileService.createFile(title);
      currentFiles = await fileService.getAllFiles();

      // モバイルビューの場合、新しいファイルを表示
      if (isMobile()) {
        currentFileIndex = currentFiles.length - 1;
      }

      render();
    }
  });

  // データインポート
  document.getElementById('import-data')?.addEventListener('click', () => {
    const input = document.getElementById('import-file-input') as HTMLInputElement;
    input.click();
  });

  // ファイル選択時の処理
  const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // データ検証
        if (!Array.isArray(data)) {
          throw new Error('無効なデータ形式です。配列である必要があります。');
        }

        // 確認ダイアログ
        const message = `${data.length}件のファイルをインポートします。\n既存のデータは削除されます。よろしいですか？`;
        if (!confirm(message)) {
          target.value = ''; // ファイル選択をクリア
          return;
        }

        // インポート実行
        await fileService.importData(text);
        currentFiles = await fileService.getAllFiles();
        currentFileIndex = 0;

        render();
        alert('インポートが完了しました！');
      } catch (error) {
        console.error('インポートエラー:', error);
        alert(
          `インポートに失敗しました。\n${error instanceof Error ? error.message : '不明なエラー'}`
        );
      } finally {
        target.value = ''; // ファイル選択をクリア
      }
    });
  }

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

  // ログイン
  document.getElementById('login-btn')?.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();

      // モバイルではリダイレクト、デスクトップではポップアップ
      if (isMobile()) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
      // onAuthStateChangedで自動的に同期とレンダリングが行われる
    } catch (error: any) {
      console.error('ログインエラー:', error);
      alert(`ログインに失敗しました\n\nエラー: ${error.code || error.message}\n\n詳細: ${JSON.stringify(error)}`);
    }
  });

  // ログアウト
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      if (confirm('ログアウトしますか？\nローカルデータは保持されます。')) {
        await signOut(auth);
        // onAuthStateChangedで自動的にレンダリングが行われる
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
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

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function (...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
