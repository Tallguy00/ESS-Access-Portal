import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { 
  UserProfile, 
  AccessRequest, 
  AuditLog, 
  AppNotification, 
  Department, 
  SystemApplication, 
  UserRole,
  RequestStatus,
  SupportTicket
} from './types';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_SYSTEMS, 
  INITIAL_REQUESTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS 
} from './initialData';
import { getDepartmentFromEmail } from './utils/deptMapper';

// Deterministic 6-digit ESS employee ID generator and validator
export const generateDeterministicESSID = (email: string, id: string): string => {
  const str = `${email.toLowerCase().trim()}-${id}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);
  const digits = (positiveHash % 900000) + 100000; // guarantees exactly 6 digits (100000-999999)
  return `ESS-2026-${digits}`;
};

export const isValidESSID = (id?: string): boolean => {
  if (!id) return false;
  return /^ESS-2026-\d{6}$/i.test(id);
};

// Pages & Components import
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import { LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, AuthLayout } from './components/AuthScreens';
import UserDashboard from './components/UserDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import ReportingModule from './components/ReportingModule';
import AuditLogView from './components/AuditLogView';
import CreateRequestModal from './components/CreateRequestModal';
import RequestDetailsModal from './components/RequestDetailsModal';
import UserProfileModal from './components/UserProfileModal';
import FAQView from './components/FAQView';
import ProfileView from './components/ProfileView';
import SupportView from './components/SupportView';
import PublicRequestForm from './components/PublicRequestForm';
import PublicTrackRequest from './components/PublicTrackRequest';

import { ShieldCheck, Users, User, LayoutDashboard, FileBarChart, History, Settings, Sun, Moon, CheckCircle2, AlertCircle, HelpCircle, LifeBuoy } from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ar_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Current Auth states
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [sessionUserEmail, setSessionUserEmail] = useState<string | null>(() => {
    try {
      const cached = sessionStorage.getItem('ar_cached_user_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.email || localStorage.getItem('ar_session_user_email');
      }
    } catch (e) {}
    return localStorage.getItem('ar_session_user_email');
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const cached = sessionStorage.getItem('ar_cached_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard' | 'public-request' | 'public-track'>(() => {
    try {
      const cached = sessionStorage.getItem('ar_cached_user_profile');
      if (cached) return 'dashboard';
    } catch (e) {}
    return localStorage.getItem('ar_session_user_email') ? 'dashboard' : 'landing';
  });
  const [publicTrackId, setPublicTrackId] = useState('');

  // Main entity states synced with local Storage
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('ar_profiles');
    const defaultProfiles: UserProfile[] = [
      { id: 'user-ops-admin', fullName: 'IT Director Admin', email: 'admin@ess.gov.et', role: 'IT Admin', departmentId: 'dep-ict', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-101100', phoneNumber: '+251 911 019 101', jobTitle: 'Director of Identity & Access Operations', lastLogin: '2026-06-30T09:00:00Z' },
      { id: 'user-super-admin', fullName: 'Chief Information Officer', email: 'super@ess.gov.et', role: 'Super Admin', departmentId: 'dep-ict', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-100100', phoneNumber: '+251 911 019 100', jobTitle: 'Chief Information Officer (CIO)', lastLogin: '2026-06-30T08:50:00Z' },
      { id: 'user-mgr-dir', fullName: 'Director General Office Manager', email: 'manager.dir@ess.gov.et', role: 'Manager', departmentId: 'dep-dir', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-110000', phoneNumber: '+251 911 019 110', jobTitle: 'Office Director', lastLogin: '2026-06-30T08:10:00Z' },
      { id: 'user-mgr-deputy', fullName: 'Deputy Director Office Manager', email: 'manager.deputy@ess.gov.et', role: 'Manager', departmentId: 'dep-deputy', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-120000', phoneNumber: '+251 911 019 120', jobTitle: 'Deputy Office Manager', lastLogin: '2026-06-30T08:15:00Z' },
      { id: 'user-mgr-business', fullName: 'Business Statistics Manager', email: 'manager.business@ess.gov.et', role: 'Manager', departmentId: 'dep-business', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-500100', phoneNumber: '+251 911 019 500', jobTitle: 'Director of Business Statistics', lastLogin: '2026-06-30T08:20:00Z' },
      { id: 'user-mgr-household', fullName: 'Household Statistics Manager', email: 'manager.household@ess.gov.et', role: 'Manager', departmentId: 'dep-household', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-600100', phoneNumber: '+251 911 019 600', jobTitle: 'Director of Census & Household Surveys', lastLogin: '2026-06-30T08:00:00Z' },
      { id: 'user-mgr-ict', fullName: 'ICT Coordinator', email: 'manager.ict@ess.gov.et', role: 'Manager', departmentId: 'dep-ict', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-300100', phoneNumber: '+251 911 019 300', jobTitle: 'Chief Systems Administrator', lastLogin: '2026-06-30T08:45:00Z' },
      { id: 'user-mgr-hr', fullName: 'HR Manager', email: 'manager.hr@ess.gov.et', role: 'Manager', departmentId: 'dep-hr', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-400100', phoneNumber: '+251 911 019 400', jobTitle: 'Human Resources Director', lastLogin: '2026-06-30T08:15:00Z' },
      { id: 'user-mgr-finance', fullName: 'Finance Manager', email: 'manager.finance@ess.gov.et', role: 'Manager', departmentId: 'dep-finance', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-200100', phoneNumber: '+251 911 019 200', jobTitle: 'Director of Finance', lastLogin: '2026-06-30T08:30:00Z' },
      { id: 'user-mgr-other', fullName: 'Branch Operations Manager', email: 'manager.other@ess.gov.et', role: 'Manager', departmentId: 'dep-other', status: 'Active', createdAt: '2026-06-01T00:00:00Z', mfaEnabled: true, employeeId: 'ESS-2026-700100', phoneNumber: '+251 911 019 700', jobTitle: 'Regional Branch Coordinator', lastLogin: '2026-06-30T08:05:00Z' }
    ];
    let loaded: UserProfile[] = saved ? JSON.parse(saved) : defaultProfiles;
    let changed = false;
    loaded = loaded.map(p => {
      if (!p.employeeId || !isValidESSID(p.employeeId)) {
        changed = true;
        return {
          ...p,
          employeeId: generateDeterministicESSID(p.email, p.id)
        };
      }
      return p;
    });
    if (changed) {
      localStorage.setItem('ar_profiles', JSON.stringify(loaded));
    }
    return loaded;
  });

  const [requests, setRequests] = useState<AccessRequest[]>(() => {
    const saved = localStorage.getItem('ar_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('ar_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ar_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Base datasets
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [systems] = useState<SystemApplication[]>(INITIAL_SYSTEMS);

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('ar_support_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse ar_support_tickets:", e);
      }
    }
    // Seed initial tickets
    return [];
  });

  // Sync tickets to local storage on changes
  useEffect(() => {
    localStorage.setItem('ar_support_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Layout Tab select
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'audit_logs' | 'reports' | 'faq' | 'profile' | 'support'>('dashboard');

  // Modals view controllers
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem('ar_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('ar_requests', JSON.stringify(requests));

    // Synchronize to ess_public_requests for public tracker on the same browser
    try {
      const publicReqsStr = localStorage.getItem('ess_public_requests');
      if (publicReqsStr) {
        const publicReqs = JSON.parse(publicReqsStr);
        let updated = false;
        const updatedPublicReqs = publicReqs.map((pr: any) => {
          const matchedLive = requests.find((r: any) => r.id === pr.id);
          if (matchedLive && (
            matchedLive.status !== pr.status || 
            JSON.stringify(matchedLive.provisionedCredentials) !== JSON.stringify(pr.provisionedCredentials) || 
            (matchedLive.commentsHistory && pr.commentsHistory && matchedLive.commentsHistory.length !== pr.commentsHistory.length)
          )) {
            updated = true;
            return {
              ...pr,
              status: matchedLive.status,
              comments: matchedLive.comments,
              commentsHistory: matchedLive.commentsHistory,
              provisionedCredentials: matchedLive.provisionedCredentials,
              updatedAt: matchedLive.updatedAt || new Date().toISOString()
            };
          }
          return pr;
        });
        if (updated) {
          localStorage.setItem('ess_public_requests', JSON.stringify(updatedPublicReqs));
        }
      }
    } catch (localErr) {
      console.warn("Failed to sync updated requests to ess_public_requests in local storage:", localErr);
    }
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('ar_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('ar_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ar_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard shortcut Alt + D to trigger click on '#btn-nav-dashboard'
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Alt + D or Alt + Shift + D
      if (event.altKey && (event.key === 'd' || event.key === 'D' || event.code === 'KeyD')) {
        event.preventDefault();
        const dashboardBtn = document.getElementById('btn-nav-dashboard');
        if (dashboardBtn) {
          dashboardBtn.click();
          showToast('Alt + D shortcut: Navigated to Executive Dashboard', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Automated pending SLA reminders (>48h)
  useEffect(() => {
    const safeRequests = Array.isArray(requests) ? requests.filter(Boolean) : [];
    const pendingReqs = safeRequests.filter(req => req.status === 'Submitted' || req.status === 'Under Review');
    if (pendingReqs.length === 0) return;

    const now = new Date();
    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const safeProfiles = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
    const managers = safeProfiles.filter(p => p.role === 'Manager');
    if (managers.length === 0) return;

    setNotifications(prevNotifications => {
      const newNotices: AppNotification[] = [];
      let updatedState = false;

      pendingReqs.forEach(req => {
        const createdDate = new Date(req.createdAt);
        const diffMs = now.getTime() - createdDate.getTime();
        const isOverdue = diffMs > fortyEightHoursInMs;

        if (isOverdue) {
          const reminderTag = `Pending Request Reminder [${req.id}]`;

          managers.forEach(mgr => {
            // Check if manager was already notified for this exact overdue request
            const alreadyHasNotice = prevNotifications.some(n => 
              n.userEmail === mgr.email && 
              n.message.includes(reminderTag)
            );

            if (!alreadyHasNotice) {
              newNotices.push({
                id: 'notice-reminder-' + Math.random().toString(36).substring(2, 9),
                userEmail: mgr.email,
                message: `⚠️ Pending Request Reminder [${req.id}]: Active access request "${req.title}" by ${req.userFullName} has been inactive for > 48 hours. Please review.`,
                isRead: false,
                createdAt: new Date().toISOString(),
                type: 'security'
              });
              updatedState = true;
            }
          });
        }
      });

      if (updatedState && newNotices.length > 0) {
        return [...newNotices, ...prevNotifications];
      }
      return prevNotifications;
    });
  }, [requests, profiles]);

  // Shared process user session function to handle active Supabase user session
  const processUserSession = useCallback(async (session: any) => {
    const loginKey = session?.user?.email;
    if (!loginKey) {
      sessionStorage.removeItem('ar_cached_user_profile');
      localStorage.removeItem('ar_session_user_email');
      setSessionUserEmail(null);
      setCurrentUser(null);
      setCurrentPage(prev => (
        prev === 'public-request' || 
        prev === 'public-track' || 
        prev === 'login' || 
        prev === 'register' || 
        prev === 'forgot' || 
        prev === 'reset' 
          ? prev 
          : 'landing'
      ));
      return null;
    }

    const trimKey = loginKey.toLowerCase().trim();

    // 1. Check session storage cache
    let foundProfile: UserProfile | null = null;
    const cachedProfileStr = sessionStorage.getItem('ar_cached_user_profile');
    if (cachedProfileStr) {
      try {
        const parsed = JSON.parse(cachedProfileStr);
        if (parsed && parsed.email?.toLowerCase().trim() === trimKey) {
          foundProfile = parsed;
        }
      } catch (e) {
        console.warn("Could not parse cached user profile:", e);
      }
    }

    // 2. Fetch from Supabase DB if not cached
    if (!foundProfile) {
      console.log("Fetching profile from DB for session recovery:", trimKey);
      const { data: dbProfile, error: dbError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department_id, status, created_at, mfa_enabled, phone_number, job_title, employee_id, avatar_url, last_login, notification_preferences')
        .eq('email', trimKey)
        .maybeSingle();

      if (dbError) {
        console.error("Error fetching single user profile:", dbError);
      }

      if (dbProfile) {
        const customProfile = (dbProfile.notification_preferences as any)?.custom_profile || {};
        let empId = dbProfile.employee_id !== undefined && dbProfile.employee_id !== null ? dbProfile.employee_id : customProfile.employeeId;
        
        if (!empId || !isValidESSID(empId)) {
          empId = generateDeterministicESSID(dbProfile.email || '', dbProfile.id);
          supabase
            .from('profiles')
            .update({ employee_id: empId })
            .eq('id', dbProfile.id)
            .then(({ error }) => {
              if (error) console.warn("Failed to auto-migrate employee_id in database:", error.message);
            });
        }

        const emailLower = trimKey.toLowerCase();
        const isManagerEmail = emailLower.startsWith('manager.');
        const mappedRole = isManagerEmail ? 'Manager' : (dbProfile.role as any);
        const mappedDept = getDepartmentFromEmail(emailLower);

        foundProfile = {
          id: dbProfile.id,
          fullName: dbProfile.full_name,
          email: dbProfile.email,
          role: mappedRole,
          departmentId: mappedDept,
          status: dbProfile.status as any,
          createdAt: dbProfile.created_at,
          mfaEnabled: dbProfile.mfa_enabled,
          notificationPreferences: dbProfile.notification_preferences,
          phoneNumber: dbProfile.phone_number !== undefined && dbProfile.phone_number !== null ? dbProfile.phone_number : customProfile.phoneNumber,
          jobTitle: dbProfile.job_title !== undefined && dbProfile.job_title !== null ? dbProfile.job_title : customProfile.jobTitle,
          employeeId: empId,
          avatarUrl: dbProfile.avatar_url !== undefined && dbProfile.avatar_url !== null ? dbProfile.avatar_url : customProfile.avatarUrl,
          lastLogin: dbProfile.last_login !== undefined && dbProfile.last_login !== null ? dbProfile.last_login : customProfile.lastLogin
        };
      }
    }

    // 3. Fallback on-the-fly profile if user profile not found in database (e.g. new OAuth signup)
    if (!foundProfile) {
      const emailLower = trimKey.toLowerCase();
      const isManagerEmail = emailLower.startsWith('manager.');
      const resolvedRole = isManagerEmail ? 'Manager' : 'User';
      const resolvedDept = getDepartmentFromEmail(emailLower);
      const onTheFlyId = 'user-' + Math.random().toString(36).substr(2, 9);
      foundProfile = {
        id: onTheFlyId,
        fullName: trimKey.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        email: trimKey,
        role: resolvedRole,
        departmentId: resolvedDept,
        status: 'Active',
        createdAt: new Date().toISOString(),
        employeeId: generateDeterministicESSID(trimKey, onTheFlyId)
      };
    }

    // Handle deactivated accounts
    if (foundProfile.status === 'Deactivated') {
      alert('This corporate account has been deactivated by IT administration.');
      sessionStorage.removeItem('ar_cached_user_profile');
      localStorage.removeItem('ar_session_user_email');
      setSessionUserEmail(null);
      setCurrentUser(null);
      await supabase.auth.signOut();
      setCurrentPage('landing');
      return null;
    }

    // Ensure manager email role coercion
    const emailLower = trimKey.toLowerCase();
    const isManagerEmail = emailLower.startsWith('manager.');
    if (isManagerEmail && (foundProfile.role !== 'Manager' || !foundProfile.departmentId.startsWith('dep-'))) {
      const resolvedDept = getDepartmentFromEmail(emailLower);
      foundProfile = {
        ...foundProfile,
        role: 'Manager',
        departmentId: resolvedDept
      };
    }

    // Update session & storage
    sessionStorage.setItem('ar_cached_user_profile', JSON.stringify(foundProfile));
    localStorage.setItem('ar_session_user_email', trimKey);
    setSessionUserEmail(trimKey);
    setCurrentUser(foundProfile);
    setProfiles(prev => {
      const filtered = prev.filter(p => p.email.toLowerCase().trim() !== trimKey);
      return [foundProfile!, ...filtered];
    });
    setCurrentPage('dashboard');
    return foundProfile;
  }, []);

  // Initial session recovery via Supabase Auth & Live Listener
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Handle OAuth PKCE code parameter (?code=...)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
          console.log("OAuth PKCE code detected in URL. Exchanging code for session...");
          try {
            await supabase.auth.exchangeCodeForSession(code);
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (codeErr) {
            console.warn("Error exchanging OAuth code for session:", codeErr);
          }
        }

        // 2. Handle OAuth implicit grant hash fragment (#access_token=...)
        const hash = window.location.hash;
        if (hash && (hash.includes("access_token=") || hash.includes("refresh_token="))) {
          const params = new URLSearchParams(hash.replace(/^#/, ''));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken) {
            console.log("OAuth hash tokens detected. Setting session...");
            try {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || undefined
              });
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (hashErr) {
              console.warn("Error setting session from hash tokens:", hashErr);
            }
          }
        }

        // 3. Get current session after URL token/code processing
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          await processUserSession(session);
        }
      } catch (err) {
        console.warn("Could not pre-recover active Supabase session:", err);
      } finally {
        if (isMounted) {
          setIsAuthInitializing(false);
        }
      }
    };

    initializeAuth();

    // 4. Register auth state change listener for subsequent auth changes
    let subscription: any = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Supabase onAuthStateChange event:", event);
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await processUserSession(session);
          setIsAuthInitializing(false);
        } else if (event === 'SIGNED_OUT') {
          await processUserSession(null);
          setIsAuthInitializing(false);
        }
      });
      subscription = data?.subscription;
    } catch (err) {
      console.warn("Could not register Supabase auth listener:", err);
    }

    return () => {
      isMounted = false;
      try {
        subscription?.unsubscribe();
      } catch (err) {
        console.warn("Could not unsubscribe from Supabase auth channel:", err);
      }
    };
  }, [processUserSession]);

  // Load real profiles from Supabase DB on user sign-in/mount
  useEffect(() => {
    const fetchProfilesFromDB = async () => {
      if (!sessionUserEmail) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (error) {
          if (error.message === "Session expired") {
            console.log("Session expired. Gracefully stopping fetchProfilesFromDB.");
            return;
          }
          console.error("Error fetching profiles from Supabase DB:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // Map snake_case columns back to camelCase models
          const mappedProfiles: UserProfile[] = data.map(item => {
            const emailLower = (item.email || '').toLowerCase().trim();
            const isManagerEmail = emailLower.startsWith('manager.');
            const mappedRole = isManagerEmail ? 'Manager' : (item.role as any);
            const mappedDept = getDepartmentFromEmail(emailLower);

            // Fallback for custom profile fields stored inside notification_preferences JSONB
            const customProfile = (item.notification_preferences as any)?.custom_profile || {};

            let empId = item.employee_id !== undefined && item.employee_id !== null ? item.employee_id : customProfile.employeeId;
            if (!empId || !isValidESSID(empId)) {
              empId = generateDeterministicESSID(item.email || '', item.id);
              // Asynchronously update DB
              supabase
                .from('profiles')
                .update({ employee_id: empId })
                .eq('id', item.id)
                .then(({ error }) => {
                  if (error) console.warn("Failed to auto-migrate employee_id in database:", error.message);
                });
            }

            return {
              id: item.id,
              fullName: item.full_name,
              email: item.email,
              role: mappedRole,
              departmentId: mappedDept,
              status: item.status as any,
              createdAt: item.created_at,
              mfaEnabled: item.mfa_enabled,
              notificationPreferences: item.notification_preferences,
              phoneNumber: item.phone_number !== undefined && item.phone_number !== null ? item.phone_number : customProfile.phoneNumber,
              jobTitle: item.job_title !== undefined && item.job_title !== null ? item.job_title : customProfile.jobTitle,
              employeeId: empId,
              avatarUrl: item.avatar_url !== undefined && item.avatar_url !== null ? item.avatar_url : customProfile.avatarUrl,
              lastLogin: item.last_login !== undefined && item.last_login !== null ? item.last_login : customProfile.lastLogin
            };
          });
          
          setProfiles(prev => {
            // Keep existing local profiles if they are not in database (e.g. seeds),
            // but prioritize database profiles by email matching.
            const merged = [...mappedProfiles];
            prev.forEach(localP => {
              const exists = merged.some(dbP => dbP.email.toLowerCase().trim() === localP.email.toLowerCase().trim());
              if (!exists) {
                merged.push(localP);
              }
            });
            return merged;
          });
        }
      } catch (err: any) {
        if (err?.message === "Session expired") return;
        console.error("Failed to load profiles from DB:", err);
      }
    };
    
    fetchProfilesFromDB();
  }, [sessionUserEmail]);

  // Load real access requests from Supabase DB on user sign-in/mount
  const fetchRequestsFromDB = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.message === "Session expired") {
          console.log("Session expired. Gracefully stopping fetchRequestsFromDB.");
          return;
        }
        console.error("Error fetching requests from Supabase DB:", error);
        return;
      }
      
      if (data) {
        // Map snake_case columns back to camelCase models
        const mappedRequests: AccessRequest[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          userEmail: item.user_email,
          userFullName: item.user_full_name,
          departmentId: item.department_id || '',
          title: item.title,
          accessType: item.access_type as any,
          systemName: item.system_name,
          justification: item.justification,
          priority: item.priority as any,
          startDate: item.start_date,
          endDate: item.end_date || undefined,
          status: item.status as any,
          createdAt: item.created_at,
          attachments: item.attachments || [],
          comments: item.comments || undefined,
          commentsHistory: item.comments_history || [],
          provisionedCredentials: item.provisioned_credentials || undefined,
          requestedRole: item.requested_role || undefined,
          manager: item.manager || undefined,
          currentApprover: item.current_approver || undefined,
          updatedAt: item.updated_at || undefined,
          employeeId: item.employee_id || undefined,
          departmentManagerId: item.department_manager_id || undefined
        }));
        
        setRequests(mappedRequests);
      }
    } catch (err: any) {
      if (err?.message === "Session expired") return;
      console.error("Failed to load requests from DB:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRequestsFromDB();

    if (!currentUser) return;

    // Real-time Supabase subscription to automatically refresh the user's requests list
    const channel = supabase
      .channel('realtime:access_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'access_requests' },
        (payload) => {
          console.log('Real-time database update detected:', payload);
          fetchRequestsFromDB();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequestsFromDB, currentUser]);

  // Load real audit logs from Supabase DB on user sign-in/mount
  useEffect(() => {
    const fetchAuditLogsFromDB = async () => {
      if (!currentUser) return;
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          if (error.message === "Session expired") {
            console.log("Session expired. Gracefully stopping fetchAuditLogsFromDB.");
            return;
          }
          console.error("Error fetching audit logs from Supabase DB:", error);
          return;
        }
        
        if (data && data.length > 0) {
          const mappedLogs: AuditLog[] = data.map(item => ({
            id: item.id,
            userEmail: item.user_email,
            userRole: item.user_role as any,
            action: item.action,
            details: item.details,
            createdAt: item.created_at,
            ipAddress: item.ip_address || undefined,
            device: item.device || undefined
          }));
          
          setAuditLogs(mappedLogs);
        }
      } catch (err: any) {
        if (err?.message === "Session expired") return;
        console.error("Failed to load audit logs from DB:", err);
      }
    };
    
    fetchAuditLogsFromDB();
  }, [currentUser]);

  // Load real notifications from Supabase DB on user sign-in/mount
  useEffect(() => {
    const fetchNotificationsFromDB = async () => {
      if (!currentUser) return;
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          if (error.message === "Session expired") {
            console.log("Session expired. Gracefully stopping fetchNotificationsFromDB.");
            return;
          }
          console.error("Error fetching notifications from Supabase DB:", error);
          return;
        }
        
        if (data && data.length > 0) {
          const mappedNotifications: AppNotification[] = data.map(item => ({
            id: item.id,
            userEmail: item.user_email,
            message: item.message,
            isRead: item.is_read,
            createdAt: item.created_at,
            type: item.type as any
          }));
          
          setNotifications(mappedNotifications);
        }
      } catch (err: any) {
        if (err?.message === "Session expired") return;
        console.error("Failed to load notifications from DB:", err);
      }
    };
    
    fetchNotificationsFromDB();
  }, [currentUser]);

  // Load real support tickets from Supabase DB on user sign-in/mount
  const fetchTicketsFromDB = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Could not fetch support tickets from database (it might not be provisioned yet):", error.message);
        return;
      }

      if (data) {
        const mappedTickets: SupportTicket[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          userName: item.user_name,
          userEmail: item.user_email,
          userDepartmentId: item.user_department_id || '',
          userRole: item.user_role as any,
          subject: item.subject,
          category: item.category as any,
          priority: item.priority as any,
          status: item.status as any,
          description: item.description,
          attachmentName: item.attachment_name || undefined,
          attachmentSize: item.attachment_size || undefined,
          assignedToId: item.assigned_to_id || undefined,
          assignedToName: item.assigned_to_name || undefined,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          comments: item.comments || [],
          activityLogs: item.activity_logs || []
        }));

        setTickets(mappedTickets);
      }
    } catch (err) {
      console.warn("Failed to load tickets from Supabase DB:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTicketsFromDB();

    if (!currentUser) return;

    // Real-time Supabase subscription to automatically refresh the user's tickets list
    const channel = supabase
      .channel('realtime:support_tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        (payload) => {
          console.log('Real-time ticket update detected:', payload);
          fetchTicketsFromDB();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchTicketsFromDB, currentUser]);

  // Handle active session loading fallback
  useEffect(() => {
    if (sessionUserEmail && !currentUser) {
      const trimKey = sessionUserEmail.toLowerCase().trim();
      const safeProfiles = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
      const foundProfile = safeProfiles.find(p => 
        p.email.toLowerCase().trim() === trimKey
      );
      if (foundProfile) {
        // If account is deactivated, reject immediately
        if (foundProfile.status === 'Deactivated') {
          alert('This corporate account has been deactivated by IT administration.');
          handleLogout();
          return;
        }

        // Coerce manager email addresses to Manager role and correct department
        const emailLower = trimKey.toLowerCase();
        const isManagerEmail = emailLower.startsWith('manager.');
        if (isManagerEmail && (foundProfile.role !== 'Manager' || !foundProfile.departmentId.startsWith('dep-'))) {
          const resolvedDept = getDepartmentFromEmail(emailLower);
          const upgradedProfile: UserProfile = {
            ...foundProfile,
            role: 'Manager',
            departmentId: resolvedDept
          };
          setCurrentUser(upgradedProfile);
          setProfiles(prev => prev.map(p => p.email.toLowerCase().trim() === trimKey ? upgradedProfile : p));
        } else {
          setCurrentUser(foundProfile);
        }
      } else {
        // Create an on-the-fly roster entry for new Supabase signups
        const emailLower = trimKey.toLowerCase();
        const isManagerEmail = emailLower.startsWith('manager.');
        const resolvedRole = isManagerEmail ? 'Manager' : 'User';
        const resolvedDept = getDepartmentFromEmail(emailLower);

        const onTheFlyId = 'user-' + Math.random().toString(36).substr(2, 9);
        const newProfile: UserProfile = {
          id: onTheFlyId,
          fullName: trimKey.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          email: trimKey,
          role: resolvedRole,
          departmentId: resolvedDept,
          status: 'Active',
          createdAt: new Date().toISOString(),
          employeeId: generateDeterministicESSID(trimKey, onTheFlyId)
        };
        setProfiles(prev => [...prev, newProfile]);
        setCurrentUser(newProfile);
      }
    } else if (!sessionUserEmail) {
      setCurrentUser(null);
    }
  }, [sessionUserEmail, profiles, currentUser]);

  // Auth Operations
  const handleLoginSuccess = async (email: string) => {
    let authenticatedEmail = email;
    try {
      // Leverage supabase.auth session retrieval to match/confirm user email
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        authenticatedEmail = user.email;
      }
    } catch (err) {
      console.warn("Could not retrieve Supabase authenticated user session on login success:", err);
    }

    // Normalize old demo emails to new standard email addresses for seamless mapping
    if (authenticatedEmail) {
      const emailLower = authenticatedEmail.toLowerCase().trim();
      if (emailLower === 'manager@ess.gov.et' || emailLower === 'manager.bob@ess.gov.et' || emailLower === 'manager.fin@ess.gov.et' || emailLower === 'manager.finance@ess.gov.et') {
        authenticatedEmail = 'manager.finance@ess.gov.et';
      } else if (emailLower === 'manager.eng@ess.gov.et') {
        authenticatedEmail = 'manager.ict@ess.gov.et';
      } else if (emailLower === 'manager.hr@ess.gov.et') {
        authenticatedEmail = 'manager.hr@ess.gov.et';
      } else if (emailLower === 'manager.mkt@ess.gov.et') {
        authenticatedEmail = 'manager.business@ess.gov.et';
      } else if (emailLower === 'manager.ops@ess.gov.et') {
        authenticatedEmail = 'manager.deputy@ess.gov.et';
      } else if (emailLower === 'admin@ess.gov.et') {
        authenticatedEmail = 'admin@ess.gov.et';
      } else if (emailLower === 'super@ess.gov.et') {
        authenticatedEmail = 'super@ess.gov.et';
      }
    }

    localStorage.setItem('ar_session_user_email', authenticatedEmail);
    setSessionUserEmail(authenticatedEmail);
    setCurrentPage('dashboard');
    setActiveTab('dashboard');

    // Detect role for log context mapping and update lastLogin
    const safeProfiles = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
    const foundProfile = safeProfiles.find(p => p.email.toLowerCase() === authenticatedEmail.toLowerCase());
    const matchedRole = foundProfile?.role || 'User';

    if (foundProfile) {
      const loginTime = new Date().toISOString();
      const updatedWithLogin: UserProfile = {
        ...foundProfile,
        lastLogin: loginTime
      };
      
      setCurrentUser(updatedWithLogin);
      setProfiles(prev => prev.map(p => p.id === foundProfile.id ? updatedWithLogin : p));
      sessionStorage.setItem('ar_cached_user_profile', JSON.stringify(updatedWithLogin));
      
      try {
        await supabase
          .from('profiles')
          .update({ last_login: loginTime })
          .eq('id', foundProfile.id);
      } catch (err) {
        console.error("Failed to update last login in Supabase:", err);
      }
    } else {
      const emailLower = authenticatedEmail.toLowerCase().trim();
      const isManagerEmail = emailLower.startsWith('manager.');
      const resolvedRole = isManagerEmail ? 'Manager' : 'User';
      const resolvedDept = getDepartmentFromEmail(emailLower);
      const onTheFlyId = 'user-' + Math.random().toString(36).substr(2, 9);
      const newProfile: UserProfile = {
        id: onTheFlyId,
        fullName: authenticatedEmail.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        email: authenticatedEmail,
        role: resolvedRole,
        departmentId: resolvedDept,
        status: 'Active',
        createdAt: new Date().toISOString(),
        employeeId: generateDeterministicESSID(authenticatedEmail, onTheFlyId)
      };
      
      setCurrentUser(newProfile);
      setProfiles(prev => [...prev, newProfile]);
      sessionStorage.setItem('ar_cached_user_profile', JSON.stringify(newProfile));
    }

    // Create Audit entry for login
    logAuditEvent(
      authenticatedEmail,
      matchedRole,
      'User login success',
      `Centralized directory authenticated account session securely using Supabase Auth.`
    );
  };

  const handleRegisterSuccess = async (
    email: string, 
    details: { 
      fullName: string; 
      role: UserRole; 
      departmentId: string; 
      phoneNumber?: string;
      jobTitle?: string;
    }
  ) => {
    let authenticatedEmail = email;
    let userId = 'user-' + Math.random().toString(36).substr(2, 9);
    
    try {
      // Leverage supabase.auth status to confirm the registered user account
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        authenticatedEmail = user.email;
      }
      if (user?.id) {
        userId = user.id;
      }
    } catch (err) {
      console.warn("Could not retrieve Supabase authenticated user session on registration success:", err);
    }

    const assignedEmployeeId = generateDeterministicESSID(authenticatedEmail, userId);

    const newProfile: UserProfile = {
      id: userId,
      fullName: details.fullName,
      email: authenticatedEmail,
      role: details.role,
      departmentId: details.departmentId,
      status: 'Active',
      createdAt: new Date().toISOString(),
      employeeId: assignedEmployeeId,
      phoneNumber: details.phoneNumber || '',
      jobTitle: details.jobTitle || ''
    };

    setProfiles(prev => {
      const index = prev.findIndex(p => p.email.toLowerCase() === authenticatedEmail.toLowerCase());
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          id: userId,
          fullName: details.fullName,
          role: details.role,
          departmentId: details.departmentId,
          status: 'Active',
          employeeId: assignedEmployeeId,
          phoneNumber: details.phoneNumber || updated[index].phoneNumber || '',
          jobTitle: details.jobTitle || updated[index].jobTitle || ''
        };
        return updated;
      }
      return [...prev, newProfile];
    });

    // Explicitly write profile to Supabase database so all platforms see it immediately
    if (userId && !userId.startsWith('user-')) {
      try {
        const defaultPrefs = {
          onSubmitted: true,
          onUnderReview: true,
          onApproved: true,
          onRejected: true,
          onCompleted: true,
          customFields: {
            phoneNumber: details.phoneNumber || '',
            jobTitle: details.jobTitle || '',
            employeeId: assignedEmployeeId
          }
        };

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: details.fullName,
            email: authenticatedEmail,
            role: details.role,
            department_id: details.departmentId,
            status: 'Active',
            employee_id: assignedEmployeeId,
            phone_number: details.phoneNumber || '',
            job_title: details.jobTitle || '',
            notification_preferences: defaultPrefs
          });
        if (error) {
          console.warn("Standard profile upsert failed (might have missing custom columns). Retrying using JSONB fallback strategy:", error.message);
          
          const { error: retryError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              full_name: details.fullName,
              email: authenticatedEmail,
              role: details.role,
              department_id: details.departmentId,
              status: 'Active',
              notification_preferences: defaultPrefs
            });
          if (retryError) {
            console.error("Error saving registered profile via JSONB fallback strategy:", retryError);
          } else {
            console.log("Successfully registered profile with JSONB fallback.");
          }
        } else {
          console.log("Successfully registered profile with standard schema.");
        }
      } catch (err) {
        console.error("Failed to upsert profile in database:", err);
      }
    }
    
    localStorage.setItem('ar_session_user_email', authenticatedEmail);
    setSessionUserEmail(authenticatedEmail);
    setCurrentPage('dashboard');
    setActiveTab('dashboard');

    // Create Audit entry for manual registration
    logAuditEvent(
      authenticatedEmail,
      details.role,
      'Profile Registration',
      `Centralized directory roster created for ${details.fullName} in department ${details.departmentId}.`
    );

    // Create startup welcome notification
    addNotification(
      authenticatedEmail,
      `Welcome to company IAM portal! Complete your first privilege request by selecting submit above.`,
      'info_requested'
    );
  };

  const handleLogout = async () => {
    if (sessionUserEmail) {
      logAuditEvent(
        sessionUserEmail,
        currentUser?.role || 'User',
        'User logout success',
        `Closed active browser directory session.`
      );
    }
    
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to sign out from Supabase Auth service:", err);
    }
    localStorage.removeItem('ar_session_user_email');
    sessionStorage.removeItem('ar_cached_user_profile');
    setSessionUserEmail(null);
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  // Switch sandbox role on the fly
  const handleSwitchSandboxRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    setGlobalSearchTerm('');
    
    // Determine the corresponding database role based on React UserRole check constraints
    const mapRoleForDatabase = (role: UserRole): string => {
      switch (role) {
        case 'Department Manager':
          return 'Manager';
        case 'IT Support':
          return 'IT Admin';
        default:
          return role;
      }
    };

    // Align department to 'dep-finance' (Finance) if simulating a Manager, so they can see standard Manager queues,
    // otherwise keep original department.
    const newDeptId = (newRole === 'Manager' || newRole === 'Department Manager') 
      ? 'dep-finance' 
      : currentUser.departmentId || 'dep-ict';

    const updated = { ...currentUser, role: newRole, departmentId: newDeptId };
    setCurrentUser(updated);
    setProfiles(prev => prev.map(p => p.id === currentUser.id ? updated : p));
    sessionStorage.setItem('ar_cached_user_profile', JSON.stringify(updated));

    // Persist this sandbox role & department alignment to the database profile so RLS policies take effect!
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentUser.id);
    if (isUUID) {
      try {
        const dbRole = mapRoleForDatabase(newRole);
        const { error } = await supabase
          .from('profiles')
          .update({ 
            role: dbRole,
            department_id: newDeptId
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error("Error updating profile role/department in database:", error);
        } else {
          console.log(`Database profile role aligned to: ${dbRole}, department aligned to: ${newDeptId}`);
          // Instantly refresh requests to apply updated RLS policies
          fetchRequestsFromDB();
        }
      } catch (err) {
        console.error("Failed to update database profile:", err);
      }
    }

    logAuditEvent(
      currentUser.email,
      newRole,
      'Sandbox Persona Swap',
      `Developer swapped sandbox session level to "${newRole}".`
    );

    addNotification(
      currentUser.email,
      `Your development session environment has been successfully mapped to: ${newRole}.`,
      'info_requested'
    );
  };

  // Helper constructors
  const logAuditEvent = async (email: string, role: UserRole, action: string, details: string) => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      if (/android/i.test(ua)) {
        return 'Android Mobile, Chrome';
      }
      if (/iPad|iPhone|iPod/.test(ua)) {
        return 'iOS Mobile, Safari';
      }
      if (/Windows/i.test(ua)) {
        return 'PC (Windows), Chrome/Edge';
      }
      if (/Macintosh/i.test(ua)) {
        return 'Macintosh (MacOS), Safari/Chrome';
      }
      if (/Linux/i.test(ua)) {
        return 'PC (Linux), Chrome';
      }
      return 'Web Browser, Portal Gateway';
    };

    const deviceName = detectDevice();
    const newLog: AuditLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userEmail: email,
      userRole: role,
      action,
      details,
      createdAt: new Date().toISOString(),
      ipAddress: '159.20.104.' + Math.floor(Math.random() * 254),
      device: deviceName
    };
    
    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await supabase.from('audit_logs').insert({
        id: newLog.id,
        user_email: newLog.userEmail,
        user_role: newLog.userRole,
        action: newLog.action,
        details: newLog.details,
        created_at: newLog.createdAt,
        ip_address: newLog.ipAddress,
        device: newLog.device
      });
    } catch (err) {
      console.error("Failed to sync audit log to Supabase:", err);
    }
  };

  const addNotification = async (email: string, message: string, type: AppNotification['type']) => {
    const newNotice: AppNotification = {
      id: 'notice-' + Math.random().toString(36).substr(2, 9),
      userEmail: email,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      type
    };
    
    setNotifications(prev => [newNotice, ...prev]);

    try {
      await supabase.from('notifications').insert({
        id: newNotice.id,
        user_email: newNotice.userEmail,
        message: newNotice.message,
        is_read: newNotice.isRead,
        created_at: newNotice.createdAt,
        type: newNotice.type
      });
    } catch (err) {
      console.error("Failed to sync notification to Supabase:", err);
    }
  };

  // Request handlers
  const handleCreateRequestSubmit = async (newReq: Omit<AccessRequest, 'id' | 'userId' | 'userEmail' | 'userFullName' | 'createdAt' | 'status'> & { id?: string }) => {
    if (!currentUser) return;

    const createdAt = new Date().toISOString();
    const reqId = newReq.id || ('req-' + (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)));
    
    // Map accessType from UI ('New', 'Modify', 'Remove') to DB and Reporting compliant values
    const mappedAccessType = 
      newReq.accessType === 'New' ? 'Application Access' :
      newReq.accessType === 'Modify' ? 'Database Access' :
      newReq.accessType === 'Remove' ? 'Server Access' :
      newReq.accessType;

    const deptManager = profiles.find(p => (p.role === 'Manager' || p.role === 'Department Manager') && p.departmentId === newReq.departmentId);
    const deptManagerId = deptManager ? deptManager.id : null;
    const deptManagerName = deptManager ? deptManager.fullName : (newReq.manager || '');

    const requestObj: AccessRequest = {
      ...newReq,
      id: reqId,
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userEmail: currentUser.email,
      status: 'Pending Department Approval',
      accessType: mappedAccessType as any,
      createdAt,
      updatedAt: createdAt,
      employeeId: currentUser.employeeId,
      departmentManagerId: deptManagerId || undefined,
      manager: deptManagerName,
      currentApprover: deptManagerName,
      commentsHistory: [
        {
          id: 'comment-initial-' + Math.random().toString(36).substring(2, 9),
          authorName: currentUser.fullName,
          authorRole: currentUser.role,
          action: 'Submit',
          text: newReq.justification || 'No justification provided.',
          timestamp: createdAt
        }
      ]
    };

    // Persist request directly to the Supabase Database table
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated session found. Please sign in again.");
      }

      // Ensure user can only create requests associated with their authenticated account
      if (user.id !== currentUser.id) {
        throw new Error("Unauthorized request submission. Authenticated user ID mismatch.");
      }

      const { error } = await supabase.from('access_requests').insert({
        id: reqId,
        user_id: user.id,
        user_email: currentUser.email,
        user_full_name: currentUser.fullName,
        department_id: newReq.departmentId,
        title: newReq.title,
        access_type: mappedAccessType,
        system_name: newReq.systemName,
        justification: newReq.justification,
        priority: newReq.priority,
        start_date: newReq.startDate,
        end_date: newReq.endDate || null,
        status: 'Pending Department Approval',
        created_at: createdAt,
        updated_at: createdAt,
        requested_role: newReq.requestedRole || null,
        manager: deptManagerName || null,
        current_approver: deptManagerName || null,
        attachments: newReq.attachments || [],
        comments: newReq.comments || null,
        comments_history: requestObj.commentsHistory,
        provisioned_credentials: null,
        employee_id: currentUser.employeeId || null,
        department_manager_id: deptManagerId || null
      });

      if (error) {
        console.error("Error inserting request into Supabase DB:", error);
        throw new Error(error.message || "Failed to insert request into Supabase database.");
      }

      // Success! Update local state immediately for instant feedback
      setRequests(prev => [requestObj, ...prev]);

      // Refresh list from DB in background to guarantee full server sync
      fetchRequestsFromDB();

      // Send notification to employee
      addNotification(
        currentUser.email,
        `Your request "${newReq.title}" for ${newReq.systemName} has been submitted for approval.`,
        'submitted'
      );

      // Send notification to department manager
      if (deptManager) {
        addNotification(
          deptManager.email,
          `📥 New access request "${newReq.title}" from ${currentUser.fullName} is pending your department approval.`,
          'info_requested'
        );
      }

      // Audit trace
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        'Submit Request',
        `Sourced access request ${reqId} for "${newReq.systemName}" prioritizing "${newReq.priority}".`
      );

      showToast("Access request created successfully!", "success");

    } catch (err: any) {
      console.error("Supabase request insertion exception:", err);
      showToast(err.message || "Failed to submit request.", "error");
      throw err;
    }
  };

  // Approver Action Matrix
  const handleRequestWorkflowAction = (
    requestId: string, 
    action: 'Approve' | 'Reject' | 'Request Info', 
    comments: string,
    provisionedCredentials?: {
      username?: string;
      tokenType?: string;
      secretValue?: string;
      connectionUri?: string;
      expiresAt?: string;
    }
  ) => {
    if (!currentUser) return;

    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;

      let nextStatus: RequestStatus = req.status;
      let notificationType: AppNotification['type'] = 'info_requested';

      if (currentUser.role === 'Manager' || currentUser.role === 'Department Manager') {
        if (action === 'Approve') {
          nextStatus = 'Pending IT Approval';
          notificationType = 'approved';
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        } else {
          nextStatus = 'Under Review';
          notificationType = 'info_requested';
        }
      } else if (currentUser.role === 'IT Admin' || currentUser.role === 'IT Support') {
        // Complete workflow
        if (action === 'Approve') {
          nextStatus = 'Completed';
          notificationType = 'granted';
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        } else {
          nextStatus = 'Under Review';
          notificationType = 'info_requested';
        }
      } else if (currentUser.role === 'Super Admin') {
        if (action === 'Approve') {
          if (req.status === 'Pending IT Approval' || req.status === 'Approved' || req.status === 'Pending') {
            nextStatus = 'Completed';
            notificationType = 'granted';
          } else {
            nextStatus = 'Pending IT Approval';
            notificationType = 'approved';
          }
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        } else {
          nextStatus = 'Under Review';
          notificationType = 'info_requested';
        }
      }

      // Notify original requester
      addNotification(
        req.userEmail,
        `Workflow updated: Request ${req.id} resolved as [${action}] by ${currentUser.fullName}. Notes: "${comments}"`,
        notificationType
      );

      // Log secure audit transaction
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        action === 'Approve' ? 'Approve Request' : action === 'Reject' ? 'Reject Request' : 'Under Review Request',
        `Executed workflow transaction on ${req.id}. Result: ${action}. Notes: "${comments}"`
      );

      // Append to comments history
      const existingHistory = req.commentsHistory ? [...req.commentsHistory] : [];
      if (existingHistory.length === 0) {
        // Seed first
        existingHistory.push({
          id: 'comment-initial-' + req.id,
          authorName: req.userFullName,
          authorRole: 'User',
          action: 'Submit',
          text: req.justification || 'No justification provided.',
          timestamp: req.createdAt
        });
        if (req.comments) {
          existingHistory.push({
            id: 'comment-legacy-' + req.id,
            authorName: 'Sponsoring Approver (Legacy)',
            authorRole: 'Manager',
            action: 'Approve',
            text: req.comments,
            timestamp: req.createdAt
          });
        }
      }

      const newHistoryComment = {
        id: 'comment-' + Math.random().toString(36).substring(2, 9),
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        action: (currentUser.role === 'IT Admin' || currentUser.role === 'IT Support') && action === 'Approve' ? 'Complete' : action,
        text: comments || ((currentUser.role === 'IT Admin' || currentUser.role === 'IT Support') && action === 'Approve' ? 'Access provisioned and completed.' : `Workflow update [${action}]`),
        timestamp: new Date().toISOString()
      };

      const finalCommentsHistory = [...existingHistory, newHistoryComment];
      const finalComments = comments || undefined;
      const finalCredentials = provisionedCredentials || req.provisionedCredentials;

      // Asynchronous database update with metadata columns, proper try/catch, and user ID retrieval
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error("No authenticated session found. Please sign in again.");
          }

          const currentTimestamp = new Date().toISOString();
          const fullPayload: any = {
            status: nextStatus,
            comments: finalComments || null,
            comments_history: finalCommentsHistory,
            provisioned_credentials: finalCredentials || null,
            updated_at: currentTimestamp
          };

          if (currentUser.role === 'Manager' || currentUser.role === 'Department Manager' || currentUser.role === 'Super Admin') {
            if (action === 'Approve') {
              fullPayload.approved_by = user.id;
              fullPayload.approved_at = currentTimestamp;
            } else if (action === 'Reject') {
              fullPayload.rejected_by = user.id;
              fullPayload.rejected_at = currentTimestamp;
            }
          }

          const { error } = await supabase
            .from('access_requests')
            .update(fullPayload)
            .eq('id', req.id);

          if (error) {
            // Fallback for missing table columns in development/preview schema
            if (error.message && (error.message.includes("column") || error.message.includes("does not exist"))) {
              console.warn("Table access_requests is missing approved_by/rejected_by metadata columns. Executing schema-agnostic update.");
              
              const fallbackPayload = {
                status: nextStatus,
                comments: finalComments || null,
                comments_history: finalCommentsHistory,
                provisioned_credentials: finalCredentials || null
              };

              const { error: fallbackError } = await supabase
                .from('access_requests')
                .update(fallbackPayload)
                .eq('id', req.id);

              if (fallbackError) {
                throw fallbackError;
              }
            } else {
              throw error;
            }
          }

          // Output success toast notification
          if (action === 'Approve') {
            showToast("Request approved successfully!", "success");
          } else if (action === 'Reject') {
            showToast("Request rejected successfully!", "success");
          } else {
            showToast("Request updated successfully!", "success");
          }

          // Query invalidation: refresh requests list from database
          fetchRequestsFromDB();

        } catch (err: any) {
          console.error(`Error in Supabase workflow action update for request ${req.id}:`, err);
          showToast(err.message || "Failed to persist workflow updates in database.", "error");
        }
      })();

      return {
        ...req,
        status: nextStatus,
        comments: finalComments,
        commentsHistory: finalCommentsHistory,
        provisionedCredentials: finalCredentials
      };
    }));
  };

  const handleDeleteAttachment = async (requestId: string, attachmentIndex: number) => {
    const req = requests.find(r => r.id === requestId);
    if (!req || !req.attachments) return;

    const attachment = req.attachments[attachmentIndex];
    if (!attachment) return;

    if (attachment.filePath) {
      try {
        const { error } = await supabase.storage
          .from('app-files')
          .remove([attachment.filePath]);
        if (error) {
          console.error("Failed to delete file from Supabase Storage:", error);
        }
      } catch (err) {
        console.error("Error deleting file from Supabase Storage:", err);
      }
    }

    const updatedAttachments = req.attachments.filter((_, idx) => idx !== attachmentIndex);
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ attachments: updatedAttachments })
        .eq('id', requestId);

      if (error) {
        console.error("Failed to update attachments in Supabase DB:", error);
        return;
      }

      setRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          const updated = { ...r, attachments: updatedAttachments };
          if (selectedRequest && selectedRequest.id === requestId) {
            setSelectedRequest(updated);
          }
          return updated;
        }
        return r;
      }));
    } catch (err) {
      console.error("Error updating attachments database reference:", err);
    }
  };

  // Bulk Approver Action Matrix
  const handleBulkWorkflowAction = (requestIds: string[], action: 'Approve' | 'Reject', comments: string) => {
    if (!currentUser) return;

    setRequests(prev => prev.map(req => {
      if (!requestIds.includes(req.id)) return req;

      let nextStatus: RequestStatus = req.status;
      let notificationType: AppNotification['type'] = 'info_requested';

      if (currentUser.role === 'Manager' || currentUser.role === 'Department Manager') {
        if (action === 'Approve') {
          nextStatus = 'Pending IT Approval';
          notificationType = 'approved';
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        }
      } else if (currentUser.role === 'IT Admin' || currentUser.role === 'IT Support') {
        if (action === 'Approve') {
          nextStatus = 'Completed';
          notificationType = 'granted';
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        }
      } else if (currentUser.role === 'Super Admin') {
        if (action === 'Approve') {
          if (req.status === 'Pending IT Approval' || req.status === 'Approved' || req.status === 'Pending') {
            nextStatus = 'Completed';
            notificationType = 'granted';
          } else {
            nextStatus = 'Pending IT Approval';
            notificationType = 'approved';
          }
        } else if (action === 'Reject') {
          nextStatus = 'Rejected';
          notificationType = 'rejected';
        }
      }

      // Notify original requester
      addNotification(
        req.userEmail,
        `Workflow updated: Request ${req.id} resolved as [${action}] via Bulk Action by ${currentUser.fullName}. Notes: "${comments}"`,
        notificationType
      );

      // Log secure audit transaction
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        action === 'Approve' ? 'Bulk Approve Requests' : 'Bulk Reject Requests',
        `Executed bulk workflow transaction on ${req.id}. Result: ${action}. Notes: "${comments}"`
      );

      // Append to comments history
      const existingHistory = req.commentsHistory ? [...req.commentsHistory] : [];
      if (existingHistory.length === 0) {
        // Seed first
        existingHistory.push({
          id: 'comment-initial-' + req.id,
          authorName: req.userFullName,
          authorRole: 'User',
          action: 'Submit',
          text: req.justification || 'No justification provided.',
          timestamp: req.createdAt
        });
        if (req.comments) {
          existingHistory.push({
            id: 'comment-legacy-' + req.id,
            authorName: 'Sponsoring Approver (Legacy)',
            authorRole: 'Manager',
            action: 'Approve',
            text: req.comments,
            timestamp: req.createdAt
          });
        }
      }

      const newHistoryComment = {
        id: 'comment-' + Math.random().toString(36).substring(2, 9),
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        action: action,
        text: comments || `Bulk workflow action: ${action}`,
        timestamp: new Date().toISOString()
      };

      const finalCommentsHistory = [...existingHistory, newHistoryComment];
      const finalComments = comments || undefined;

      supabase
        .from('access_requests')
        .update({
          status: nextStatus,
          comments: finalComments || null,
          comments_history: finalCommentsHistory
        })
        .eq('id', req.id)
        .then(({ error }) => {
          if (error) {
            console.error(`Error updating bulk request ${req.id} in Supabase:`, error);
          }
        });

      return {
        ...req,
        status: nextStatus,
        comments: finalComments,
        commentsHistory: finalCommentsHistory
      };
    }));
  };

  // Administration Updates
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!currentUser) return;

    // Persist role update to Supabase database if UUID is valid
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    if (isUUID) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId);
        if (error) {
          console.error("Error updating profile role in DB:", error);
        }
      } catch (err) {
        console.error("Failed to update profile role in DB:", err);
      }
    }

    setProfiles(prev => prev.map(p => {
      if (p.id !== userId) return p;

      logAuditEvent(
        currentUser.email,
        currentUser.role,
        'Permission Change',
        `Modified security privileges of ${p.email} mapping custom scope to ${newRole}.`
      );

      addNotification(
        p.email,
        `Your security access parameters have been adjusted by IT Admin directory to Level: ${newRole}.`,
        'info_requested'
      );

      return { ...p, role: newRole };
    }));
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'Active' | 'Deactivated') => {
    if (!currentUser) return;

    // Persist status update to Supabase database if UUID is valid
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    if (isUUID) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', userId);
        if (error) {
          console.error("Error updating profile status in DB:", error);
        }
      } catch (err) {
        console.error("Failed to update profile status in DB:", err);
      }
    }

    setProfiles(prev => prev.map(p => {
      if (p.id !== userId) return p;

      logAuditEvent(
        currentUser.email,
        currentUser.role,
        newStatus === 'Active' ? 'Enable Account' : 'Deactivate Account',
        `Swapped identity registry execution level for ${p.email} to: ${newStatus}.`
      );

      return { ...p, status: newStatus };
    }));
  };

  const handleCreateNewUser = (user: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const fullObj: UserProfile = {
      ...user,
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setProfiles(prev => [...prev, fullObj]);

    if (currentUser) {
      logAuditEvent(
        currentUser.email,
        currentUser.role,
        'Create User Record',
        `Manually compiled organizational directory profile for ${user.email}.`
      );
    }
  };

  const handleForceResetPassword = (userEmail: string) => {
    if (!currentUser) return;
    
    logAuditEvent(
      currentUser.email,
      currentUser.role,
      'Password Reset Forced',
      `Triggered compliance bypass security credentials resets ticket to ${userEmail}.`
    );

    addNotification(
      userEmail,
      `Your directory password has been force-reset by IT Administration. Sign in using transient credentials.`,
      'security'
    );

    alert(`Compliance credentials ticket created and sent securely to ${userEmail}. Audit trails wrote complete trace log.`);
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    setCurrentUser(updatedProfile);
    setProfiles((prev) => prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)));

    // Sync own profile settings to Supabase DB if UUID is valid
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(updatedProfile.id);
    if (isUUID) {
      try {
        // Embed custom profile attributes inside JSONB notification_preferences so they are safely saved
        // even if custom table columns are missing in the active database.
        const updatedPrefs = {
          ...(updatedProfile.notificationPreferences || {}),
          custom_profile: {
            phoneNumber: updatedProfile.phoneNumber,
            jobTitle: updatedProfile.jobTitle,
            employeeId: updatedProfile.employeeId,
            avatarUrl: updatedProfile.avatarUrl,
            lastLogin: updatedProfile.lastLogin
          }
        };

        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: updatedProfile.fullName,
            role: updatedProfile.role,
            department_id: updatedProfile.departmentId,
            status: updatedProfile.status,
            mfa_enabled: updatedProfile.mfaEnabled || false,
            notification_preferences: updatedPrefs,
            phone_number: updatedProfile.phoneNumber,
            job_title: updatedProfile.jobTitle,
            employee_id: updatedProfile.employeeId,
            avatar_url: updatedProfile.avatarUrl,
            last_login: updatedProfile.lastLogin
          })
          .eq('id', updatedProfile.id);

        if (error) {
          console.warn("Standard profile update failed (might have missing custom columns). Retrying using JSONB fallback strategy:", error.message);
          
          // Retry with ONLY standard columns, passing custom fields inside notification_preferences JSONB!
          const { error: retryError } = await supabase
            .from('profiles')
            .update({
              full_name: updatedProfile.fullName,
              role: updatedProfile.role,
              department_id: updatedProfile.departmentId,
              status: updatedProfile.status,
              mfa_enabled: updatedProfile.mfaEnabled || false,
              notification_preferences: updatedPrefs
            })
            .eq('id', updatedProfile.id);

          if (retryError) {
            console.error("Error saving profile via JSONB fallback strategy:", retryError);
          } else {
            console.log("Successfully saved profile to database via JSONB fallback strategy.");
          }
        } else {
          console.log("Successfully saved profile to database with all custom columns.");
        }
      } catch (err) {
        console.error("Failed to save profile to DB:", err);
      }
    }

    logAuditEvent(
      updatedProfile.email,
      updatedProfile.role,
      'Profile Updated',
      'User updated profile fields, MFA preferences, and notification rules.'
    );

    addNotification(
      updatedProfile.email,
      'Your profile settings and notification rules were successfully updated in the IAM directory.',
      'security'
    );
  };

  const handleAddTicket = async (ticket: SupportTicket) => {
    // Auto-assignment logic: find appropriate IT Admin/Support based on department
    let assignedAdmin = profiles.find(p => p.role === 'IT Admin' && p.departmentId === ticket.userDepartmentId);
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'IT Support' && p.departmentId === ticket.userDepartmentId);
    }
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'IT Admin');
    }
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'IT Support');
    }
    if (!assignedAdmin) {
      assignedAdmin = profiles.find(p => p.role === 'Super Admin');
    }

    const assignedToId = assignedAdmin ? assignedAdmin.id : undefined;
    const assignedToName = assignedAdmin ? assignedAdmin.fullName : undefined;

    const assignedTicket: SupportTicket = {
      ...ticket,
      assignedToId,
      assignedToName,
      activityLogs: assignedAdmin ? [
        ...ticket.activityLogs,
        {
          id: `act-${Math.random().toString(36).substr(2, 9)}`,
          action: `Auto-assigned to IT Admin: ${assignedAdmin.fullName} based on Department`,
          actorName: 'System Auto-Assign',
          timestamp: new Date().toISOString()
        }
      ] : ticket.activityLogs
    };

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          id: assignedTicket.id,
          user_id: assignedTicket.userId,
          user_name: assignedTicket.userName,
          user_email: assignedTicket.userEmail,
          user_department_id: assignedTicket.userDepartmentId || null,
          user_role: assignedTicket.userRole,
          subject: assignedTicket.subject,
          category: assignedTicket.category,
          priority: assignedTicket.priority,
          status: assignedTicket.status,
          description: assignedTicket.description,
          attachment_name: assignedTicket.attachmentName || null,
          attachment_size: assignedTicket.attachmentSize || null,
          assigned_to_id: assignedTicket.assignedToId || null,
          assigned_to_name: assignedTicket.assignedToName || null,
          created_at: assignedTicket.createdAt,
          updated_at: assignedTicket.updatedAt,
          comments: assignedTicket.comments,
          activity_logs: assignedTicket.activityLogs
        });
      
      if (error) {
        console.warn("Could not insert support ticket to database:", error.message);
      }
    } catch (err) {
      console.warn("Exception inserting support ticket to database:", err);
    }

    setTickets((prev) => [assignedTicket, ...prev]);

    logAuditEvent(
      assignedTicket.userEmail,
      assignedTicket.userRole,
      'Support Ticket Submitted',
      `Submitted support ticket ${assignedTicket.id} under category ${assignedTicket.category} with priority ${assignedTicket.priority}`
    );

    addNotification(
      assignedTicket.userEmail,
      `Your support ticket ${assignedTicket.id}: "${assignedTicket.subject}" has been submitted successfully to the Help Desk.`,
      'info_requested'
    );

    if (assignedAdmin) {
      addNotification(
        assignedAdmin.email,
        `📥 Support Ticket [${assignedTicket.id}] from ${assignedTicket.userName} has been auto-assigned to you based on department matching.`,
        'info_requested'
      );
    }

    const itStaff = profiles.filter(p => p.role === 'IT Admin' || p.role === 'Super Admin' || p.role === 'IT Support');
    itStaff.forEach(staff => {
      if (assignedAdmin && staff.id === assignedAdmin.id) return; // already notified above
      if (staff.email.toLowerCase() !== assignedTicket.userEmail.toLowerCase()) {
        addNotification(
          staff.email,
          `⚠️ New Support Ticket [${assignedTicket.id}] from ${assignedTicket.userName}: "${assignedTicket.subject}" (Priority: ${assignedTicket.priority})`,
          'info_requested'
        );
      }
    });
  };

  const handleUpdateTicket = async (updatedTicket: SupportTicket) => {
    const prevTicket = tickets.find(t => t.id === updatedTicket.id);
    if (!prevTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: updatedTicket.status,
          assigned_to_id: updatedTicket.assignedToId || null,
          assigned_to_name: updatedTicket.assignedToName || null,
          updated_at: updatedTicket.updatedAt,
          comments: updatedTicket.comments,
          activity_logs: updatedTicket.activityLogs
        })
        .eq('id', updatedTicket.id);

      if (error) {
        console.warn("Could not update support ticket in database:", error.message);
      }
    } catch (err) {
      console.warn("Exception updating support ticket in database:", err);
    }

    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));

    // 1. Status transition check
    if (prevTicket.status !== updatedTicket.status) {
      logAuditEvent(
        currentUser?.email || 'system',
        currentUser?.role || 'User',
        'Support Ticket Status Updated',
        `Ticket ${updatedTicket.id} status changed from ${prevTicket.status} to ${updatedTicket.status}`
      );

      addNotification(
        updatedTicket.userEmail,
        `🔄 Ticket [${updatedTicket.id}] status updated to: ${updatedTicket.status}`,
        'info_requested'
      );
    }

    // 2. Ticket Assignment check
    if (prevTicket.assignedToId !== updatedTicket.assignedToId) {
      logAuditEvent(
        currentUser?.email || 'system',
        currentUser?.role || 'User',
        'Support Ticket Assigned',
        `Ticket ${updatedTicket.id} assigned to ${updatedTicket.assignedToName || 'Unassigned'}`
      );

      if (updatedTicket.assignedToId) {
        const staff = profiles.find(p => p.id === updatedTicket.assignedToId);
        if (staff) {
          addNotification(
            staff.email,
            `📥 You have been assigned support ticket [${updatedTicket.id}]: "${updatedTicket.subject}"`,
            'info_requested'
          );
        }
      }

      addNotification(
        updatedTicket.userEmail,
        `👤 Ticket [${updatedTicket.id}] has been assigned to IT Agent: ${updatedTicket.assignedToName || 'Unassigned'}`,
        'info_requested'
      );
    }

    // 3. New Response check
    if (updatedTicket.comments.length > prevTicket.comments.length) {
      const latestComment = updatedTicket.comments[updatedTicket.comments.length - 1];
      
      logAuditEvent(
        latestComment.authorEmail,
        latestComment.authorRole,
        latestComment.isInternal ? 'Support Ticket Internal Note Added' : 'Support Ticket Reply Posted',
        `Added reply to ticket ${updatedTicket.id}`
      );

      if (!latestComment.isInternal) {
        if (latestComment.authorEmail.toLowerCase() !== updatedTicket.userEmail.toLowerCase()) {
          addNotification(
            updatedTicket.userEmail,
            `💬 Ticket [${updatedTicket.id}] received a response from IT Staff (${latestComment.authorName})`,
            'info_requested'
          );
        } else {
          if (updatedTicket.assignedToId) {
            const staff = profiles.find(p => p.id === updatedTicket.assignedToId);
            if (staff) {
              addNotification(
                staff.email,
                `💬 Client response received on [${updatedTicket.id}] from ${updatedTicket.userName}`,
                'info_requested'
              );
            }
          } else {
            const itStaff = profiles.filter(p => p.role === 'IT Admin' || p.role === 'Super Admin' || p.role === 'IT Support');
            itStaff.forEach(staff => {
              if (staff.email.toLowerCase() !== updatedTicket.userEmail.toLowerCase()) {
                addNotification(
                  staff.email,
                  `💬 Client response on unassigned Ticket [${updatedTicket.id}] from ${updatedTicket.userName}`,
                  'info_requested'
                );
              }
            });
          }
        }
      }
    }
  };

  // Notification mark as reads
  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.error("Failed to update notification in Supabase:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.userEmail === currentUser.email ? { ...n, isRead: true } : n));
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_email', currentUser.email);
    } catch (err) {
      console.error("Failed to update all notifications in Supabase:", err);
    }
  };

  // Navigation tabs list depending on user level roles
  const renderDashboardContent = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'User':
        return (
          <UserDashboard
            requests={requests}
            userEmail={currentUser.email}
            onOpenCreateModal={() => setIsCreateRequestOpen(true)}
            onSelectRequest={setSelectedRequest}
            auditLogs={auditLogs}
            searchTerm={globalSearchTerm}
            onSearchChange={setGlobalSearchTerm}
            tickets={tickets}
          />
        );
      case 'Manager':
      case 'Department Manager':
        return (
          <ManagerDashboard
            requests={requests}
            departments={departments}
            currentUser={currentUser}
            onSelectRequest={setSelectedRequest}
            searchTerm={globalSearchTerm}
            onSearchChange={setGlobalSearchTerm}
            onBulkWorkflowAction={handleBulkWorkflowAction}
          />
        );
      case 'IT Support':
      case 'IT Admin':
      case 'Super Admin':
        // Display full Admin dashboard view metrics
        return (
          <AdminDashboard
            requests={requests}
            profiles={profiles}
            departments={departments}
            onSelectRequest={setSelectedRequest}
            searchTerm={globalSearchTerm}
            onSearchChange={setGlobalSearchTerm}
            theme={theme}
          />
        );
      default:
        return (
          <div className="p-8 text-center bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 rounded-2xl max-w-xl mx-auto space-y-3">
            <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Unhandled Sandbox Role Context</h3>
            <p className="text-xs text-yellow-700/85 dark:text-yellow-300/80 leading-relaxed">
              Your identity directory profile is assigned the custom role <strong className="font-extrabold">"{currentUser.role}"</strong>, which does not map to a standard dashboard context.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleSwitchSandboxRole('User')}
                className="px-4 py-2 bg-yellow-650 hover:bg-yellow-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                Reset Session to Employee (User)
              </button>
            </div>
          </div>
        );
    }
  };

  if (isAuthInitializing) {
    return (
      <div className={`${theme} min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden`}>
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col items-center max-w-sm w-full text-center space-y-6 px-6 z-10">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="w-16 h-16 rounded-full border-2 border-indigo-100 dark:border-indigo-950 animate-pulse flex items-center justify-center" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-indigo-650 dark:border-indigo-400 animate-spin" />
            
            {/* Central icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-indigo-650 dark:text-indigo-400 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Ethiopian Statistics Service</h2>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase">Identity & Access Management</p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 px-3 py-1.5 rounded-full shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Securing session gateway...</span>
          </div>
        </div>
      </div>
    );
  }

  // If simple quest, show single screens nicely
  if (currentPage !== 'dashboard') {
    return (
      <div className={`${theme} min-h-screen bg-white dark:bg-gray-950 font-sans transition-colors duration-200`}>
        {currentPage === 'landing' ? (
          <LandingPage onNavigate={setCurrentPage} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} />
        ) : currentPage === 'public-request' ? (
          <PublicRequestForm 
            departments={departments}
            systems={systems}
            onBack={() => setCurrentPage('landing')}
            onNavigateToTrack={(id) => {
              setPublicTrackId(id);
              setCurrentPage('public-track');
            }}
            onSubmitSuccess={(newRequest) => {
              // Add to local requests state so admins can see it instantly!
              setRequests(prev => [newRequest, ...prev]);
            }}
          />
        ) : currentPage === 'public-track' ? (
          <PublicTrackRequest 
            departments={departments}
            onBack={() => setCurrentPage('landing')}
            initialSearchId={publicTrackId}
          />
        ) : (
          <AuthLayout currentPage={currentPage as any} onNavigate={setCurrentPage} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
            {currentPage === 'login' && <LoginScreen onSuccess={handleLoginSuccess} onNavigate={setCurrentPage} profiles={profiles} />}
            {currentPage === 'register' && <RegisterScreen onSuccess={handleRegisterSuccess} onNavigate={setCurrentPage} departments={departments} profiles={profiles} />}
            {currentPage === 'forgot' && <ForgotPasswordScreen onNavigate={setCurrentPage} />}
            {currentPage === 'reset' && <ResetPasswordScreen onNavigate={setCurrentPage} />}
          </AuthLayout>
        )}
      </div>
    );
  }

  // Dashboard workspace shell layout with lateral sidebar
  return (
    <div className={`${theme} min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-100 font-sans text-slate-900 transition-colors duration-200 relative overflow-hidden pb-16`}>
      
      {/* Floating Background Glows */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/20 to-transparent dark:from-indigo-950/10 pointer-events-none z-0" />
      <div className="absolute top-[300px] left-10 w-72 h-72 bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[100px] right-10 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none z-0" />
      
      {/* Shell Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchSandboxRole}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllAsRead}
        globalSearchTerm={globalSearchTerm}
        setGlobalSearchTerm={setGlobalSearchTerm}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSelectProfileTab={() => setActiveTab('profile')}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigate={setCurrentPage}
        onOpenCreateModal={() => setIsCreateRequestOpen(true)}
      />

      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-5rem)] relative z-10">
        
        {/* Navigation Sidebar Drawer */}
        <aside className="hidden xl:flex w-64 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md text-slate-700 dark:text-slate-300 p-6 flex flex-col gap-6 border-r border-slate-200/60 dark:border-slate-900/60 transition-all z-10">
          
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest pl-3">Workspace Modules</h3>
            <nav className="space-y-1.5">
              
              {/* Tab Button */}
              <button
                id="btn-nav-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                  activeTab === 'dashboard'
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-500/20 pl-6'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                }`}
              >
                {activeTab === 'dashboard' && (
                  <span className="absolute left-2 top-3.5 bottom-3.5 w-1 bg-white rounded-full animate-fade-in" />
                )}
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Executive Dashboard</span>
              </button>

              {/* FAQ Tab Button */}
              <button
                id="btn-nav-faq"
                onClick={() => setActiveTab('faq')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer ${
                  activeTab === 'faq'
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Frequently Asked Questions</span>
              </button>

              {/* Profile & Security Tab Button */}
              <button
                id="btn-nav-profile"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer ${
                  activeTab === 'profile'
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Profile & Security</span>
              </button>

              {/* Support & Help Desk Tab Button */}
              <button
                id="btn-nav-support"
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer ${
                  activeTab === 'support'
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                }`}
              >
                <LifeBuoy className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Support & Help Desk</span>
              </button>

              {/* Only show User Directory, Auditing, Reports for Admin contexts */}
              {(currentUser?.role === 'IT Admin' || currentUser?.role === 'Super Admin' || currentUser?.role === 'IT Support') && (
                <>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer ${
                      activeTab === 'users'
                        ? 'text-white bg-indigo-600 shadow-md shadow-indigo-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Identity Directory</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer ${
                      activeTab === 'reports'
                        ? 'text-white bg-indigo-600 shadow-md shadow-indigo-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <FileBarChart className="w-4 h-4 shrink-0" />
                    <span>Compliance Reports</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all rounded-xl border-none cursor-pointer ${
                      activeTab === 'audit_logs'
                        ? 'text-white bg-indigo-600 shadow-md shadow-indigo-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <History className="w-4 h-4 shrink-0" />
                    <span>Security Audit Logs</span>
                  </button>
                </>
              )}

            </nav>
          </div>

          {/* Quick Stats sidebar widget */}
          {currentUser && (
            <div className="mt-auto hidden lg:block p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
              <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Session parameters:</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">MFA Safe:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">ENFORCED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Connection:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">SECURED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Host Tunnel:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Cloud Run TLS</span>
                </div>
              </div>
            </div>
          )}

          {/* Utility Secure Channel */}
          <div className="border-t border-slate-200/60 dark:border-slate-900/60 pt-4 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 pl-2">
            <span>IAM Gateway</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              ● ONLINE
            </span>
          </div>

        </aside>

        {/* Central Workspace Canvas */}
        <main className="flex-1 p-6 lg:p-10 select-text overflow-x-hidden">
          
          {activeTab === 'dashboard' && renderDashboardContent()}

          {activeTab === 'users' && (
            <UserManagement
              profiles={profiles}
              departments={departments}
              onUpdateRole={handleUpdateRole}
              onUpdateStatus={handleUpdateStatus}
              onCreateUser={handleCreateNewUser}
              onResetPassword={handleForceResetPassword}
              currentUserRole={currentUser?.role}
            />
          )}

          {activeTab === 'reports' && (
            <ReportingModule 
              requests={requests} 
              departments={departments} 
            />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogView 
              auditLogs={auditLogs} 
            />
          )}

          {activeTab === 'faq' && (
            <FAQView />
          )}

          {activeTab === 'support' && currentUser && (
            <SupportView
              currentUser={currentUser}
              profiles={profiles}
              departments={departments}
              tickets={tickets}
              onAddTicket={handleAddTicket}
              onUpdateTicket={handleUpdateTicket}
              onOpenFAQ={() => setActiveTab('faq')}
              showToast={showToast}
            />
          )}

          {activeTab === 'profile' && currentUser && (
            <ProfileView
              currentUser={currentUser}
              departments={departments}
              profiles={profiles}
              auditLogs={auditLogs}
              onSaveProfile={handleSaveProfile}
              showToast={showToast}
            />
          )}

        </main>

      </div>

      {/* Creation and detail review modals */}
      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onSubmit={handleCreateRequestSubmit}
        departments={departments}
        systems={systems}
        profiles={profiles}
        currentUser={currentUser}
      />

      <RequestDetailsModal
        request={selectedRequest}
        isOpen={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
        currentUserRole={currentUser?.role || 'User'}
        currentUserId={currentUser?.id || ''}
        currentUserFullName={currentUser?.fullName || ''}
        onWorkflowAction={handleRequestWorkflowAction}
        departments={departments}
        onDeleteAttachment={handleDeleteAttachment}
      />

      {currentUser && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          departments={departments}
          onSaveProfile={handleSaveProfile}
          profiles={profiles}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div 
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in-right ${
            toast.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300' 
              : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-450 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-450 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
