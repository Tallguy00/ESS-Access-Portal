import React, { useState, useEffect } from 'react';
import { UserProfile, Department } from '../types';
import { supabase } from '../supabaseClient';
import { 
  X, User, Mail, Shield, Check, Save, BellRing, 
  ToggleLeft, ToggleRight, Fingerprint, Building, 
  RefreshCw, ShieldAlert, Phone, Briefcase
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  departments: Department[];
  onSaveProfile: (updatedProfile: UserProfile) => void;
  profiles: UserProfile[];
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  departments,
  onSaveProfile,
  profiles
}: UserProfileModalProps) {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [mfaEnabled, setMfaEnabled] = useState(currentUser.mfaEnabled ?? true);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Notification toggle preferences (default to true for all initially if undefined)
  const [prefSubmitted, setPrefSubmitted] = useState(
    currentUser.notificationPreferences?.onSubmitted ?? true
  );
  const [prefUnderReview, setPrefUnderReview] = useState(
    currentUser.notificationPreferences?.onUnderReview ?? true
  );
  const [prefApproved, setPrefApproved] = useState(
    currentUser.notificationPreferences?.onApproved ?? true
  );
  const [prefRejected, setPrefRejected] = useState(
    currentUser.notificationPreferences?.onRejected ?? true
  );
  const [prefCompleted, setPrefCompleted] = useState(
    currentUser.notificationPreferences?.onCompleted ?? true
  );

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync state with currentUser when modal opens or profile changes
  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(currentUser.fullName || '');
      setMfaEnabled(currentUser.mfaEnabled ?? true);
      setPhoneNumber(currentUser.phoneNumber || '');
      setJobTitle(currentUser.jobTitle || '');
      setPrefSubmitted(currentUser.notificationPreferences?.onSubmitted ?? true);
      setPrefUnderReview(currentUser.notificationPreferences?.onUnderReview ?? true);
      setPrefApproved(currentUser.notificationPreferences?.onApproved ?? true);
      setPrefRejected(currentUser.notificationPreferences?.onRejected ?? true);
      setPrefCompleted(currentUser.notificationPreferences?.onCompleted ?? true);
    }
  }, [isOpen, currentUser]);

  // Timer effect for OTP countdown
  if (!isOpen) return null;

  const userDept = departments.find((d) => d.id === currentUser.departmentId)?.name || 'Operations';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    setSaveStatus('saving');

    const updated: UserProfile = {
      ...currentUser,
      fullName: fullName.trim() || currentUser.fullName,
      phoneNumber: phoneNumber.trim(),
      jobTitle: jobTitle.trim(),
      mfaEnabled,
      notificationPreferences: {
        onSubmitted: prefSubmitted,
        onUnderReview: prefUnderReview,
        onApproved: prefApproved,
        onRejected: prefRejected,
        onCompleted: prefCompleted,
      },
    };

    setTimeout(() => {
      onSaveProfile(updated);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div
      id="profile-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm overflow-y-auto animate-backdrop-fade"
    >
      <div
        id="profile-settings-modal"
        className="relative w-full max-w-lg bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col my-8 animate-modal-slide"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Identity Profile & Preferences</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 animate-pulse">Manage details, multi-factor verification, and notification rules.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* User Info Card */}
          <div className="flex items-center gap-4 bg-gray-50/70 dark:bg-gray-900 border border-gray-150 dark:border-gray-850 p-4 rounded-2xl">
            {currentUser.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={fullName} 
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-500/20 shrink-0 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-xl select-none uppercase shadow-inner shrink-0">
                {fullName ? fullName.split(' ').map((n) => n[0]).join('') : ''}
              </div>
            )}
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">SECURE IAM ID</span>
              <h3 className="text-base font-black text-gray-950 dark:text-white leading-tight truncate">{fullName}</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </p>
            </div>
          </div>

          {/* Profile Fields Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Account Information</h4>
            
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Full Display Name
              </label>
              <div className="relative">
                <User className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+251 (911) 000-000"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Job Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Job Title
              </label>
              <div className="relative">
                <Briefcase className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Security Analyst"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Read-only details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50/50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-850">
                <span className="text-[10px] font-bold text-gray-400 block">Assigned Role</span>
                <span className="text-xs font-bold text-gray-750 dark:text-gray-200 flex items-center gap-1 mt-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{currentUser.role}</span>
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Contact IT to update</span>
              </div>

              <div className="p-3 bg-gray-50/50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-850">
                <span className="text-[10px] font-bold text-gray-400 block">Department</span>
                <span className="text-xs font-bold text-gray-750 dark:text-gray-200 flex items-center gap-1 mt-1 font-sans">
                  <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{userDept}</span>
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Corporate roster group</span>
              </div>
            </div>

            {/* MFA Enforce toggle */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-905 border border-gray-150 dark:border-gray-850 rounded-xl">
              <div className="flex items-start gap-2.5">
                <Fingerprint className="w-5 h-5 text-indigo-550 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-gray-900 dark:text-white animate-pulse">Multi-Factor Authentication (MFA)</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">Enforce secure login confirmation prompt with physical validation keys.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors bg-transparent border-none p-0"
              >
                {mfaEnabled ? (
                  <ToggleRight className="w-8 h-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Email Notification Alert Settings Section */}
          <div className="space-y-4 border-t border-gray-105 dark:border-gray-850 pt-5">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Email & SMS Alerts Preferences</h4>
            </div>
            <p className="text-[11px] text-gray-500 tracking-tight">Toggle messaging channels to configure automated transactional dispatch for each requesting event.</p>

            <div className="space-y-2.5">
              
              {/* Toggle onSubmitted */}
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-850">
                <div>
                  <span className="text-xs font-bold text-gray-850 dark:text-gray-200 block">Request Submitted</span>
                  <p className="text-[9.5px] text-gray-450 leading-relaxed block">Receive immediate confirmation alerts when you submit access files.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefSubmitted(!prefSubmitted)}
                  className="cursor-pointer bg-transparent border-none p-0"
                >
                  {prefSubmitted ? (
                    <ToggleRight className="w-7 h-7 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                  )}
                </button>
              </div>

              {/* Toggle onUnderReview */}
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-850">
                <div>
                  <span className="text-xs font-bold text-gray-850 dark:text-gray-200 block">Under Review Updates</span>
                  <p className="text-[9.5px] text-gray-450 leading-relaxed block">Alert me when a manager claims the filing or asks additional comments.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefUnderReview(!prefUnderReview)}
                  className="cursor-pointer bg-transparent border-none p-0"
                >
                  {prefUnderReview ? (
                    <ToggleRight className="w-7 h-7 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                  )}
                </button>
              </div>

              {/* Toggle onApproved */}
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-850">
                <div>
                  <span className="text-xs font-bold text-gray-850 dark:text-gray-200 block">Manager Approvals</span>
                  <p className="text-[9.5px] text-gray-450 leading-relaxed block">Deliver quick logs when sponsoring leadership approves access justifications.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefApproved(!prefApproved)}
                  className="cursor-pointer bg-transparent border-none p-0"
                >
                  {prefApproved ? (
                    <ToggleRight className="w-7 h-7 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                  )}
                </button>
              </div>

              {/* Toggle onRejected */}
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-850">
                <div>
                  <span className="text-xs font-bold text-gray-850 dark:text-gray-200 block">Request Rejections</span>
                  <p className="text-[9.5px] text-gray-450 leading-relaxed block">Notify IMMEDIATELY if request justifications fails auditing checks.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefRejected(!prefRejected)}
                  className="cursor-pointer bg-transparent border-none p-0"
                >
                  {prefRejected ? (
                    <ToggleRight className="w-7 h-7 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                  )}
                </button>
              </div>

              {/* Toggle onCompleted */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-xs font-bold text-gray-850 dark:text-gray-200 block">Completion / Provisioning Notes</span>
                  <p className="text-[9.5px] text-gray-450 leading-relaxed block">Deliver final connection parameters compiled by system technicians.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefCompleted(!prefCompleted)}
                  className="cursor-pointer bg-transparent border-none p-0"
                >
                  {prefCompleted ? (
                    <ToggleRight className="w-7 h-7 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 rounded-xl text-red-700 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200/50 rounded-xl text-green-700 text-xs">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Footer Button */}
          <div className="flex items-center justify-end gap-3 mt-6 border-t border-gray-100 dark:border-gray-850 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 transition-colors bg-transparent border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveStatus !== 'idle'}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 min-w-[130px] cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-green-200" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
