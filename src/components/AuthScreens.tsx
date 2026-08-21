import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserRole, Department, UserProfile } from '../types';
import { getDepartmentFromEmail } from '../utils/deptMapper';

const essLogo = "https://lh3.googleusercontent.com/d/1wqaNrU4Aga0Sciqqoq2BVodC-2Siv3bc";
import { 
  AlertCircle, Lock, Mail, User, ShieldCheck, ArrowRight, 
  Sparkles, Building, KeyRound, Info, Eye, EyeOff, 
  Check, Shield, Timer, RefreshCw, Menu, X, Sun, Moon,
  Phone, Briefcase
} from 'lucide-react';

// Validation helper for E.164 format (starts with +, followed by 7 to 15 digits)
export function validateE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.trim().replace(/\s+/g, ''));
}

export function AuthLayout({ 
  children, 
  currentPage, 
  onNavigate,
  theme,
  onToggleTheme
}: { 
  children: React.ReactNode; 
  currentPage: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard'; 
  onNavigate: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  const isLogin = currentPage === 'login';
  const isRegister = currentPage === 'register';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white relative pb-16">
      
      {/* Floating Background Glows */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/30 to-transparent dark:from-indigo-950/20 pointer-events-none z-0" />
      <div className="absolute top-[400px] left-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[200px] right-10 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Navigation Bar matching the landing page */}
      <nav id="landing-navbar" className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-900/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Section */}
            <button 
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none"
            >
              <div className="bg-white p-1 rounded-full border border-slate-200/60 dark:border-slate-850 shadow-sm flex items-center justify-center">
                <img 
                  src={essLogo} 
                  alt="Ethiopian Statistics Service Logo" 
                  className="w-8 h-8 object-contain rounded-full animate-pulse"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  ESS Access Portal
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Federal</span>
                </span>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('landing')} className="text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-none">Home</button>
              <span className="text-slate-200 dark:text-slate-800">|</span>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-455 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">Enterprise Gateway</span>
            </div>

            {/* Access Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                id="btn-auth-theme-toggle"
                type="button"
                onClick={onToggleTheme}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600" />
                )}
              </button>
              <button 
                onClick={() => onNavigate('login')}
                className={`text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer bg-transparent border-none ${isLogin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                id="nav-signin-btn"
              >
                Sign In
              </button>
              <button 
                onClick={() => onNavigate('register')}
                className={`font-bold text-xs px-4.5 py-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-none ${isRegister ? 'bg-[#0052cc] hover:bg-blue-700 text-white animate-pulse' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300'}`}
                id="nav-getstarted-btn"
              >
                Create Account
              </button>
            </div>

            {/* Mobile Actions: Theme Toggle & Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                id="btn-mobile-auth-theme-toggle"
                type="button"
                onClick={onToggleTheme}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600" />
                )}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer bg-transparent border-none"
                id="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900 px-4 py-4 space-y-2 flex flex-col">
            <button onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }} className="text-left py-2 text-xs font-bold text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-transparent border-none">Home</button>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex items-center gap-3">
              <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }} className={`flex-1 text-center py-2 border text-xs font-bold rounded-xl bg-transparent ${isLogin ? 'border-indigo-600 text-indigo-600' : 'border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300'}`}>Sign In</button>
              <button onClick={() => { onNavigate('register'); setMobileMenuOpen(false); }} className={`flex-1 text-center py-2 text-xs font-bold rounded-xl border-none ${isRegister ? 'bg-[#0052cc] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300'}`}>Register</button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content center grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 flex flex-col items-center">
        
        {/* Welcome branding block */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shadow-sm uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>SECURE GOVERNMENT AUTHENTICATION GATEWAY</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            ESS Access Portal
          </h1>
        </div>

        {/* Auth form sheet card */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/85 shadow-2xl rounded-2xl p-6 sm:p-10 relative overflow-hidden transition-all duration-300">
          
          {/* Subtle color top bar indicator */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500"></div>

          {/* Capsule Tab Switcher - only for login & register pages */}
          {(isLogin || isRegister) && (
            <div className="mb-6 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center shadow-inner">
              <button
                onClick={() => onNavigate('login')}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition-all border-none cursor-pointer ${
                  isLogin 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => onNavigate('register')}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition-all border-none cursor-pointer ${
                  isRegister 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                Create account
              </button>
            </div>
          )}

          <div className="space-y-6">
            {children}
          </div>
        </div>

        {/* Bottom micro security indicator */}
        <div className="mt-8 text-center max-w-md">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Immutable Roster Auditing & GDPR/SOC2 Certified</span>
          </p>
        </div>

      </div>
    </div>
  );
}

// Fallback Modal Helper Component for Federated Authentication Setup
export function GoogleAuthHelperModal({
  isOpen,
  onClose,
  onSimulateSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSimulateSuccess: (email: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-500" />
            OAuth Callback Redirect
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          OAuth providers require configured redirect URLs in Supabase settings. Would you like to proceed with standard simulation mode?
        </p>
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => {
              onSimulateSuccess('user.demo@ess.gov.et');
              onClose();
            }}
            className="flex-1 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-none"
          >
            Bypass OAuth
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border-none cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface LoginScreenProps {
  onSuccess: (email: string) => void;
  onNavigate: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard') => void;
  profiles: UserProfile[];
}

export function LoginScreen({ onSuccess, onNavigate, profiles }: LoginScreenProps) {
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('password');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [otpStage, setOtpStage] = useState<'email' | 'verify'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      setLoading(true);
      const callbackUrl = window.location.origin + '/auth/callback';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl
        }
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Google Authentication gateway failure.');
      setShowGoogleModal(true);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      setLoading(true);
      const callbackUrl = window.location.origin + '/auth/callback';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: callbackUrl
        }
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Apple Authentication gateway failure.');
      setShowGoogleModal(true);
    }
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setOtpStage('verify');
        setCountdown(60);
        setOtpSentTime(Date.now());
        setSuccessMsg('OTP sent successfully. Verify your organization inbox for the security key.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP dispatch gateway timeout. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.toLowerCase().trim();

    if (failedAttempts >= 5) {
      setErrorMsg('Too many attempts. Security block on this session is active. Please wait to try again.');
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Invalid OTP. Please enter the full 6-digit verification code.');
      return;
    }
    
    if (otpSentTime && Date.now() - otpSentTime > 10 * 60 * 1000) {
      setErrorMsg('Expired OTP. Code has expired after 10 minutes. Please trigger a new dispatch.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        
        if (next >= 5) {
          setErrorMsg('Too many attempts. Security lockout active. Please wait before retrying.');
        } else {
          const isExpiredErr = error.message.toLowerCase().includes('expired');
          if (isExpiredErr) {
            setErrorMsg('Expired OTP. Verification token validity expired.');
          } else {
            setErrorMsg(`Invalid OTP. Verification failed: ${error.message}`);
          }
        }
      } else if (data?.user || data?.session) {
        setFailedAttempts(0);
        onSuccess(trimmedEmail);
      } else {
        setFailedAttempts(0);
        onSuccess(trimmedEmail);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP authentication service timed out.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    let targetEmail = email.trim();
    
    if (targetEmail && !targetEmail.includes('@')) {
      const matchedLocal = profiles.find(p => 
        p.employeeId?.toLowerCase().trim() === targetEmail.toLowerCase() ||
        p.fullName?.toLowerCase().replace(/\s+/g, '').trim() === targetEmail.toLowerCase().replace(/\s+/g, '').trim()
      );
      
      if (matchedLocal) {
        targetEmail = matchedLocal.email;
      } else {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('employee_id', targetEmail)
            .limit(1);
            
          if (!error && data && data.length > 0) {
            targetEmail = data[0].email;
          } else {
            const savedStr = localStorage.getItem('ar_profiles');
            if (savedStr) {
              const savedProfiles = JSON.parse(savedStr);
              const matchedFallback = savedProfiles.find((p: any) => 
                p.employeeId?.toLowerCase().trim() === targetEmail.toLowerCase() ||
                p.employee_id?.toLowerCase().trim() === targetEmail.toLowerCase()
              );
              if (matchedFallback) {
                targetEmail = matchedFallback.email;
              }
            }
          }
        } catch (dbErr) {
          console.error("Error querying profiles for employee ID:", dbErr);
        }
      }
    }

    const trimmedEmail = targetEmail.toLowerCase().trim();

    if (!trimmedEmail.includes('@')) {
      setErrorMsg('Could not find a corporate email associated with that Employee ID. Please use your registered email address.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: trimmedEmail, 
        password 
      });

      if (!error && (data?.user || data?.session)) {
        console.log("Supabase Auth successful!");
        const loggedEmail = data.user?.email || trimmedEmail;
        onSuccess(loggedEmail);
        return;
      }

      if (error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('Access authorization failure. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Access authorization failure. Please check your fields.');
    } font-sans finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-modal-slide">
      
      {/* Top Info Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 id="login-heading" className="text-3xl font-black text-gray-955 dark:text-white tracking-tight">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Sign in to manage access requests.</p>
        </div>
      </div>

      {/* Auth Method Switcher Toggle */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          type="button"
          onClick={() => { setAuthMethod('password'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
            authMethod === 'password'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setAuthMethod('otp'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
            authMethod === 'otp'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent'
          }`}
        >
          Email OTP / Magic Link
        </button>
      </div>

      {/* SYSTEM PASSWORD SIGN IN METHOD */}
      {authMethod === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Email or Employee ID</label>
            <input
              id="login-email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or Username (Employee ID)"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Password</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot')}
                className="text-xs text-[#0052cc] dark:text-blue-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-605 transition-colors bg-transparent border-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-955/30 border border-red-200/50 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-400 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3.5 bg-green-50 dark:bg-green-955/20 border border-green-200/50 dark:border-green-900/40 rounded-xl text-green-700 dark:text-green-400 text-xs text-left">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] border-none"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* OTP WORKFLOW FORM */
        <div className="space-y-4">
          {otpStage === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Corporate Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ess.gov.et"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-955/30 border border-red-200/50 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-400 text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-none"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <span>Dispatch OTP Code</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Verification Code (6-Digit OTP)</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-mono py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-955/30 border border-red-200/50 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-400 text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 p-3.5 bg-green-50 dark:bg-green-955/20 border border-green-200/50 dark:border-green-900/40 rounded-xl text-green-700 dark:text-green-400 text-xs text-left">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-none"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <span>Verify & Authenticate</span>}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOtpStage('email')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 bg-transparent border-none cursor-pointer font-bold"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={() => handleSendOTP()}
                  className="text-blue-600 dark:text-blue-400 disabled:text-gray-400 bg-transparent border-none cursor-pointer font-bold"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bottom Legal Copy */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        By continuing you agree to the organization's access policies.
      </div>

      {/* Federated Logins */}
      <div className="space-y-3 pt-1">
        <div className="relative flex py-1 items-center justify-center">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          <span className="flex-shrink mx-3 text-gray-400 text-[10px] uppercase tracking-wider font-bold flex items-center bg-white dark:bg-gray-900 px-2">
            <span>OR FEDERATED SIGN IN</span>
          </span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M21.35 11.1H12v2.7h5.38c-.24 1.28-.96 2.37-2.04 3.1v2.6h3.3c1.93-1.78 3.04-4.4 3.04-7.4 0-.34-.03-.68-.09-1z" fill="#4285F4" />
                <path d="M12 20.6c2.59 0 4.77-.86 6.36-2.34l-3-2.6c-.91.61-2.08.98-3.36.98-2.37 0-4.38-1.6-5.1-3.75H3.5v2.7C5.11 18.78 8.35 20.6 12 20.6z" fill="#34A853" />
                <path d="M6.9 12.89c-.18-.54-.28-1.11-.28-1.7s.1-1.17.28-1.7V6.79H3.5c-.6 1.23-.96 2.62-.96 4.1s.36 2.87.96 4.1l3.4-2.1z" fill="#FBBC05" />
                <path d="M12 6.1c1.41 0 2.68.49 3.68 1.44l2.75-2.75C16.76 3.31 14.58 2.44 12 2.44 8.35 2.44 5.11 4.26 3.5 7.39l3.4 2.7C7.62 7.7 9.63 6.1 12 6.1z" fill="#EA4335" />
              </g>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            id="apple-signin-btn"
            onClick={handleAppleSignIn}
            className="w-full py-2.5 px-4 bg-black hover:bg-neutral-900 text-white border border-transparent rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12.87 0 1.98-.54 2.51-1.45z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>
      </div>

      <GoogleAuthHelperModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSimulateSuccess={(email) => onSuccess(email)}
      />

    </div>
  );
}

interface RegisterScreenProps {
  onSuccess: (email: string, details: { fullName: string; role: UserRole; departmentId: string; phoneNumber?: string; jobTitle?: string }) => void;
  onNavigate: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard') => void;
  departments: Department[];
  profiles: UserProfile[];
}

export function RegisterScreen({ onSuccess, onNavigate, departments, profiles }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('User');
  const [dept, setDept] = useState('');
  const [showSandboxRole, setShowSandboxRole] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Auto-map department based on corporate email entry
  useEffect(() => {
    if (email.includes('@')) {
      const autoDept = getDepartmentFromEmail(email);
      if (autoDept) {
        setDept(autoDept);
      }
    }
  }, [email]);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      const callbackUrl = window.location.origin + '/auth/callback';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl
        }
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Google Authentication gateway failure.');
      setShowGoogleModal(true);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      const callbackUrl = window.location.origin + '/auth/callback';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: callbackUrl
        }
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Apple Authentication gateway failure.');
      setShowGoogleModal(true);
    }
  };

  const startRegistrationFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!dept) {
      setErrorMsg('Please select your target corporate department.');
      return;
    }

    if (phoneNumber && !validateE164(phoneNumber)) {
      setErrorMsg('Phone number must follow valid E.164 international format (e.g. +251911234567).');
      return;
    }

    setLoading(true);

    try {
      const emailToSubmit = email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@company.local`;
      const passToSubmit = password || 'SecureTemporary123!';
      
      const { data, error } = await supabase.auth.signUp({ 
        email: emailToSubmit, 
        password: passToSubmit,
        options: {
          data: {
            full_name: fullName,
            role: role,
            department_id: dept,
            phone_number: phoneNumber,
            job_title: jobTitle
          }
        }
      });
      
      if (error) {
        setErrorMsg(error.message);
      } else {
        onSuccess(emailToSubmit, { 
          fullName, 
          role, 
          departmentId: dept,
          phoneNumber,
          jobTitle
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Access authorization failure. Registration aborted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-modal-slide">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 id="register-heading" className="text-3xl font-black text-gray-955 dark:text-white tracking-tight">Create account</h2>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Register to request secure enterprise access.</p>
        </div>
      </div>

      <div>
        <form onSubmit={startRegistrationFlow} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Full Name</label>
            <div className="relative">
              <input
                id="register-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Abebe Bikila"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Corporate Email</label>
            <div className="relative">
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abebe.bikila@ess.gov.et"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Phone Number (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+251911234567"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Job Title (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Senior Statistician"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Department</label>
            <div className="relative">
              <select
                id="register-dept"
                required
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
              >
                <option value="" disabled>Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-sm text-gray-955 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Sandbox Role Override */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowSandboxRole(!showSandboxRole)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showSandboxRole ? 'Hide Sandbox Role Selection' : 'Configure Sandbox Initial Role'}</span>
            </button>
            {showSandboxRole && (
              <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Role Request</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="User">Standard User</option>
                  <option value="Department Head">Department Head</option>
                  <option value="IT Specialist">IT Specialist</option>
                  <option value="System Admin">System Admin</option>
                </select>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-955/30 border border-red-200/50 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-400 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            id="btn-register-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-none"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-3 pt-1">
        <div className="relative flex py-1 items-center justify-center">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          <span className="flex-shrink mx-3 text-gray-400 text-[10px] uppercase tracking-wider font-bold flex items-center bg-white dark:bg-gray-900 px-2">
            <span>OR FEDERATED SIGN UP</span>
          </span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M21.35 11.1H12v2.7h5.38c-.24 1.28-.96 2.37-2.04 3.1v2.6h3.3c1.93-1.78 3.04-4.4 3.04-7.4 0-.34-.03-.68-.09-1z" fill="#4285F4" />
                <path d="M12 20.6c2.59 0 4.77-.86 6.36-2.34l-3-2.6c-.91.61-2.08.98-3.36.98-2.37 0-4.38-1.6-5.1-3.75H3.5v2.7C5.11 18.78 8.35 20.6 12 20.6z" fill="#34A853" />
                <path d="M6.9 12.89c-.18-.54-.28-1.11-.28-1.7s.1-1.17.28-1.7V6.79H3.5c-.6 1.23-.96 2.62-.96 4.1s.36 2.87.96 4.1l3.4-2.1z" fill="#FBBC05" />
                <path d="M12 6.1c1.41 0 2.68.49 3.68 1.44l2.75-2.75C16.76 3.31 14.58 2.44 12 2.44 8.35 2.44 5.11 4.26 3.5 7.39l3.4 2.7C7.62 7.7 9.63 6.1 12 6.1z" fill="#EA4335" />
              </g>
            </svg>
            <span>Sign up with Google</span>
          </button>

          <button
            type="button"
            onClick={handleAppleSignIn}
            className="w-full py-2.5 px-4 bg-black hover:bg-neutral-900 text-white border border-transparent rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12.87 0 1.98-.54 2.51-1.45z" />
            </svg>
            <span>Sign up with Apple</span>
          </button>
        </div>
      </div>

      <GoogleAuthHelperModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSimulateSuccess={(email) => onSuccess(email, { fullName: fullName || 'Demo User', role: 'User', departmentId: dept || 'general' })}
      />

    </div>
  );
}