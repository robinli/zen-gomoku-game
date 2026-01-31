export interface User {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signInAsGuest: (name: string) => Promise<void>;
    signOut: () => Promise<void>;
}
