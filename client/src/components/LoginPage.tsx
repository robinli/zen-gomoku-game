import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const { signIn, signUp } = useAuth();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                // 註冊
                if (!displayName.trim()) {
                    throw new Error(t('login.error_name_required'));
                }
                await signUp(email, password, displayName);
            } else {
                // 登入
                await signIn(email, password);
            }
        } catch (err: any) {
            console.error('Authentication error:', err);

            // Firebase 錯誤訊息轉換
            let errorMessage = err.message;
            if (err.code === 'auth/invalid-email') {
                errorMessage = t('login.error_invalid_email');
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = t('login.error_user_not_found');
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = t('login.error_wrong_password');
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = t('login.error_email_in_use');
            } else if (err.code === 'auth/weak-password') {
                errorMessage = t('login.error_weak_password');
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f5f2] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full space-y-6 animate-in slide-in-from-bottom duration-700 border border-slate-100">
                {/* Logo */}
                <div className="space-y-2 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-full mx-auto flex items-center justify-center shadow-lg">
                        <div className="w-8 h-8 border-4 border-white rounded-full"></div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                        {t('app.title')}
                    </h2>
                    <p className="text-slate-500">
                        {isSignUp ? t('login.signup_subtitle') : t('login.signin_subtitle')}
                    </p>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-300">
                        {error}
                    </div>
                )}

                {/* 表單 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 顯示名稱 (僅註冊時) */}
                    {isSignUp && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                {t('login.display_name')}
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={t('login.display_name_placeholder')}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                                required={isSignUp}
                                minLength={2}
                                maxLength={20}
                            />
                        </div>
                    )}

                    {/* Email */}
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
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {t('login.password')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('login.password_placeholder')}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all pr-12"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-slate-800 transform transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            <span>{isSignUp ? t('login.signup_button') : t('login.signin_button')}</span>
                        )}
                    </button>
                </form>

                {/* 切換登入/註冊 */}
                <div className="text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                        className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        {isSignUp ? t('login.have_account') : t('login.no_account')}
                    </button>
                </div>

                {/* 測試帳號提示 (僅開發環境) */}
                {import.meta.env.DEV && (
                    <div className="text-xs text-slate-400 text-center space-y-1 pt-4 border-t border-slate-100">
                        <p className="font-semibold">{t('login.test_accounts')}</p>
                        <p>player1@test.com / test123456</p>
                        <p>player2@test.com / test123456</p>
                    </div>
                )}
            </div>

            {/* 語言切換器 */}
            <div className="mt-6">
                <LanguageSwitcher />
            </div>
        </div>
    );
};

export default LoginPage;
