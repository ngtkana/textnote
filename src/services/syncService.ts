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

class SyncService {
  private unsubscribe: Unsubscribe | null = null;

  async syncToCloud(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('ログインしていません');

    const files = await storage.getAllFiles();

    for (const file of files) {
      await setDoc(doc(db, 'users', user.uid, 'files', file.id), file);
    }
  }

  async syncFromCloud(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('ログインしていません');

    await storage.clear();

    const q = query(collection(db, 'users', user.uid, 'files'), orderBy('order'));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      await storage.createFile(docSnap.data() as TextFile);
    }
  }

  async saveFileToCloud(file: TextFile): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, 'users', user.uid, 'files', file.id), file);
  }

  async deleteFileFromCloud(fileId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(doc(db, 'users', user.uid, 'files', fileId));
  }

  enableRealtimeSync(onUpdate: () => void): void {
    // 既存の購読を解除（多重購読防止）
    this.disableRealtimeSync();

    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'files'));

    this.unsubscribe = onSnapshot(q, async (snapshot) => {
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
