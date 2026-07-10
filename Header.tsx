import React, { useState } from 'react';
import { UserProfile, UserRole, AppNotification } from '../types';
import { 
  Bell, 
  Key, 
  LogOut, 
  ShieldAlert, 
  CheckSquare, 
  Sparkles, 
  User, 
  RefreshCw, 
  Layers, 
  Search, 
  Settings, 
  X, 
  Shield, 
  Sun, 
  Moon,
  Menu,
  ChevronDown,
  Home as HomeIcon,
  LayoutDashboard,
  FolderUp,
  HelpCircle,
  LifeBuoy,
  Users,
  FileBarChart,
  History
} from 'lucide-react';
import SearchInput from './SearchInput';
import LanguageSwitcher from './LanguageSwitcher';
import MobileNavDrawer from './MobileNavDrawer';
import { motion, AnimatePresence } from 'motion/react';

const essLogo = "https://lh3.googleusercontent.com/d/1wqaNrU4Aga0Sciqqoq2BVodC-2Siv3bc";

interface HeaderProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onSwitchRole: (newRole: UserRole) => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  globalSearchTerm?: string;
  setGlobalSearchTerm?: (val: string) => void;
  onOpenProfile?: () => void;
  onSelectProfileTab?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  
  // Optional navigation properties for tablet & mobile
  activeTab?: 'dashboard' | 'users' | 'audit_logs' | 'reports' | 'faq' | 'profile' | 'support';
  setActiveTab?: (tab: 'dashboard' | 'users' | 'audit_logs' | 'reports' | 'faq' | 'profile' | 'support') => void;
  onNavigate?: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard' | 'public-request' | 'public-track') => void;
  onOpenCreateModal?: () => void;
}

