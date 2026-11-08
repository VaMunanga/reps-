import { loadFocusData } from './storage.js';
import { initialRecord, applyAction } from './session.js';

// One IndexedDB read/write transaction owns session changes and completion claims.
// The legacy localStorage record remains intact if opening/migrating fails.
export async function createLedger(win = window) {
  let legacy;
  try { legacy = loadFocusData(win.localStorage); } catch { /* blocked storage */ }
  let fallback = initialRecord(legacy);
  let db;
  try {
    db = await new Promise((resolve, reject) => {
      const request = win.indexedDB.open('reps-focus', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Storage is blocked by another tab.'));
    });
  } catch { /* tab-local fallback explicitly disclosed by the page */ }
  const listeners = new Set();
  const channel = db && win.BroadcastChannel ? new win.BroadcastChannel('reps-focus') : null;
  channel?.addEventListener('message', () => listeners.forEach(listener => listener()));
  const run = action => {
    if (!db) {
      const result = action ? applyAction(fallback, action, Date.now()) : { record: fallback, effect: null };
      fallback = result.record;
      return Promise.resolve(result);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('state', action ? 'readwrite' : 'readonly');
      const store = tx.objectStore('state');
      const request = store.get('current');
      let result;
      request.onsuccess = () => {
        try {
          const record = request.result ?? initialRecord(legacy);
          result = action ? applyAction(record, action, Date.now()) : { record, effect: null };
          if (action) store.put(result.record, 'current');
        } catch (error) { tx.abort(); reject(error); }
      };
      tx.oncomplete = () => { if (action) channel?.postMessage('changed'); resolve(result); };
      tx.onerror = () => reject(new Error('Could not save the session. Your previous progress is unchanged.'));
      tx.onabort = () => reject(new Error('Could not save the session. Your previous progress is unchanged.'));
    });
  };
  return { durable: Boolean(db), read: () => run(null), update: run, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }, close: () => { channel?.close(); db?.close(); } };
}
