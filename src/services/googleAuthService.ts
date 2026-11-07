import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const signInWithGoogleWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain OAuth access token from Google Workspace auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[GoogleAuth] Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogleWorkspace = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Uploads a base64 image or blob directly to Google Drive folder using Google Drive v3 REST API.
 */
export async function uploadImageToGoogleDrive(
  accessToken: string,
  photoDataUrl: string,
  fileName: string,
  folderId: string = '19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL'
): Promise<{ fileId: string; webViewLink: string; directUrl: string }> {
  try {
    if (!photoDataUrl || !photoDataUrl.startsWith('data:')) {
      throw new Error('Invalid base64 photo data');
    }

    // Extract mime type and base64 string
    const matches = photoDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Unparseable data URL for image upload');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: mimeType
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Drive Upload API returned ${uploadRes.status}: ${errText}`);
    }

    const fileData = await uploadRes.json();
    const fileId = fileData.id;
    const webViewLink = fileData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    return { fileId, webViewLink, directUrl };
  } catch (err: any) {
    console.error('[GoogleDriveAPI] Upload failed:', err);
    throw err;
  }
}

/**
 * Appends a row of values directly to a Google Sheet using Google Sheets v4 REST API.
 */
export async function appendRowToGoogleSheetDirect(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rowValues: any[]
): Promise<any> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowValues]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Sheets API returned ${res.status}: ${errText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error('[GoogleSheetsAPI] Append row failed:', err);
    throw err;
  }
}
