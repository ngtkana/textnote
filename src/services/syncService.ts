import { auth, db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { storage } from '../lib/storage';
import type { TextFile } from '../types';

type SyncStatusCallback = (status: 'idle' | 'syncing' | 'success' | 'error', errorMessage?: string) => void;

class SyncService {
  private unsubscribe: Unsubscribe | null = null;
  private statusCallback: SyncStatusCallback | null = null;

  setStatusCallback(callback: SyncStatusCallback | null): void {
    this.statusCallback = callback;
  }

  private updateStatus(status: 'idle' | 'syncing' | 'success' | 'error', errorMessage = ''): void {
    if (this.statusCallback) {
      this.statusCallback(status, errorMessage);
    }
  }

  async syncToCloud(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('ログインしていません');

    const files = await storage.getAllFiles();

    for (const file of files) {
      await setDoc(doc(db, 'users', user.uid, 'files', file.id), file);
    }
  }

  async syncFromCloud(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) throw new Error('ログインしていません');

    // 先にクラウドからデータを取得（失敗してもローカルデータを保護）
    const q = query(collection(db, 'users', user.uid, 'files'), orderBy('order'));
    const snapshot = await getDocs(q);

    // クラウドが空の場合は何もしない（ローカルデータを保護）
    if (snapshot.empty) {
      return false;
    }

    // 取得成功後にローカルをクリア
    await storage.clear();

    for (const docSnap of snapshot.docs) {
      await storage.createFile(docSnap.data() as TextFile);
    }

    return true;
  }

  async saveFileToCloud(file: TextFile): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      this.updateStatus('syncing');
      await setDoc(doc(db, 'users', user.uid, 'files', file.id), file);
      this.updateStatus('success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'クラウド保存に失敗しました';
      this.updateStatus('error', errorMsg);
      throw error;
    }
  }

  async deleteFileFromCloud(fileId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(doc(db, 'users', user.uid, 'files', fileId));
  }

  async clearCloud(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'files'));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
  }

  enableRealtimeSync(onUpdate: () => void): void {
    // 既存の購読を解除（多重購読防止）
    this.disableRealtimeSync();

    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'files'));

    this.unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        for (const change of snapshot.docChanges()) {
          const file = change.doc.data() as TextFile;

          if (change.type === 'added' || change.type === 'modified') {
            await storage.updateFile(file);
          }
          if (change.type === 'removed') {
            await storage.deleteFile(change.doc.id);
          }
        }

        onUpdate();
      } catch (error) {
        console.error('リアルタイム同期エラー:', error);
      }
    });
  }

  disableRealtimeSync(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const syncService = new SyncService();
