
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  // Simple style for the switcher
  // You might want to adjust this to fit your design
  return (
    <div className="flex gap-2 text-xs font-medium text-slate-500">
      <button
        onClick={() => changeLanguage('zh')}
        className={`px-2 py-1 rounded-md transition-colors ${
          currentLanguage.startsWith('zh')
            ? 'bg-slate-200 text-slate-900 font-bold'
            : 'hover:bg-slate-100'
        }`}
      >
        中文
      </button>
      <span className="self-center text-slate-300">|</span>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded-md transition-colors ${
          currentLanguage.startsWith('en')
            ? 'bg-slate-200 text-slate-900 font-bold'
            : 'hover:bg-slate-100'
        }`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
