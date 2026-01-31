// Firebase 初始化配置
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// 從環境變數讀取 Firebase 配置
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 檢查是否啟用認證
export const isAuthEnabled = import.meta.env.VITE_ENABLE_AUTH === 'true';

// 初始化 Firebase (只在啟用認證時)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (isAuthEnabled) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        console.log('🔥 Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
    }
}

export { auth };
export type { Auth };
export default app;
