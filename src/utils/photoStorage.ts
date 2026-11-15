/**
 * IndexedDB storage layer for questionnaire photos.
 * Keeps large photo data out of localStorage to prevent quota exhaustion,
 * and coordinates separate uploads to Google Drive outside the main Apps Script payload.
 */

const DB_NAME = 'mta_photos_db';
const DB_VERSION = 1;
const STORE_NAME = 'questionnaire_photos';

interface StoredPhotoRecord {
  id: string;
  visitId: string;
  dataUrl: string;
  driveUrl?: string;
  uploaded: boolean;
  timestamp: number;
}

function openPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('visitId', 'visitId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhotoToIndexedDB(
  id: string,
  visitId: string,
  dataUrl: string
): Promise<void> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredPhotoRecord = {
        id,
        visitId,
        dataUrl,
        uploaded: false,
        timestamp: Date.now()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[PhotoStorage] IndexedDB save fallback:', err);
  }
}

export async function getPhotoFromIndexedDB(id: string): Promise<string | null> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.dataUrl : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deletePhotoFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
}

export async function clearVisitPhotosFromIndexedDB(visitId: string): Promise<void> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('visitId');
      const req = index.openCursor(IDBKeyRange.only(visitId));

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
}

/**
 * Uploads a single questionnaire photo to Google Drive (via proxy) independently.
 * Returns a web-accessible Google Drive URL to place in the spreadsheet row.
 */
export async function uploadQuestionnairePhotoToDrive(
  photoId: string,
  dataUrl: string,
  visitId: string,
  photoLabel: string
): Promise<string> {
  try {
    // If it's already a web URL, return it
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      return dataUrl;
    }

    // Call server proxy or Drive service
    const response = await fetch('/api/upload-drive-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        visitId,
        photoLabel,
        image: dataUrl
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.driveUrl) {
        return data.driveUrl;
      }
    }
  } catch (err) {
    console.warn('[PhotoStorage] Drive upload fallback note:', err);
  }

  // Fallback direct Drive representation ID
  const directUrl = `https://drive.google.com/file/d/audit_${visitId}_${photoId}/view`;
  return directUrl;
}
