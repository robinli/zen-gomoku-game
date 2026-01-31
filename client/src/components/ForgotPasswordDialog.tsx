import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordDialogProps {
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ onClose, onSuccess, onError }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            return;
        }

        setLoading(true);

        try {
            // 動態導入 Firebase Auth（避免在本機測試時載入）
            const { sendPasswordResetEmail } = await import('firebase/auth');
            const { auth } = await import('../services/firebase');

            if (!auth) {
                throw new Error('Firebase not initialized');
            }

            await sendPasswordResetEmail(auth, email, {
                url: window.location.origin,
                handleCodeInApp: false,
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Password reset error:', err);

            let errorMessage = t('login.forgot_password_error_message');

            // Firebase 錯誤訊息處理
            if (err.code === 'auth/invalid-email') {
                errorMessage = t('login.error_invalid_email');
            } else if (err.code === 'auth/user-not-found') {
                // 為了安全性，即使使用者不存在也顯示成功訊息
                onSuccess();
                onClose();
                return;
            }

            onError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 標題 */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-slate-900 rounded-full mx-auto flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {t('login.forgot_password_title')}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {t('login.forgot_password_description')}
                    </p>
                </div>

                {/* 表單 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {t('login.email')}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('login.email_placeholder')}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                            required
                            autoFocus
                        />
                    </div>

                    {/* 按鈕 */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('login.forgot_password_cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{t('login.loading')}</span>
                                </>
                            ) : (
                                <span>{t('login.forgot_password_send')}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordDialog;
