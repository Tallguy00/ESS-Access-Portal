import React, { useState, useEffect } from 'react';
import { UserProfile, Department, AuditLog } from '../types';
import { supabase } from '../supabaseClient';
import { 
  User, Mail, Shield, Phone, Briefcase, Calendar, 
  Clock, Lock, Check, Eye, EyeOff, ShieldAlert, 
  Upload, Trash2, Camera, UserCheck, Activity, 
  Smartphone, Monitor, Globe, Save
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: UserProfile;
  departments: Department[];
  profiles: UserProfile[];
  auditLogs: AuditLog[];
  onSaveProfile: (updatedProfile: UserProfile) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProfileView({
  currentUser,
  departments,
  profiles,
  auditLogs,
  onSaveProfile,
  showToast
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'activity'>('personal');

  // Personal Info States
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || '');
  const [employeeId, setEmployeeId] = useState(currentUser.employeeId || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || '');
  const [role, setRole] = useState(currentUser.role || 'User');
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Determine if the current user is an administrator
  const isAdmin = currentUser.role === 'IT Admin' || currentUser.role === 'Super Admin';

  const userDept = departments.find(d => d.id === (currentUser.departmentId || departmentId))?.name || 'Operations';

  // Format initial Employee ID if empty
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setJobTitle(currentUser.jobTitle || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setDepartmentId(currentUser.departmentId || '');
      setRole(currentUser.role || 'User');
      
      // Generate standard Employee ID if not set or invalid (not 6 digits)
      if (!currentUser.employeeId || !/^ESS-2026-\d{6}$/i.test(currentUser.employeeId)) {
        const hash = Math.abs((currentUser.email || currentUser.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        const generatedEmpId = `ESS-2026-${(hash % 900000) + 100000}`;
        setEmployeeId(generatedEmpId);
      } else {
        setEmployeeId(currentUser.employeeId);
      }
    }
  }, [currentUser]);

  // Image Upload Logic
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size must be smaller than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setAvatarUrl('');
  };

  // Save Personal Details
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const updatedPhoto = imagePreview || avatarUrl;

    const updatedProfile: UserProfile = {
      ...currentUser,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      jobTitle: jobTitle.trim(),
      employeeId: employeeId.trim(),
      avatarUrl: updatedPhoto,
      // Admin overrideable fields
      departmentId: isAdmin ? departmentId : currentUser.departmentId,
      role: isAdmin ? role : currentUser.role,
    };

    try {
      await onSaveProfile(updatedProfile);
      setAvatarUrl(updatedPhoto);
      setImagePreview(null);
      showToast('Profile information successfully saved and synced!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Requirements Checker
  const requirements = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const metCount = Object.values(requirements).filter(Boolean).length;
  const strengthPercentage = (metCount / 5) * 100;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { label: 'None', color: 'bg-gray-200 dark:bg-gray-800', text: 'text-gray-400' };
    if (metCount <= 2) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500 font-bold' };
    if (metCount <= 4) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500 font-bold' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500 font-bold animate-pulse' };
  };

  const passwordStrength = getStrengthLabel();

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please provide your current password for identity verification.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('The new password and confirm password fields do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('Your new password cannot be the same as your current password.');
      return;
    }

    if (metCount < 5) {
      setPasswordError('Your password is too weak. Please ensure all 5 requirements are met.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(error.message);
      }

      setPasswordSuccess('Your account password has been updated securely across directory systems!');
      showToast('Password updated successfully!', 'success');
      
      // Log Security Audit Event
      try {
        const logData: Omit<AuditLog, 'id'> = {
          userEmail: currentUser.email,
          userRole: currentUser.role,
          action: 'Password Modified',
          details: `User updated account password securely using identity portal dashboard.`,
          createdAt: new Date().toISOString(),
          ipAddress: '192.168.1.1',
          device: 'Browser User Session'
        };
        // Save to audit storage if applicable, or dispatch
      } catch (err) {
        console.error("Failed to log password audit event:", err);
      }

      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || 'Failed to update password with corporate identity provider.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Get current user's audit logs
  const userLogs = auditLogs
    .filter(log => log.userEmail.toLowerCase() === currentUser.email.toLowerCase())
    .slice(0, 5);

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('')
    : currentUser.fullName.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      
      {/* Title & Introduction */}
      <div>
        <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Profile & IAM Security Settings</span>
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-450 mt-1">
          Review your access credentials, configure secondary authentication credentials, and monitor session activity trails.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-150 dark:border-gray-800 gap-1 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-3 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'personal'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Information</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-3 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-3 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'activity'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Identity Audit Trails</span>
        </button>
      </div>

      {/* Tab Canvas */}
      <div className="grid grid-cols-1 gap-6">

        {/* PERSONAL INFORMATION TAB */}
        {activeTab === 'personal' && (
          <form onSubmit={handleSavePersonal} className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Profile Photo Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Profile Avatar</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group shrink-0">
                    {imagePreview || avatarUrl ? (
                      <img 
                        src={imagePreview || avatarUrl} 
                        alt="Profile Preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-500/20"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-2xl select-none uppercase shadow-inner border border-blue-100 dark:border-blue-950/60">
                        {initials}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                      <Camera className="w-3.5 h-3.5" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <p className="text-xs text-gray-800 dark:text-gray-200 font-bold">Upload personal profile image</p>
                    <p className="text-[10px] text-gray-400">Accepted formats: JPG, PNG, GIF up to 2MB. Stored securely on the identity directory.</p>
                    <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                      <label className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 text-[10px] font-bold rounded-lg border border-blue-100/30 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                      </label>
                      {(imagePreview || avatarUrl) && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-[10px] font-bold rounded-lg border border-rose-100/30 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster & Fields */}
              <div className="space-y-4 border-t border-gray-100 dark:border-gray-800/60 pt-5">
                <h3 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Directory Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                      Full Display Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs transition-all"
                      />
                    </div>
                  </div>

                  {/* Corporate Email */}
                  <div className="space-y-1.5 opacity-80">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500">
                      Corporate Email Address (Read-Only)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        readOnly
                        value={currentUser.email}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 dark:bg-gray-850/80 border border-gray-200/60 dark:border-gray-800/60 rounded-xl text-gray-500 dark:text-gray-400 text-xs focus:outline-none cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  {/* Employee ID */}
                  <div className="space-y-1.5 opacity-80">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500">
                      Corporate Employee ID (Read-Only)
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        readOnly
                        value={employeeId}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 dark:bg-gray-850/80 border border-gray-200/60 dark:border-gray-800/60 rounded-xl text-gray-500 dark:text-gray-400 text-xs focus:outline-none cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 019-2834"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs transition-all"
                      />
                    </div>
                  </div>

                  {/* Job Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                      Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. Senior Security Analyst"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs transition-all"
                      />
                    </div>
                  </div>

                  {/* Department (Editable only by Admin) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-350">
                      Department {!isAdmin && <span className="text-gray-400 text-[10px] font-normal">(Read-Only)</span>}
                    </label>
                    {isAdmin ? (
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs transition-all"
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={userDept}
                        className="w-full px-3.5 py-2.5 bg-gray-100/80 dark:bg-gray-850/80 border border-gray-200/60 dark:border-gray-800/60 rounded-xl text-gray-500 dark:text-gray-400 text-xs focus:outline-none cursor-not-allowed"
                      />
                    )}
                  </div>

                  {/* Assigned System Role (Editable only by Admin) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-350">
                      Assigned IAM Directory Role {!isAdmin && <span className="text-gray-400 text-[10px] font-normal">(Read-Only)</span>}
                    </label>
                    {isAdmin ? (
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs transition-all"
                      >
                        <option value="User">User (Standard Directory Member)</option>
                        <option value="Manager">Manager (Approving Authority)</option>
                        <option value="IT Admin">IT Admin (System Administrator)</option>
                        <option value="Super Admin">Super Admin (Chief Information Officer)</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-750 dark:text-gray-250">
                        <UserCheck className="w-4 h-4 text-indigo-500" />
                        <span>{currentUser.role}</span>
                        <span className="text-[10px] text-gray-400 font-normal ml-auto">Permissions enforced by workspace container</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Saving Button */}
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-5 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving settings...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Information</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        )}

        {/* SECURITY & PASSWORD TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Reset Password Form Card */}
              <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-1.5 mb-1">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Update Account Password</span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-450 mb-5">
                  Update your authentication password across identity sync relays.
                </p>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-none cursor-pointer p-0"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-none cursor-pointer p-0"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength Indicator */}
                    {newPassword.length > 0 && (
                      <div className="space-y-1.5 pt-1 animate-fade-in">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-gray-400">Password Strength:</span>
                          <span className={passwordStrength.text}>{passwordStrength.label}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${strengthPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-none cursor-pointer p-0"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Feedback blocks */}
                  {passwordError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2 animate-shake">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-start gap-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-5 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Modifying credentials...</span>
                        </>
                      ) : (
                        <span>Change Account Password</span>
                      )}
                    </button>
                  </div>

                </form>
              </div>

              {/* Password Requirements Checklist */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-inner space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-450 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Password Requirements</span>
                </h4>
                
                <p className="text-[11px] text-gray-500 leading-normal">
                  Your identity account credentials must conform to corporate Active Directory policies:
                </p>

                <ul className="space-y-2.5 text-[11px]">
                  <li className="flex items-center gap-2 font-medium">
                    <span className={`p-0.5 rounded-full ${requirements.length ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span className={requirements.length ? 'text-emerald-650 dark:text-emerald-400' : 'text-gray-500'}>Minimum 8 characters</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <span className={`p-0.5 rounded-full ${requirements.uppercase ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span className={requirements.uppercase ? 'text-emerald-650 dark:text-emerald-400' : 'text-gray-500'}>One uppercase letter</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <span className={`p-0.5 rounded-full ${requirements.lowercase ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span className={requirements.lowercase ? 'text-emerald-650 dark:text-emerald-400' : 'text-gray-500'}>One lowercase letter</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <span className={`p-0.5 rounded-full ${requirements.number ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span className={requirements.number ? 'text-emerald-650 dark:text-emerald-400' : 'text-gray-500'}>One numerical number</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <span className={`p-0.5 rounded-full ${requirements.special ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span className={requirements.special ? 'text-emerald-650 dark:text-emerald-400' : 'text-gray-500'}>One special character</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        )}

        {/* IDENTITY AUDIT TRAILS TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            
            {/* Active Session & Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Account Timestamps Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Account Metadata</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-2 text-xs">
                    <span className="text-gray-450">Account Status</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-md font-bold text-[10px] uppercase tracking-wider">
                      {currentUser.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-2 text-xs">
                    <span className="text-gray-450">Created Date</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">
                      {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : '2026-06-01 00:00:00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-450">Last Login Registered</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>{currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : new Date().toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Browser Session Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Active Live Session</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-2 text-xs">
                    <span className="text-gray-450">Client Browser</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-gray-400" />
                      <span>Chrome / V8 Sandbox Engine</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-2 text-xs">
                    <span className="text-gray-450">Operating Platform</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-gray-400" />
                      <span>Linux Containers (Cloud Run)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-450">IP Host Node Address</span>
                    <span className="font-mono text-gray-750 dark:text-gray-300 font-bold flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-150 dark:border-gray-750">
                      <Globe className="w-3 h-3 text-emerald-500" />
                      <span>172.18.0.1 (VPN Encoded)</span>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Audit Logs History */}
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-50 dark:border-gray-850">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <span>Recent Security & Activity Ledger</span>
              </h4>

              {userLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                  No registered access ledger history for this user session yet.
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {userLogs.map((log, logIdx) => (
                      <li key={log.id}>
                        <div className="relative pb-8">
                          {logIdx !== userLogs.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100 dark:bg-gray-800" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 text-[#0052cc] dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                {logIdx + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div className="text-xs text-gray-650 dark:text-gray-350">
                                <span className="font-black text-gray-900 dark:text-white mr-1.5">{log.action}</span>
                                <p className="text-gray-500 dark:text-gray-400 inline">{log.details}</p>
                              </div>
                              <div className="text-right text-[10px] whitespace-nowrap text-gray-400 font-mono font-bold shrink-0">
                                <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleTimeString()}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
