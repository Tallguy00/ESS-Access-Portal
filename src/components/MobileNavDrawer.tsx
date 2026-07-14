import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  LayoutDashboard, 
  FolderUp, 
  Bell, 
  User, 
  Settings, 
  HelpCircle, 
  LifeBuoy, 
  LogOut, 
  Sun, 
  Moon, 
  X, 
  ChevronRight,
  Sparkles,
  Globe
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';
import LanguageSwitcher from './LanguageSwitcher';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  activeTab: 'dashboard' | 'users' | 'audit_logs' | 'reports' | 'faq' | 'profile' | 'support';
  setActiveTab: (tab: 'dashboard' | 'users' | 'audit_logs' | 'reports' | 'faq' | 'profile' | 'support') => void;
  onNavigate: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard' | 'public-request' | 'public-track') => void;
  onOpenCreateModal?: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onOpenProfile?: () => void;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  setActiveTab,
  onNavigate,
  onOpenCreateModal,
  onLogout,
  theme,
  onToggleTheme,
  notifications: rawNotifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onOpenProfile
}: MobileNavDrawerProps) {
  const { t } = useTranslation();
  const [showNotificationsList, setShowNotificationsList] = useState(false);

  const notifications = Array.isArray(rawNotifications) ? rawNotifications.filter(Boolean) : [];
  const userNotifications = currentUser 
    ? notifications.filter(n => n.userEmail === currentUser.email)
    : [];
  const unreadNotifications = userNotifications.filter(n => !n.isRead);

  // Close the drawer and perform the requested action
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approved': return '🟢';
      case 'rejected': return '🔴';
      case 'granted': return '🔑';
      case 'submitted': return '🔵';
      case 'security': return '⚠️';
      default: return '✉️';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Translucent overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden cursor-pointer"
            onClick={onClose}
          />

          {/* Full-height right-aligned drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-900 shadow-2xl z-50 flex flex-col md:hidden overflow-hidden"
          >
            {/* Header / Brand info */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2 select-none">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight uppercase">
                  ESS Portal Menu
                </span>
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Mobile
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 focus:outline-none"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information Block */}
            {currentUser && (
              <div className="p-4 border-b border-slate-150 dark:border-slate-900/80 flex items-center gap-3 bg-indigo-50/20 dark:bg-indigo-950/10 shrink-0">
                {currentUser.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.fullName} 
                    className="w-11 h-11 rounded-full object-cover border border-indigo-500/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center select-none shadow-inner">
                    {currentUser.fullName.split(' ').map(n=>n[0]).join('')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate leading-snug">{currentUser.fullName}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider mt-0.5">{currentUser.role}</div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate">{currentUser.email}</div>
                </div>
              </div>
            )}

            {/* Main navigation body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Navigation Links Group */}
              <div className="space-y-1">
                <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-550 tracking-wider pl-3 mb-2">
                  Navigation
                </div>

                {/* 1. Home Link */}
                <button
                  onClick={() => handleAction(() => onNavigate('landing'))}
                  className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl border-none bg-transparent cursor-pointer transition-all text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <Home className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Home</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                </button>

                {/* 2. Dashboard Link */}
                <button
                  onClick={() => handleAction(() => {
                    onNavigate('dashboard');
                    setActiveTab('dashboard');
                  })}
                  className={`w-full flex items-center justify-between px-3 py-3 text-xs font-bold rounded-xl border-none bg-transparent cursor-pointer transition-all text-left ${
                    activeTab === 'dashboard'
                      ? 'text-indigo-600 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-950/20 font-extrabold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                </button>

                {/* 3. Requests Link */}
                <button
                  onClick={() => handleAction(() => {
                    onNavigate('dashboard');
                    setActiveTab('dashboard');
                    onOpenCreateModal?.();
                  })}
                  className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl border-none bg-transparent cursor-pointer transition-all text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <FolderUp className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Requests</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                </button>

                {/* 4. Notifications Expandable Link */}
                <div className="space-y-1">
                  <button
                    onClick={() => setShowNotificationsList(!showNotificationsList)}
                    className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl border-none bg-transparent cursor-pointer transition-all text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                        {unreadNotifications.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                      <span>Notifications</span>
                      {unreadNotifications.length > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 leading-none">
                          {unreadNotifications.length} active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-bold">
                      {showNotificationsList ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showNotificationsList && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-3 pr-1 space-y-1.5 overflow-hidden"
                      >
                        <div className="flex items-center justify-between py-1 px-1">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Recent Alerts</span>
                          {unreadNotifications.length > 0 && (
                            <button
                              onClick={onMarkAllNotificationsAsRead}
                              className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold bg-transparent border-none cursor-pointer"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>

                        <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                          {userNotifications.length === 0 ? (
                            <div className="p-4 text-center text-[11px] text-slate-400 italic">
                              No recent messages.
                            </div>
                          ) : (
                            userNotifications.map(item => (
                              <div 
                                key={item.id} 
                                onClick={() => onMarkNotificationAsRead(item.id)}
                                className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all flex gap-1.5 items-start text-left ${
                                  item.isRead 
                                    ? 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-900/40 opacity-60' 
                                    : 'bg-indigo-50/40 border-indigo-500/20 dark:bg-indigo-950/10 dark:border-indigo-900/60 hover:bg-indigo-50/60'
                                }`}
                              >
                                <span className="text-xs shrink-0 leading-none mt-0.5">{getNotificationIcon(item.type)}</span>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-normal break-words">{item.message}</p>
                                  <span className="text-[9px] text-slate-400 block">{new Date(item.createdAt).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 5. Profile Link */}
                <button
                  onClick={() => handleAction(() => {
                    onNavigate('dashboard');
                    setActiveTab('profile');
                  })}
                  className={`w-full flex items-center justify-between px-3 py-3 text-xs font-bold rounded-xl border-none bg-transparent cursor-pointer transition-all text-left ${
                    activeTab === 'profile'
                      ? 'text-indigo-600 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-950/20 font-extrabold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Profile</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                </button>

                {/* 6. Settings Link */}
                <button
                  onClick={() => handleAction(() => {
                    onNavigate('dashboard');
                    if (onOpenProfile) {
                      onOpenProfile();
                    } else {
                      setActiveTab('profile');
                    }
                  })}
                  className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl border-none bg-transparent cursor-pointer transition-all text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                </button>

                {/* 7. FAQ Link */}
                <button
                  onClick={() => handleAction(() => {
                    onNavigate('dashboard');
                    setActiveTab('faq');
                  })}
                  className={`w-full flex items-center justify-between px-3 py-3 text-xs font-bold rounded-xl border-none bg-transparent cursor-pointer transition-all text-left ${
                    activeTab === 'faq'
                      ? 'text-indigo-600 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-950/20 font-extrabold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>FAQ</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                </button>

                {/* 8. Support Link */}
                <button
                  onClick={() => handleAction(() => {
                    onNavigate('dashboard');
                    setActiveTab('support');
                  })}
                  className={`w-full flex items-center justify-between px-3 py-3 text-xs font-bold rounded-xl border-none bg-transparent cursor-pointer transition-all text-left ${
                    activeTab === 'support'
                      ? 'text-indigo-600 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-950/20 font-extrabold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <LifeBuoy className="w-4 h-4 text-emerald-550 shrink-0" />
                    <span>Support</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                </button>
              </div>

              {/* Preferences: Language, Theme */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-900">
                <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-550 tracking-wider pl-3 mb-1">
                  Preferences
                </div>

                {/* Language Toggle Container */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-450">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-semibold">Language</span>
                  </div>
                  <LanguageSwitcher />
                </div>

                {/* Theme Switcher Button */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-450">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span className="text-xs font-semibold">Theme Mode</span>
                  </div>
                  <button
                    onClick={onToggleTheme}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Light</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>Dark</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Logout Action Footer */}
            <div className="p-4 border-t border-slate-150 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
              <button
                onClick={() => handleAction(onLogout)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border-none"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log Out of Account</span>
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
