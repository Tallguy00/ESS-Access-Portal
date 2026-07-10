import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import LanguageSwitcher from './LanguageSwitcher';
import UnifiedNavbar from './UnifiedNavbar';
import { 
  Shield, 
  FileText, 
  GitBranch, 
  Users, 
  Lock, 
  Bell, 
  BarChart3, 
  CheckCircle2, 
  ChevronDown, 
  ArrowRight, 
  Star, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Activity, 
  Building, 
  ArrowUpRight, 
  Menu, 
  X, 
  RefreshCw, 
  Send, 
  Check,
  ShieldCheck,
  Server,
  Fingerprint,
  Layers,
  HeartHandshake,
  Sun,
  Moon
} from 'lucide-react';

const essLogo = "https://lh3.googleusercontent.com/d/1wqaNrU4Aga0Sciqqoq2BVodC-2Siv3bc";

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'forgot' | 'reset' | 'dashboard' | 'public-request' | 'public-track') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function LandingPage({ onNavigate, theme, onToggleTheme }: LandingPageProps) {
  const { t } = useTranslation();
  
  // Animated numbers state
  const [stats, setStats] = useState({
    users: 450,
    requests: 2800,
    departments: 8,
    slaRate: 94.2,
    avgTime: 5.8
  });

  // Increment statistics on load for visual dynamism
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        users: 1450,
        requests: 18200,
        departments: 8,
        slaRate: 97.8,
        avgTime: 4.2
      });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Contact form submission simulator
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of fixed header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      id: "feat-secure-auth",
      icon: <Fingerprint className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      title: t('landingExtra.featSecureAuthTitle', 'ESS Directory Sync'),
      description: t('landingExtra.featSecureAuthDesc', 'Robust identity verification mapped to Ethiopian Statistics Service active user directories.'),
      badge: t('landingExtra.featSecureAuthBadge', 'National Core')
    },
    {
      id: "feat-rbac",
      icon: <Lock className="w-5 h-5 text-[#0052cc] dark:text-blue-400" />,
      title: t('landingExtra.featRbacTitle', 'Role-Based Security'),
      description: t('landingExtra.featRbacDesc', 'Define boundary controls for standard staff, immediate Team Supervisors, and IT Security gatekeepers.'),
      badge: t('landingExtra.featRbacBadge', 'RBAC Active')
    },
    {
      id: "feat-workflow",
      icon: <GitBranch className="w-5 h-5 text-amber-600 dark:text-amber-500" />,
      title: t('landingExtra.featWorkflowTitle', 'Multi-Tier Approvals'),
      description: t('landingExtra.featWorkflowDesc', 'Automated supervisor routing and system validations with real-time audit logs and comment history.'),
      badge: t('landingExtra.featWorkflowBadge', 'SLA Compliant')
    },
    {
      id: "feat-tracking",
      icon: <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: t('landingExtra.featTrackingTitle', 'Instant Live Tracking'),
      description: t('landingExtra.featTrackingDesc', 'Submit requests as a public guest and monitor live verification stages instantly using your request ID.'),
      badge: t('landingExtra.featTrackingBadge', 'Public Access')
    },
    {
      id: "feat-notifications",
      icon: <Bell className="w-5 h-5 text-[#0052cc] dark:text-blue-400" />,
      title: t('landingExtra.featNotificationsTitle', 'Telegram & SMS Alerts'),
      description: t('landingExtra.featNotificationsDesc', 'Direct notifications dispatched immediately upon ticket reviews, supervisor sign-offs, or delivery.'),
      badge: t('landingExtra.featNotificationsBadge', 'Multichannel')
    },
    {
      id: "feat-audit",
      icon: <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      title: t('landingExtra.featAuditTitle', 'Federal Auditing Log'),
      description: t('landingExtra.featAuditDesc', 'Non-repudiable logs documenting user vectors, approved systems, IP paths, and device parameters.'),
      badge: t('landingExtra.featAuditBadge', 'Audit Ready')
    },
    {
      id: "feat-dept",
      icon: <Building className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      title: t('landingExtra.featDeptTitle', 'Department Isolation'),
      description: t('landingExtra.featDeptDesc', 'Requests are contextualized and routed based on specialized ESS research and survey branches.'),
      badge: t('landingExtra.featDeptBadge', 'Multi-Branch')
    },
    {
      id: "feat-analytics",
      icon: <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      title: t('landingExtra.featAnalyticsTitle', 'SLA Compilations'),
      description: t('landingExtra.featAnalyticsDesc', 'Aggregates visual charts on team routing velocities, approved system requests, and ticket queues.'),
      badge: t('landingExtra.featAnalyticsBadge', 'Live Charts')
    },
    {
      id: "feat-profile",
      icon: <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      title: t('landingExtra.featProfileTitle', 'Super Admin Settings'),
      description: t('landingExtra.featProfileDesc', 'IT controllers manage active system schemas, custom branding details, and system lists.'),
      badge: t('landingExtra.featProfileBadge', 'Admin Shell')
    },
    {
      id: "feat-support",
      icon: <HeartHandshake className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      title: t('landingExtra.featSupportTitle', 'Helpdesk Support'),
      description: t('landingExtra.featSupportDesc', 'Submit secondary IT support tickets for credential issues or software troubleshooting.'),
      badge: t('landingExtra.featSupportBadge', '24/7 Desk')
    }
  ];

  const benefits = [
    {
      title: t('landingExtra.benefit1Title', 'Federal Compliance Standards'),
      desc: t('landingExtra.benefit1Desc', 'Safeguard national statistical databases and security boundaries with robust, multi-layer authorization controls.'),
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />
    },
    {
      title: t('landingExtra.benefit2Title', 'Zero Operational Lag'),
      desc: t('landingExtra.benefit2Desc', 'Autonomously compute manager approval chains and route alerts directly to responsible regional branch heads.'),
      icon: <Activity className="w-6 h-6 text-yellow-500" />
    },
    {
      title: t('landingExtra.benefit3Title', 'Public Self-Service Portal'),
      desc: t('landingExtra.benefit3Desc', 'Public and contract staff can submit and track request flows without needing to register or authenticate.'),
      icon: <RefreshCw className="w-6 h-6 text-indigo-500" />
    },
    {
      title: t('landingExtra.benefit4Title', 'Pristine Auditing Trail'),
      desc: t('landingExtra.benefit4Desc', 'Satisfy rigorous governance rules with comprehensive, chronological audit logs tracking all system approvals.'),
      icon: <Server className="w-6 h-6 text-rose-500" />
    },
    {
      title: t('landingExtra.benefit5Title', 'Multichannel Notifications'),
      desc: t('landingExtra.benefit5Desc', 'Configurable endpoints dispatch live updates directly via Telegram bots and standard SMS channels.'),
      icon: <Layers className="w-6 h-6 text-teal-500" />
    },
    {
      title: t('landingExtra.benefit6Title', 'Centralized ICT Administration'),
      desc: t('landingExtra.benefit6Desc', 'A single unified cockpit for IT Administrators to provision credentials, manage directories, and track load metrics.'),
      icon: <Users className="w-6 h-6 text-[#0052cc]" />
    }
  ];

  const testimonials = [
    {
      quote: t('landingExtra.test1Quote', 'The unified portal makes request routing between Household Statistics and ICT effortless. We slash delivery cycles from weeks to minutes.'),
      name: t('landingExtra.test1Name', 'Chala Bekele'),
      role: t('landingExtra.test1Role', 'ICT Coordinator'),
      company: "ESS",
      rating: 5,
      avatar: "C"
    },
    {
      quote: t('landingExtra.test2Quote', 'Public tracking allows our census consultants to submit credential requests and check their status instantly from regional branch hubs.'),
      name: t('landingExtra.test2Name', 'Aster Tolossa'),
      role: t('landingExtra.test2Role', 'Director of Surveys'),
      company: "ESS",
      rating: 5,
      avatar: "A"
    },
    {
      quote: t('landingExtra.test3Quote', 'An excellent enterprise-grade governance layout. The Telegram notification dispatcher keeps our security teams instantly informed of critical actions.'),
      name: t('landingExtra.test3Name', 'Abebe Kebede'),
      role: t('landingExtra.test3Role', 'Database Administrator'),
      company: "ESS",
      rating: 5,
      avatar: "A"
    }
  ];

  return (
    <div id="landing-page-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      
      {/* Floating Background Glows */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/30 to-transparent dark:from-indigo-950/20 pointer-events-none z-0" />
      <div className="absolute top-[800px] left-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[1600px] right-10 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Unified Responsive Navigation Component */}
      <UnifiedNavbar 
        onNavigate={onNavigate} 
        theme={theme} 
        onToggleTheme={onToggleTheme} 
        scrollToSection={scrollToSection} 
      />

      {/* Hero Section */}
      <section id="hero-section" className="relative pt-12 pb-20 md:py-24 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Dynamic live advisory status */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-150 dark:border-emerald-900 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shadow-sm">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></span>
                <span>{t('landingExtra.advisoryStatus', 'FEDERAL ACCESS SYSTEM: ONLINE & SECURED')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] uppercase">
                {t('landing.heroTitle')} <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400">
                  {t('landing.heroHighlight')}
                </span>
              </h1>

              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('landing.heroDesc')}
              </p>

              {/* Call to Actions - Public Submissions & Tracking */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate('public-request')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center gap-2 border-none"
                  id="hero-start-btn"
                >
                  <span>{t('landing.getStarted')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('public-track')}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350 font-bold text-xs px-7 py-3.5 rounded-xl transition-all cursor-pointer shadow-sm"
                  id="hero-signin-alt"
                >
                  {t('landing.trackMyRequest')}
                </button>
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0 border-t border-slate-200/50 dark:border-slate-900/50">
                <div className="text-center lg:text-left">
                  <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">100%</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t('landingExtra.featAuditTitle', 'Federal Auditing Log')}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{"< 4 Hrs"}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t('landingExtra.featWorkflowBadge', 'SLA Compliant')}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Active</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t('landingExtra.featNotificationsTitle', 'Telegram & SMS Alerts')}</div>
                </div>
              </div>

            </div>

            {/* Hero Right Visual Column - Modern Animated Cybersecurity Vector Illustration */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
                
                {/* SVG Visual Graphic Representing Digital Security & Identity Gateway */}
                <svg viewBox="0 0 400 400" className="w-full h-full text-slate-900 dark:text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background concentric rings */}
                  <circle cx="200" cy="200" r="180" className="stroke-slate-200/30 dark:stroke-slate-800/40 stroke-1" />
                  <circle cx="200" cy="200" r="140" className="stroke-slate-200/50 dark:stroke-slate-800/60 stroke-2 stroke-dashed animate-[spin_60s_linear_infinite]" strokeDasharray="8,8" />
                  <circle cx="200" cy="200" r="100" className="stroke-emerald-500/10 dark:stroke-emerald-400/10 stroke-1" />
                  
                  {/* Rotating Outer Node Path */}
                  <g className="animate-[spin_40s_linear_infinite]" style={{ transformOrigin: '200px 200px' }}>
                    <circle cx="60" cy="200" r="6" className="fill-emerald-600 dark:fill-emerald-400 shadow" />
                    <circle cx="340" cy="200" r="6" className="fill-blue-600 dark:fill-blue-400 shadow" />
                    <circle cx="200" cy="60" r="6" className="fill-yellow-600 dark:fill-yellow-450 shadow" />
                    <circle cx="200" cy="340" r="6" className="fill-violet-600 dark:fill-violet-400 shadow" />
                    
                    {/* Intersecting data lines */}
                    <line x1="60" y1="200" x2="340" y2="200" className="stroke-slate-200/20 dark:stroke-slate-800/30 stroke-1" />
                    <line x1="200" y1="60" x2="200" y2="340" className="stroke-slate-200/20 dark:stroke-slate-800/30 stroke-1" />
                  </g>

                  {/* Pulsing access waves */}
                  <circle cx="200" cy="200" r="75" className="stroke-emerald-500/20 dark:stroke-emerald-400/20 stroke-2 animate-[ping_4s_ease-in-out_infinite]" />
                  
                  {/* Central Security Shield Container */}
                  <g className="filter drop-shadow-[0_8px_24px_rgba(16,185,129,0.15)]">
                    <circle cx="200" cy="200" r="54" className="fill-white dark:fill-slate-900 stroke-slate-100 dark:stroke-slate-800 stroke-2" />
                    
                    {/* Inner glowing core */}
                    <circle cx="200" cy="200" r="42" className="fill-emerald-50 dark:fill-emerald-950/40 stroke-emerald-150 dark:stroke-emerald-900/60 stroke-1" />
                    
                    {/* Shield Icon vector paths */}
                    <g className="translate-x-[184px] translate-y-[182px] scale-1.3 text-emerald-600 dark:text-emerald-400">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="fill-emerald-600/10 dark:fill-emerald-400/5 stroke-emerald-600 dark:stroke-emerald-400 stroke-2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 8v5" className="stroke-emerald-600 dark:stroke-emerald-400 stroke-2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="16" r="1" className="fill-emerald-600 dark:fill-emerald-400" />
                    </g>
                  </g>

                  {/* Surrounding Secure Server Blocks / Identity nodes */}
                  <g className="translate-x-[75px] translate-y-[100px] animate-[bounce_6s_ease-in-out_infinite]">
                    <rect width="60" height="40" rx="10" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800 stroke-2 shadow-sm" />
                    <rect x="8" y="10" width="44" height="6" rx="3" className="fill-slate-200 dark:fill-slate-800" />
                    <rect x="8" y="22" width="24" height="6" rx="3" className="fill-emerald-500/20 dark:fill-emerald-400/20" />
                    <circle cx="44" cy="25" r="3" className="fill-emerald-500" />
                  </g>

                  <g className="translate-x-[265px] translate-y-[240px] animate-[bounce_8s_ease-in-out_infinite]">
                    <rect width="60" height="40" rx="10" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800 stroke-2 shadow-sm" />
                    <rect x="8" y="10" width="34" height="6" rx="3" className="fill-slate-200 dark:fill-slate-800" />
                    <rect x="8" y="22" width="44" height="6" rx="3" className="fill-[#0052cc]/20 dark:fill-blue-400/20" />
                    <circle cx="44" cy="13" r="3" className="fill-emerald-500 animate-pulse" />
                  </g>

                  {/* Flow routing status connections */}
                  <path d="M135 120 Q 200 110, 200 146" className="stroke-emerald-500 dark:stroke-emerald-400 stroke-1.5 stroke-dashed" fill="none" strokeDasharray="4,4" />
                  <path d="M265 260 Q 200 270, 200 254" className="stroke-blue-500 dark:stroke-blue-400 stroke-1.5 stroke-dashed" fill="none" strokeDasharray="4,4" />

                </svg>

                {/* Floating CSS Pills */}
                <div className="absolute top-[18%] left-[-4%] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg animate-float">
                  <span className="p-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg text-[10px] font-black">{t('landingExtra.statBankOnline', 'ONLINE')}</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{t('landingExtra.statBankCluster', 'StatBank Cluster')}</span>
                </div>

                <div className="absolute bottom-[16%] right-[-4%] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg animate-float [animation-delay:3s]">
                  <span className="p-1 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-600 rounded-lg text-[10px] font-black">{t('landingExtra.surveySecure', 'SECURE')}</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{t('landingExtra.surveyDatabase', 'Survey Database')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats-section" className="relative py-12 bg-white dark:bg-slate-900 border-y border-slate-200/60 dark:border-slate-850/60 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 text-center">
            
            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.users.toLocaleString()}+</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t('landingExtra.statActiveUsers', 'Total Active Users')}</p>
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.requests.toLocaleString()}+</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t('landingExtra.statRequestsProcessed', 'Requests Processed')}</p>
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.departments}</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t('landingExtra.statTotalDepts', 'Total Departments')}</p>
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 col-span-2 sm:col-span-1">
              <div className="text-2xl md:text-3xl font-black text-[#0052cc] dark:text-blue-400 font-mono">{stats.slaRate}%</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t('landingExtra.statSlaMet', 'SLA Met On Time')}</p>
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 col-span-2 lg:col-span-1">
              <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats.avgTime} hrs</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t('landingExtra.statAvgTime', 'Avg Turnaround Time')}</p>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="relative py-20 md:py-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">{t('landingExtra.capabilitiesSubtitle', 'Platform Capabilities')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {t('landingExtra.capabilitiesTitle', 'Fully Structured Identity Governance')}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('landingExtra.capabilitiesDesc', 'A comprehensive system of record engineered to unify directory isolation boundaries with flawless workflow automation and detailed compliance audit histories.')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feat) => (
              <div 
                key={feat.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400/60 transition-all hover:shadow-lg flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-900 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 transition-colors">
                    {feat.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">{feat.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feat.description}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 dark:border-slate-900 mt-4 flex items-center justify-between">
                  <span className="text-[9px] bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-100 dark:border-slate-900">{feat.badge}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-350 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="relative py-20 bg-white dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-850/60 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 rounded-full uppercase tracking-wider font-sans">{t('landingExtra.flowSubtitle', 'Operational Flow')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('landingExtra.flowTitle', 'The 4-Step Governance Cycle')}</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('landingExtra.flowDesc', 'Our automated system handles credentials validation, managerial routing, and IT gate assignments without a single manual email thread.')}
            </p>
          </div>

          {/* Step Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="relative space-y-4 p-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
              <div className="text-4xl font-black text-indigo-500/10 dark:text-indigo-400/10 font-mono">01</div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">1</span>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('landingExtra.step1Title', 'Secure Identity Connect')}</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {t('landingExtra.step1Desc', 'Standard corporate employee log in mapped securely to AD with robust credentials check and instant physical hardware MFA token validation.')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-4 p-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
              <div className="text-4xl font-black text-indigo-500/10 dark:text-indigo-400/10 font-mono">02</div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0052cc]/10 dark:bg-blue-950/60 text-[#0052cc] dark:text-blue-400 flex items-center justify-center font-bold text-xs">2</span>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('landingExtra.step2Title', 'Configure & Submit Request')}</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {t('landingExtra.step2Desc', 'Choose the target directory subsystem (AWS cluster, Database port, Billing API), define access type, and attach a valid corporate project justification.')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-4 p-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
              <div className="text-4xl font-black text-indigo-500/10 dark:text-indigo-400/10 font-mono">03</div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-bold text-xs">3</span>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('landingExtra.step3Title', 'SLA Supervisor Approval')}</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {t('landingExtra.step3Desc', 'The manager gets immediate notifications to approve or review justifications. Real-time comment threads minimize any administrative delay.')}
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-4 p-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
              <div className="text-4xl font-black text-indigo-500/10 dark:text-indigo-400/10 font-mono">04</div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">4</span>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('landingExtra.step4Title', 'IT Gate Provisioning')}</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {t('landingExtra.step4Desc', 'IT Administrator verifies managerial consent, completes system configuration, sends access coordinates, and locks down the SOC2 audit log.')}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits-section" className="relative py-20 md:py-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">{t('landingExtra.benefitsSubtitle', 'Return On Investment')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('landingExtra.benefitsTitle', 'Enterprise Access Dividends')}</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('landingExtra.benefitsDesc', 'Our modern corporate Access Portal balances operational speed with pristine risk auditing parameters.')}
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl hover:shadow-md transition-all flex gap-4 items-start"
              >
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl shrink-0 text-indigo-600 dark:text-indigo-400">
                  {benefit.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">{benefit.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials-section" className="relative py-20 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-200/55 dark:border-slate-900/55 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-1.5 rounded-full uppercase tracking-wider font-sans">{t('landingExtra.testSubtitle', 'Government Trust')}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('landingExtra.testTitle', 'Verified by ESS Directorate')}</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('landingExtra.testDesc', 'See how department managers and systems engineers authorize and audit administrative workflows on the ESS Access Portal.')}
            </p>
          </div>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                {/* Visual quote indicator */}
                <div className="absolute right-4 top-2 text-6xl font-black text-indigo-500/5 select-none font-serif">“</div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex gap-0.5">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed font-medium">"{test.quote}"</p>
                </div>

                <div className="pt-6 border-t border-slate-50 dark:border-slate-900 mt-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center select-none shadow-sm">
                    {test.avatar}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{test.name}</h4>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">{test.role}, <strong className="text-slate-500 dark:text-slate-400">{test.company}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-section" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 rounded-full uppercase tracking-wider font-sans">{t('landingExtra.contactSubtitle', 'Reach Out')}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('landingExtra.contactTitle', 'Identity Experts Ready')}</h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {t('landingExtra.contactDesc', 'Do you need integration assistance mapping the access portal to a custom Active Directory instance, LDAP server, or custom AWS VPC container system? Contact us for specialized guidance.')}
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-900/50">
                <div className="flex gap-3 items-start">
                  <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('landingExtra.contactInquiries', 'Corporate Support Inquiries')}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">enterprise@identityflow.com</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Phone className="w-4 h-4 text-[#0052cc] dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('landingExtra.contactHotline', 'Emergency SLA Hotline')}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">+1 (800) 555-0199 (Ext 4)</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('landingExtra.contactHQ', 'HQ Locations')}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">100 Cyber Tower Plaza, Suite 400, San Francisco, CA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Column */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-8 rounded-2xl shadow-xl">
              {contactSubmitted ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-lg">✓</div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{t('landingExtra.contactSuccessTitle', 'Inquiry Dispatched Successfully')}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-medium">
                    {t('landingExtra.contactSuccessDesc', 'Thank you. Your corporate security inquiry has been assigned to an Identity Architect. An analyst will contact you within 2 business hours.')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('landingExtra.labelCorpName', 'Corporate Name')}</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none p-2.5 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('landingExtra.labelWorkEmail', 'Work Email')}</label>
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="john.doe@company.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none p-2.5 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('landingExtra.labelSubject', 'Subject Matter')}</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="AD Mapping & Hardware MFA integration query"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none p-2.5 text-xs text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">{t('landingExtra.labelMessage', 'Detailed Inquiry Message')}</label>
                    <textarea 
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Provide system descriptions, directory boundaries, and scale of operations..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none p-2.5 text-xs text-slate-800 dark:text-white"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border-none"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t('landingExtra.btnSubmitProposal', 'Submit Request For Proposal')}</span>
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b1329] text-gray-400 py-12 border-t border-slate-900 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-white">
                <div className="bg-white p-1 rounded-full border border-slate-800 shadow-md flex items-center justify-center">
                  <img 
                    src={essLogo} 
                    alt="Ethiopian Statistics Service Logo" 
                    className="w-8 h-8 object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-extrabold text-base tracking-tight text-white">ESS Access Portal</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                {t('landingExtra.footerDesc', 'Official centralized identity & access management gateway of the Ethiopian Statistics Service. Enabling secure role-based boundary validation.')}
              </p>
            </div>

            {/* Column 2: Links */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{t('landingExtra.footerPlatform', 'Platform')}</h4>
              <ul className="space-y-2 text-[11px] font-semibold">
                <li><button onClick={() => scrollToSection('hero-section')} className="hover:text-white cursor-pointer bg-transparent border-none p-0">{t('landingExtra.footerHome', 'Home Landing')}</button></li>
                <li><button onClick={() => scrollToSection('features-section')} className="hover:text-white cursor-pointer bg-transparent border-none p-0">{t('landingExtra.footerCapabilities', 'Capabilities')}</button></li>
                <li><button onClick={() => scrollToSection('how-it-works-section')} className="hover:text-white cursor-pointer bg-transparent border-none p-0">{t('landingExtra.footerWorkflows', 'SLA Workflows')}</button></li>
                <li><button onClick={() => scrollToSection('benefits-section')} className="hover:text-white cursor-pointer bg-transparent border-none p-0">{t('landingExtra.footerBenefits', 'Enterprise Benefits')}</button></li>
              </ul>
            </div>

            {/* Column 3: Governance */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{t('landingExtra.footerGovernance', 'Governance & Trust')}</h4>
              <ul className="space-y-2 text-[11px] font-semibold">
                <li><a href="#" className="hover:text-white">{t('landingExtra.footerSoc2Compliance', 'SOC2 Compliance Sheet')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landingExtra.footerMfaDocs', 'Hardware Key MFA Docs')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landingExtra.footerApiTokens', 'API Privilege Tokens')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landingExtra.footerIsoChecklists', 'ISO 27001 Checklists')}</a></li>
              </ul>
            </div>

            {/* Column 4: Newsletter/Status */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{t('landingExtra.footerHealth', 'Gateway Health')}</h4>
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">{t('landingExtra.healthGateway', 'Identity Gateway:')}</span>
                  <span className="text-emerald-400 font-extrabold">● ONLINE</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">{t('landingExtra.healthMfa', 'MFA Dispatcher:')}</span>
                  <span className="text-emerald-400 font-extrabold">● ACTIVE</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">{t('landingExtra.healthDb', 'Database Sync SLA:')}</span>
                  <span className="text-emerald-400 font-extrabold">● 99.99%</span>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-850 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]">
            <p>© 2026 Ethiopian Statistics Service (ESS). {t('landingExtra.footerRights', 'All rights reserved.')}</p>
            <div className="flex gap-4 font-semibold">
              <a href="#" className="hover:text-white">{t('landingExtra.footerPolicy', 'Government Access Policy')}</a>
              <a href="#" className="hover:text-white">{t('landingExtra.footerGuidelines', 'Security & Audit Guidelines')}</a>
              <a href="#" className="hover:text-white">{t('landingExtra.footerCommitments', 'System SLA commitments')}</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
