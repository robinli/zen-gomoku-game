import { firebaseAdmin, isAuthEnabled } from '../services/firebase-admin.js';
import type { Socket } from 'socket.io';

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    // 如果未啟用認證，直接通過
    if (!isAuthEnabled) {
        return next();
    }

    try {
        // 從 auth 物件中取得 token
        const token = socket.handshake.auth?.token;

        if (!token) {
            console.warn(`🔒 Socket ${socket.id} rejected: No token provided`);
            return next(new Error('Authentication error: No token provided'));
        }

        // 驗證 Firebase ID Token
        if (!firebaseAdmin) {
            console.error('❌ Firebase Admin not initialized but auth is enabled');
            return next(new Error('Internal Server Error: Auth service unavailable'));
        }

        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

        // 將使用者資訊存入 socket 物件
        (socket as any).user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.display_name
        };

        console.log(`🔒 Socket ${socket.id} authenticated: ${decodedToken.email}`);
        next();
    } catch (error) {
        console.error(`🔒 Socket ${socket.id} authentication failed:`, error);
        next(new Error('Authentication error: Invalid token'));
    }
};