export default function Header({
  currentUser,
  onLogout,
  onSwitchRole,
  notifications: rawNotifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  globalSearchTerm = '',
  setGlobalSearchTerm,
  onOpenProfile,
  onSelectProfileTab,
  theme,
  onToggleTheme,
  activeTab = 'dashboard',
  setActiveTab,
  onNavigate,
  onOpenCreateModal
}: HeaderProps) {
  const notifications = Array.isArray(rawNotifications) ? rawNotifications.filter(Boolean) : [];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Tablet states
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  
  // Mobile states
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead && (!currentUser || n.userEmail === currentUser.email));
  const userNotifications = notifications.filter(n => !currentUser || n.userEmail === currentUser.email);

  const handleSwitch = (role: UserRole) => {
    onSwitchRole(role);
    setShowRoleSwitcher(false);
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

  // Reusable compact Brand Logo + Badge Area that is guaranteed to not wrap or shrink
  const BrandArea = ({ hideTextOnMobile = false }: { hideTextOnMobile?: boolean }) => (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      <div className="bg-white p-1 rounded-full border border-slate-200/60 dark:border-slate-800/85 shadow-sm flex items-center justify-center shrink-0">
        <img 
          src={essLogo} 
          alt="Ethiopian Statistics Service Logo" 
          className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className={`${hideTextOnMobile ? 'hidden sm:block' : ''} shrink-0`}>
        <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-none tracking-tight flex items-center gap-1 shrink-0 whitespace-nowrap">
          ESS Access Portal
          <span className="text-[7px] sm:text-[8px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Federal</span>
        </h1>
        <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase block mt-0.5 whitespace-nowrap">Ethiopian Statistics Service</span>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-900/60 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between transition-all">
      
      {/* ========================================= */}
      {/* 1. DESKTOP HEADER LAYOUT (>= 1280px)      */}
      {/* ========================================= */}
      <div className="hidden xl:flex items-center justify-between w-full">
        {/* Brand area */}
        <BrandArea />

        {/* Top Navigation Search Input */}
        {currentUser && setGlobalSearchTerm && (
          <div className="flex-1 max-w-sm mx-6">
            <SearchInput
              value={globalSearchTerm}
              onChange={setGlobalSearchTerm}
              placeholder="Search active requests by title or system..."
              id="global-header-search"
            />
          </div>
        )}

        {/* Center simulation controller */}
        {currentUser && (
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl px-3.5 py-1.5 text-xs shadow-sm">
            <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 select-none">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Active Persona Role:</span>
            </span>
            <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 font-extrabold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-md select-none">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {currentUser && (
            <>
              {/* Theme Toggle Button */}
              <button
                id="btn-header-theme-toggle"
                type="button"
                onClick={onToggleTheme}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all flex items-center justify-center cursor-pointer border-none bg-transparent"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600" />
                )}
              </button>

              {/* Notifications panel */}
              <div className="relative">
                <button
                  id="btn-notifications"
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications.length > 0 && (
                    <span id="notifications-badge" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce shadow-sm">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div id="notifications-dropdown" className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-4 space-y-3 z-50 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-2.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">Recent Alerts</span>
                        {unreadNotifications.length > 0 && (
                          <button
                            onClick={onMarkAllNotificationsAsRead}
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 overflow-y-auto max-h-[280px]">
                        {userNotifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-gray-400 italic">No recent messages.</div>
                        ) : (
                          userNotifications.map(item => (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                onMarkNotificationAsRead(item.id);
                                setShowNotifications(false);
                              }}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex gap-2 items-start ${
                                item.isRead 
                                  ? 'bg-gray-50/50 border-gray-100 dark:bg-gray-900/30 dark:border-gray-850/50 opacity-60' 
                                  : 'bg-blue-50/20 border-blue-500/30 dark:bg-blue-950/10 dark:border-blue-950/40 hover:bg-blue-50/40'
                              }`}
                            >
                              <span className="text-sm leading-none">{getNotificationIcon(item.type)}</span>
                              <div className="space-y-0.5 flex-1">
                                <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{item.message}</p>
                                <span className="text-[10px] text-gray-400 block">{new Date(item.createdAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Avatar Card with Dropdown */}
              <div className="relative flex items-center gap-2 border-l border-gray-150 dark:border-gray-800 pl-3">
                <button
                  id="btn-avatar-dropdown-toggle"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-85 focus:outline-none transition-all p-1 rounded-xl border-none bg-transparent"
                >
                  {currentUser.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt="Profile Avatar" 
                      className="w-8 h-8 rounded-full object-cover border border-blue-500/20"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xs flex items-center justify-center select-none shadow-inner">
                      {currentUser.fullName.split(' ').map(n=>n[0]).join('')}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-black text-gray-950 dark:text-white leading-none">{currentUser.fullName}</div>
                    <span className="text-[10px] text-gray-500 font-medium">{currentUser.role}</span>
                  </div>
                </button>

                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-fade-in">
                      {/* Dropdown Header */}
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-850">
                        <p className="text-xs font-black text-gray-950 dark:text-white truncate">{currentUser.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{currentUser.email}</p>
                      </div>

                      {/* Dropdown Options */}
                      <div className="py-1">
                        {onSelectProfileTab && (
                          <button
                            id="dropdown-item-profile"
                            onClick={() => {
                              onSelectProfileTab();
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-250 hover:bg-gray-50 dark:hover:bg-gray-800/60 font-semibold flex items-center gap-2 cursor-pointer transition-colors border-none bg-transparent"
                          >
                            <User className="w-4 h-4 text-blue-500" />
                            <span>Profile & Security</span>
                          </button>
                        )}

                        {onOpenProfile && (
                          <button
                            id="dropdown-item-notifications"
                            onClick={() => {
                              onOpenProfile();
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-250 hover:bg-gray-50 dark:hover:bg-gray-800/60 font-semibold flex items-center gap-2 cursor-pointer transition-colors border-none bg-transparent"
                          >
                            <Settings className="w-4 h-4 text-indigo-500" />
                            <span>Notification Preferences</span>
                          </button>
                        )}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="border-t border-gray-100 dark:border-gray-850 pt-1">
                        <button
                          id="dropdown-item-logout"
                          onClick={() => {
                            onLogout();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold flex items-center gap-2 cursor-pointer transition-colors border-none bg-transparent"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. MOBILE & TABLET LAYOUT (< 1280px)      */}
      {/* ========================================= */}
      <div className="flex xl:hidden items-center justify-between w-full">
        {/* Logo and Federal Badge - compact & un-wrapping */}
        <BrandArea hideTextOnMobile={false} />

        {/* Right side simple buttons: Toggle Theme & Hamburger */}
        <div className="flex items-center gap-2.5">
          {/* Light/Dark Toggle - 44x44px Touch Target */}
          <button
            onClick={onToggleTheme}
            className="w-11 h-11 hover:bg-gray-150 dark:hover:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-250 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          {/* Hamburger Menu - Guaranteed 44x44px Touch Target per Mobile A11y Guidelines */}
          <button
            id="btn-mobile-hamburger"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-11 h-11 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>
    </header>

    {/* ========================================= */}
    {/* 4. MOBILE SLIDE-IN DRAWER (RIGHT SIDE)    */}
    {/* ========================================= */}
    <MobileNavDrawer
      isOpen={isMobileDrawerOpen}
      onClose={() => setIsMobileDrawerOpen(false)}
      currentUser={currentUser}
      activeTab={activeTab}
      setActiveTab={setActiveTab || (() => {})}
      onNavigate={onNavigate || (() => {})}
      onOpenCreateModal={onOpenCreateModal}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
      notifications={notifications}
      onMarkNotificationAsRead={onMarkNotificationAsRead}
      onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
      onOpenProfile={onOpenProfile}
    />
    </>
  );
}
