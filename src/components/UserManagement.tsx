import React, { useState } from 'react';
import { UserProfile, UserRole, Department } from '../types';
import { UserPlus, Search, Edit2, ShieldAlert, KeyRound, CheckCircle, XCircle, Trash2, ShieldCheck, Mail, Building, Phone } from 'lucide-react';
import HighlightText from './HighlightText';
import SearchInput from './SearchInput';

interface UserManagementProps {
  profiles: UserProfile[];
  departments: Department[];
  onUpdateRole: (userId: string, role: UserRole) => void;
  onUpdateStatus: (userId: string, status: 'Active' | 'Deactivated') => void;
  onCreateUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  onResetPassword: (userEmail: string) => void;
  currentUserRole?: UserRole;
}

export default function UserManagement({
  profiles: rawProfiles,
  departments: rawDepartments,
  onUpdateRole,
  onUpdateStatus,
  onCreateUser,
  onResetPassword,
  currentUserRole = 'User'
}: UserManagementProps) {
  const profiles = Array.isArray(rawProfiles) ? rawProfiles.filter(Boolean) : [];
  const departments = Array.isArray(rawDepartments) ? rawDepartments.filter(Boolean) : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Registration form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('User');
  const [newDept, setNewDept] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filteredProfiles = profiles.filter(user => {
    const fullNameStr = user.fullName || '';
    const emailStr = user.email || '';
    const searchStr = searchTerm || '';
    const matchesSearch = fullNameStr.toLowerCase().includes(searchStr.toLowerCase()) ||
                          emailStr.toLowerCase().includes(searchStr.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColorBadge = (role: UserRole) => {
    switch (role) {
      case 'User': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'Manager': return 'bg-blue-150 text-blue-850 dark:bg-blue-900/30 dark:text-blue-400 font-semibold';
      case 'IT Admin': return 'bg-indigo-150 text-indigo-850 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold';
      case 'Super Admin': return 'bg-red-150 text-red-850 dark:bg-red-900/30 dark:text-red-400 font-extrabold border border-red-200/50';
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newDept) return;
    
    onCreateUser({
      fullName: newFullName,
      email: newEmail,
      role: currentUserRole === 'Super Admin' ? newRole : 'User',
      departmentId: newDept,
      status: 'Active',
      mfaEnabled: true
    });

    setSuccessMsg(`User ${newFullName} successfully added to database.`);
    setNewFullName('');
    setNewEmail('');
    setNewRole('User');
    setNewDept('');
    setTimeout(() => {
      setSuccessMsg('');
      setShowCreateForm(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Identity & User Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Assign organization roles, toggle secure credentials, reset security passwords, and track MFA status.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary-minimal shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Corporate Account</span>
        </button>
      </div>

      {/* Slide Drawer Account Creaton */}
      {showCreateForm && (
        <div className="p-6 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-4 max-w-xl transition-all">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Create New Corporate Resource Profile</span>
          </h2>

          {successMsg ? (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-700 rounded-xl text-xs font-semibold">
              {successMsg}
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-gray-600 dark:text-gray-400">Full Corporate Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. David Copperfield"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-600 dark:text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@ess.gov.et"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-600 dark:text-gray-400">Assign Security Role</label>
                {currentUserRole === 'Super Admin' ? (
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                  >
                    <option value="User">Employee / User</option>
                    <option value="Manager">Manager / Sponsoring Approver</option>
                    <option value="IT Admin">IT IAM Administrator</option>
                    <option value="Super Admin">Super Administrator</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="Employee / User (Adjustable by Super Admin)"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 font-semibold"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-600 dark:text-gray-400">Primary Department</label>
                <select
                  required
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <option value="">Select Dept</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 pt-2 flex justify-end gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary-minimal py-2 px-4 text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn-primary-minimal py-2 px-5 text-xs"
                >
                  Create Profile
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Directory Table layout */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Filters */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h2 className="text-base font-bold text-gray-950 dark:text-white">Active Identity Matrix</h2>
          
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search user email or name..."
              id="user-management-search"
              containerClassName="w-full sm:w-60 md:w-72"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="User">User</option>
              <option value="Manager">Manager</option>
              <option value="IT Admin">IT Admin</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-x-auto">
          <table className="table-standard divide-y divide-gray-150 dark:divide-gray-800 select-none">
            <thead>
              <tr className="table-header-row text-gray-400 font-bold uppercase tracking-wider">
                <th className="th-standard pl-6">Profile Owner</th>
                <th className="th-standard">Department & Info</th>
                <th className="th-standard">Assigned security role</th>
                <th className="th-standard">Status & MFA</th>
                <th className="th-standard pr-6 text-right">Actions Queue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
              {filteredProfiles.map(u => {
                const uDept = departments.find(d => d.id === u.departmentId)?.name || 'Operations';
                return (
                  <tr key={u.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-all">
                    
                    {/* User */}
                    <td className="td-standard pl-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden shrink-0 shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                          {u.avatarUrl ? (
                            <img 
                              src={u.avatarUrl} 
                              alt={u.fullName} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            u.fullName ? u.fullName.split(' ').map(n=>n[0]).join('') : ''
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white"><HighlightText text={u.fullName} search={searchTerm} /></div>
                          <div className="text-gray-400 flex items-center gap-1 mt-0.5 select-all">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span><HighlightText text={u.email} search={searchTerm} /></span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="td-standard">
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                        <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-bold">{uDept}</span>
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5">
                        <div className="text-[9px] text-gray-400 mt-0.5">Created {new Date(u.createdAt).toLocaleDateString()}</div>
                      </div>
                    </td>

                    {/* Role assignment */}
                    <td className="td-standard">
                      {currentUserRole === 'Super Admin' ? (
                        <select
                          value={u.role}
                          onChange={(e) => onUpdateRole(u.id, e.target.value as UserRole)}
                          className={`px-2.5 py-1 text-xs rounded-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold ${getRoleColorBadge(u.role)}`}
                        >
                          <option value="User">User / Employee</option>
                          <option value="Manager">Manager / Sponsoring Approver</option>
                          <option value="IT Admin">IT IAM Admin</option>
                          <option value="Super Admin">Super Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs rounded-full font-bold select-none inline-block ${getRoleColorBadge(u.role)}`}>
                          {u.role}
                        </span>
                      )}
                    </td>

                    {/* Status & MFA status */}
                    <td className="td-standard">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(u.id, u.status === 'Active' ? 'Deactivated' : 'Active')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            u.status === 'Active' 
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 hover:bg-green-150' 
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 hover:bg-red-150'
                          }`}
                        >
                          {u.status === 'Active' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Deactivated</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] bg-slate-50 dark:bg-slate-850 px-1.5 py-0.5 rounded border border-slate-150 dark:border-slate-800 text-slate-500 font-bold">
                          MFA ENFORCED
                        </span>
                      </div>
                    </td>

                    {/* Password reset trigger */}
                    <td className="td-standard pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => onResetPassword(u.email)}
                        className="btn-secondary-minimal py-1.5 px-2.5 text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 ml-auto"
                      >
                        <KeyRound className="w-3.5 h-3.5 shrink-0" />
                        <span>Force Reset Pass</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
