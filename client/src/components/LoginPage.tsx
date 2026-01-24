import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
    const { signInAsGuest } = useAuth();
    const { t } = useTranslation();
    const [guestName, setGuestName] = useState('');

    const handleGuestLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (guestName.trim()) {
            signInAsGuest(guestName);
        }
    };

    // For debugging/E2E
    const handleQuickLogin = (name: string) => {
        signInAsGuest(name);
    };

    return (
        <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 border-4 border-white rounded-full"></div>
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-800">
                        {t('app.title')}
                    </h1>
                </div>

                <div className="space-y-6">
                    {/* Guest Login Form */}
                    <form onSubmit={handleGuestLogin} className="space-y-4">
                        <div>
                            <label htmlFor="guestName" className="block text-sm font-medium text-slate-700 mb-1">
                                {t('login.nickname_label', 'Nickname')}
                            </label>
                            <input
                                id="guestName"
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                                placeholder={t('login.nickname_placeholder', 'Enter your nickname')}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition font-medium"
                        >
                            {t('login.enter_as_guest', 'Enter as Guest')}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">
                                {t('login.dev_options', 'Developer Options')}
                            </span>
                        </div>
                    </div>

                    {/* Dev Login Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleQuickLogin('Player 1')}
                            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm transition"
                        >
                            Log in as Player 1
                        </button>
                        <button
                            onClick={() => handleQuickLogin('Player 2')}
                            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm transition"
                        >
                            Log in as Player 2
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
