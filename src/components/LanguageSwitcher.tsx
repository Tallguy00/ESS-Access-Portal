import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang.startsWith('en') ? 'am' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      id="btn-language-switcher"
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-2.5 px-4 h-11 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm cursor-pointer select-none shrink-0"
      title={currentLang.startsWith('en') ? 'ወደ አማርኛ ለመቀየር' : 'Switch to English'}
    >
      <Globe className="w-4 h-4 text-blue-500 animate-spin-slow shrink-0" />
      <span className="flex items-center gap-1 font-sans">
        {currentLang.startsWith('en') ? (
          <>
            <span>🇬🇧 EN</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-400 dark:text-slate-500">አማ</span>
          </>
        ) : (
          <>
            <span className="text-slate-400 dark:text-slate-500">EN</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 dark:text-emerald-450">🇪🇹 አማ</span>
          </>
        )}
      </span>
    </button>
  );
}
