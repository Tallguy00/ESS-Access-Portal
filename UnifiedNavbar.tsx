import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Sun, Moon, Globe } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const essLogo = "https://lh3.googleusercontent.com/d/1wqaNrU4Aga0Sciqqoq2BVodC-2Siv3bc";

interface UnifiedNavbarProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard' | 'public-request' | 'public-track') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  scrollToSection?: (id: string) => void;
}

export default function UnifiedNavbar({ onNavigate, theme, onToggleTheme, scrollToSection }: UnifiedNavbarProps) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string, pageId?: 'landing' | 'public-track' | 'public-request') => {
    setMobileMenuOpen(false);
    if (pageId && pageId !== 'landing') {
      onNavigate(pageId);
    } else {
      if (scrollToSection) {
        scrollToSection(sectionId);
      } else {
        onNavigate('landing');
        // Fallback smooth scroll after navigation
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  return (
    <>
      <nav id="landing-navbar" className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-900/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand Area */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-full border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center justify-center select-none">
              <img 
                src={essLogo} 
                alt="Ethiopian Statistics Service Logo" 
                className="w-8 h-8 object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase select-none">
                ESS Access Portal
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded tracking-wider">
                  {t('landingExtra.badgeFederal', 'Federal')}
                </span>
              </span>
            </div>
          </div>

          {/* Responsive Desktop Navigation Links (Large Viewport md/lg and up) */}
          <div className="hidden lg:flex items-center gap-6">
            <button 
              onClick={() => handleNavClick('hero-section')} 
              className="text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('landing.navHome', 'Home')}
            </button>
            <button 
              onClick={() => handleNavClick('features-section')} 
              className="text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('landingExtra.navCapabilities', 'Capabilities')}
            </button>
            <button 
              onClick={() => handleNavClick('how-it-works-section')} 
              className="text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('landingExtra.navWorkflows', 'Workflows')}
            </button>
            <button 
              onClick={() => handleNavClick('benefits-section')} 
              className="text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('landingExtra.navGovernance', 'Governance')}
            </button>
            <button 
              onClick={() => handleNavClick('stats-section')} 
              className="text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('landingExtra.navMetrics', 'Metrics')}
            </button>
            <button 
              onClick={() => handleNavClick('contact-section')} 
              className="text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('landingExtra.navHelpdesk', 'Helpdesk')}
            </button>
          </div>

          {/* Desktop Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />
            
            <button
              id="btn-landing-theme-toggle"
              type="button"
              onClick={onToggleTheme}
              className="w-11 h-11 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 rounded-xl transition-all flex items-center justify-center cursor-pointer border-none bg-transparent focus:outline-none"
              title={t('landingExtra.themeToggleTitle', 'Switch Theme')}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-emerald-600" />
              )}
            </button>
            
            <button 
              onClick={() => onNavigate('public-track')}
              className="text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 px-3.5 py-2 rounded-lg transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('landingExtra.navTrackStatus', 'Track Status')}
            </button>

            <button 
              onClick={() => onNavigate('login')}
              className="bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs px-4.5 py-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-none focus:outline-none"
              id="nav-signin-btn"
            >
              {t('landing.navAdmin', 'Staff Sign In')}
            </button>
          </div>

          {/* Mobile Layout Controls (Below lg Viewport Breakpoint) */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              id="btn-mobile-landing-theme-toggle"
              type="button"
              onClick={onToggleTheme}
              className="w-11 h-11 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 rounded-xl transition-all flex items-center justify-center cursor-pointer border-none bg-transparent focus:outline-none"
              title={t('landingExtra.themeToggleTitle', 'Switch Theme')}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-emerald-600" />
              )}
            </button>
            
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="w-11 h-11 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 focus:outline-none"
              id="mobile-menu-toggle"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>
    </nav>

    {/* Unified Mobile Slide-in Drawer Container */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Dark translucent backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in Drawer with the requested links & buttons */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className={`fixed inset-0 w-full h-full z-50 flex flex-col overflow-y-auto p-6 sm:p-10 md:p-16 transition-colors duration-300 ${
              theme === 'light' 
                ? 'bg-white text-slate-900' 
                : 'bg-slate-950 text-white'
            }`}
          >
            {/* Drawer Top Header Area */}
            <div className={`flex items-center justify-between pb-8 pt-2 shrink-0 border-b ${
              theme === 'light' ? 'border-slate-200/80' : 'border-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <img 
                  src={essLogo} 
                  alt="Ethiopian Statistics Service Logo" 
                  className="w-10 h-10 object-contain rounded-full shadow-md shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold text-sm sm:text-base uppercase tracking-wider whitespace-nowrap ${
                    theme === 'light' ? 'text-slate-950' : 'text-white'
                  }`}>
                    ESS ACCESS PORTAL
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    FEDERAL
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                

                {/* Sun/Moon Theme Toggle */}
                <button
                  id="drawer-theme-toggle"
                  type="button"
                  onClick={onToggleTheme}
                  className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer border-none bg-transparent shrink-0 focus:outline-none ${
                    theme === 'light' 
                      ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title={t('landingExtra.themeToggleTitle', 'Switch Theme')}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5.5 h-5.5 text-amber-400" />
                  ) : (
                    <Moon className="w-5.5 h-5.5 text-emerald-500" />
                  )}
                </button>

                {/* Close Drawer Trigger Button */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-11 h-11 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 focus:outline-none ${
                    theme === 'light' 
                      ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 flex flex-col justify-center space-y-5 sm:space-y-6 max-w-lg mx-auto w-full py-12">
              <button
                onClick={() => handleNavClick('hero-section')}
                className={`w-full text-left text-lg sm:text-xl font-bold tracking-tight transition-colors bg-transparent border-none cursor-pointer focus:outline-none ${
                  theme === 'light' ? 'text-slate-700 hover:text-emerald-600' : 'text-slate-200 hover:text-emerald-400'
                }`}
              >
                {t('landing.navHome', 'Home')}
              </button>

              <button
                onClick={() => handleNavClick('features-section')}
                className={`w-full text-left text-lg sm:text-xl font-bold tracking-tight transition-colors bg-transparent border-none cursor-pointer focus:outline-none ${
                  theme === 'light' ? 'text-slate-700 hover:text-emerald-600' : 'text-slate-200 hover:text-emerald-400'
                }`}
              >
                {t('landingExtra.navCapabilities', 'Capabilities')}
              </button>

              <button
                onClick={() => handleNavClick('how-it-works-section')}
                className={`w-full text-left text-lg sm:text-xl font-bold tracking-tight transition-colors bg-transparent border-none cursor-pointer focus:outline-none ${
                  theme === 'light' ? 'text-slate-700 hover:text-emerald-600' : 'text-slate-200 hover:text-emerald-400'
                }`}
              >
                {t('landingExtra.navWorkflows', 'Workflows')}
              </button>

              <button
                onClick={() => handleNavClick('benefits-section')}
                className={`w-full text-left text-lg sm:text-xl font-bold tracking-tight transition-colors bg-transparent border-none cursor-pointer focus:outline-none ${
                  theme === 'light' ? 'text-slate-700 hover:text-emerald-600' : 'text-slate-200 hover:text-emerald-400'
                }`}
              >
                {t('landingExtra.navGovernance', 'Governance')}
              </button>

              <button
                onClick={() => handleNavClick('stats-section', 'public-track')}
                className={`w-full text-left text-lg sm:text-xl font-bold tracking-tight transition-colors bg-transparent border-none cursor-pointer focus:outline-none ${
                  theme === 'light' ? 'text-slate-700 hover:text-emerald-600' : 'text-slate-200 hover:text-emerald-400'
                }`}
              >
                {t('landingExtra.navTrackStatus', 'Track Status')}
              </button>
              {/* Amharic/English Language Toggle directly in drawer header */}
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>

            {/* Bottom Actions Row matching the image exactly */}
            <div className={`border-t pt-8 pb-10 max-w-lg mx-auto w-full shrink-0 ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-900'
            }`}>
              <div className="flex gap-4">
                {/* Staff Sign In */}
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-4 border text-sm font-bold rounded-xl bg-transparent transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    theme === 'light' 
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-50' 
                      : 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>{t('landingExtra.staffSignIn', 'Staff Sign In')}</span>
                </button>

                {/* Request Access */}
                <button
                  onClick={() => {
                    onNavigate('public-request');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-sm font-extrabold text-white rounded-xl border-none cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('landing.navRequest', 'Request Access')}</span>
                </button>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
