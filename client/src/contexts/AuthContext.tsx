import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser
} from 'firebase/auth';
import { auth, isAuthEnabled, Auth } from '../services/firebase';

// 使用者資料介面
export interface User {
    uid: string;
    email: string;
    displayName: string;
}

// AuthContext 介面
interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
    updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 將 Firebase User 轉換為我們的 User 介面
function mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null;
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Anonymous',
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🎯 如果認證未啟用，創建一個本地訪客用戶
        if (!isAuthEnabled) {
            // 從 localStorage 讀取訪客名稱，或使用預設值
            const guestName = localStorage.getItem('guestDisplayName') || 'Guest';
            setUser({
                uid: 'guest-' + Date.now(),
                email: 'guest@local',
                displayName: guestName
            });
            setLoading(false);
            return;
        }

        // 🔥 監聽 Firebase 認證狀態變化
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth as Auth, (firebaseUser) => {
            setUser(mapFirebaseUser(firebaseUser));
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // 登入
    const signIn = async (email: string, password: string) => {
        if (!auth) throw new Error('Firebase not initialized');

        const userCredential = await signInWithEmailAndPassword(auth as Auth, email, password);
        setUser(mapFirebaseUser(userCredential.user));
    };

    // 註冊
    const signUp = async (email: string, password: string, displayName: string) => {
        if (!auth) throw new Error('Firebase not initialized');

        const userCredential = await createUserWithEmailAndPassword(auth as Auth, email, password);

        // 更新顯示名稱
        await updateProfile(userCredential.user, { displayName });

        setUser(mapFirebaseUser(userCredential.user));
    };

    // 登出
    const signOut = async () => {
        if (!isAuthEnabled) {
            // 認證被禁用時，清除訪客資料並重新載入頁面
            localStorage.removeItem('guestDisplayName');
            window.location.reload();
            return;
        }

        if (!auth) return;

        await firebaseSignOut(auth as Auth);
        setUser(null);
    };

    // 更新顯示名稱
    const updateDisplayName = async (name: string) => {
        if (!isAuthEnabled) {
            // 認證被禁用時，儲存到 localStorage
            localStorage.setItem('guestDisplayName', name);
            setUser(prev => prev ? { ...prev, displayName: name } : null);
            return;
        }

        if (!auth || !(auth as Auth).currentUser) throw new Error('No user logged in');

        const currentUser = (auth as Auth).currentUser!;
        await updateProfile(currentUser, { displayName: name });

        // 手動更新本地狀態以觸發 UI 重繪
        setUser(prev => prev ? { ...prev, displayName: name } : null);
    };

    // 取得 ID Token (用於 Socket.IO 認證)
    const getIdToken = async (): Promise<string | null> => {
        if (!auth || !(auth as Auth).currentUser) return null;
        return await (auth as Auth).currentUser!.getIdToken();
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        getIdToken,
        updateDisplayName,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook 來使用 AuthContext
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
