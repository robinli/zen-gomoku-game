// Firebase 配置
// 請在 Firebase Console 中獲取這些值並設定到環境變數

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 檢查是否使用 Mock Auth (開發/測試環境)
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
