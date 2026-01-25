import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 檢查是否啟用認證
export const isAuthEnabled = process.env.ENABLE_AUTH === 'true';

let firebaseAdmin: admin.app.App | null = null;

if (isAuthEnabled) {
    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
        const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

        if (fs.existsSync(absolutePath)) {
            // 使用服務帳戶金鑰檔案
            firebaseAdmin = admin.initializeApp({
                credential: admin.credential.cert(absolutePath)
            });
            console.log('🔥 Firebase Admin initialized with service account file');
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            // 使用環境變數 (生產環境)
            firebaseAdmin = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                })
            });
            console.log('🔥 Firebase Admin initialized with environment variables');
        } else {
            console.warn('⚠️ Firebase authentication is enabled but no credentials found. Auth will likely fail.');
        }
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
    }
}

export default admin;
export { firebaseAdmin };
