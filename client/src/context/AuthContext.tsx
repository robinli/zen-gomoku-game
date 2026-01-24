import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';
import { firebaseConfig, USE_MOCK_AUTH } from '../config/firebase';

// Firebase imports (只在非 Mock 模式下使用)
let auth: any = null;
let GoogleAuthProvider: any = null;
let signInWithPopup: any = null;
let signOut: any = null;
let onAuthStateChanged: any = null;

// 動態載入 Firebase (避免在 Mock 模式下載入)
if (!USE_MOCK_AUTH) {
    import('firebase/app').then(({ initializeApp }) => {
        import('firebase/auth').then((authModule) => {
            const app = initializeApp(firebaseConfig);
            auth = authModule.getAuth(app);
            GoogleAuthProvider = authModule.GoogleAuthProvider;
            signInWithPopup = authModule.signInWithPopup;
            signOut = authModule.signOut;
            onAuthStateChanged = authModule.onAuthStateChanged;
            console.log('✅ Firebase initialized');
        });
    });
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (USE_MOCK_AUTH) {
            // Mock Auth: 從 localStorage 讀取
            const storedUser = localStorage.getItem('mock_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        } else {
            // Real Firebase Auth: 監聽認證狀態
            if (!auth || !onAuthStateChanged) {
                // Firebase 尚未載入，等待一下
                const timer = setTimeout(() => {
                    if (auth && onAuthStateChanged) {
                        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
                            if (firebaseUser) {
                                setUser({
                                    uid: firebaseUser.uid,
                                    displayName: firebaseUser.displayName,
                                    photoURL: firebaseUser.photoURL
                                });
                            } else {
                                setUser(null);
                            }
                            setLoading(false);
                        });
                        return () => unsubscribe();
                    } else {
                        setLoading(false);
                    }
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
                    if (firebaseUser) {
                        setUser({
                            uid: firebaseUser.uid,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL
                        });
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                });
                return () => unsubscribe();
            }
        }
    }, []);

    const signIn = async () => {
        if (USE_MOCK_AUTH) {
            console.warn('Using Mock Auth, real Firebase sign in not available');
            await signInAsGuest('Player 1');
        } else {
            if (!auth || !GoogleAuthProvider || !signInWithPopup) {
                throw new Error('Firebase not initialized');
            }
            const provider = new GoogleAuthProvider();
            try {
                const result = await signInWithPopup(auth, provider);
                const firebaseUser = result.user;
                setUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL
                });
            } catch (error) {
                console.error('Sign in error:', error);
                throw error;
            }
        }
    };

    const signInAsGuest = async (name: string) => {
        const mockUser: User = {
            uid: `mock-user-${Date.now()}`,
            displayName: name,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        };

        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
    };

    const handleSignOut = async () => {
        if (USE_MOCK_AUTH) {
            localStorage.removeItem('mock_user');
            setUser(null);
        } else {
            if (!auth || !signOut) {
                throw new Error('Firebase not initialized');
            }
            await signOut(auth);
            setUser(null);
        }
    };

    return React.createElement(AuthContext.Provider, {
        value: { user, loading, signIn, signInAsGuest, signOut: handleSignOut }
    }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
