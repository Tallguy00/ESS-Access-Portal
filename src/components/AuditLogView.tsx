import React, { useState } from 'react';
import { AuditLog } from '../types';
import { ShieldCheck, Search, Filter, Monitor, Globe, Laptop, Smartphone, Key, RefreshCw } from 'lucide-react';
import SearchInput from './SearchInput';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export default function AuditLogView({ auditLogs: rawAuditLogs }: AuditLogViewProps) {
  const auditLogs = Array.isArray(rawAuditLogs) ? rawAuditLogs.filter(Boolean) : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [actionCategory, setActionCategory] = useState('All');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.ipAddress.includes(searchTerm);
    
    const matchesCategory = actionCategory === 'All' || 
                            (actionCategory === 'Logins' && log.action.includes('Login')) ||
                            (actionCategory === 'Approvals' && (log.action.includes('Approve') || log.action.includes('Grant'))) ||
                            (actionCategory === 'Rejections' && log.action.includes('Reject')) ||
                            (actionCategory === 'Requests' && log.action.includes('Submit'));

    return matchesSearch && matchesCategory;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('Reject') || action.includes('Deactivate')) {
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20';
    }
    if (action.includes('Approve') || action.includes('Grant') || action.includes('Complete')) {
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20';
    }
    if (action.includes('Login')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20';
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Enterprise Compliance Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable ledger tracking security operations, logins, access reviews, privilege grants, and role modifications.</p>
        </div>
      </div>

      {/* Main Ledger card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table top header */}
        <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">Active Cryptographic Log Ledger</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search audit trail..."
              id="audit-log-search"
              containerClassName="w-full sm:w-60 md:w-72"
            />

            <select
              value={actionCategory}
              onChange={(e) => setActionCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Logins">Logins & Auth</option>
              <option value="Approvals">Approvals & Grants</option>
              <option value="Rejections">Rejections</option>
              <option value="Requests">Requests Submitted</option>
            </select>
          </div>
        </div>

        {/* Real logs list */}
        <div className="overflow-x-auto">
          <table className="table-standard divide-y divide-gray-150 dark:divide-gray-800">
            <thead>
              <tr className="table-header-row text-gray-400 font-bold uppercase tracking-wider">
                <th className="th-standard pl-6">Operator & Role</th>
                <th className="th-standard">Action</th>
                <th className="th-standard">Operation Scope Details</th>
                <th className="th-standard">Networking Coordinates</th>
                <th className="th-standard pr-6">Date Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-850 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 font-sans italic">
                    No matching compliance logs found in the ledger.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/15 transition-all">
                    
                    {/* User */}
                    <td className="td-standard pl-6 font-sans">
                      <div className="font-bold text-gray-900 dark:text-white">{log.userEmail}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 uppercase">{log.userRole}</div>
                    </td>

                    {/* Action */}
                    <td className="td-standard font-sans">
                      <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] uppercase tracking-wide inline-block ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="td-standard text-gray-700 dark:text-gray-300 max-w-sm leading-relaxed font-sans text-xs">
                      {log.details}
                    </td>

                    {/* Connections */}
                    <td className="td-standard text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{log.ipAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] truncate max-w-[150px]">
                        {log.device?.toLowerCase().includes('mobile') || log.device?.toLowerCase().includes('android') || log.device?.toLowerCase().includes('ios') ? (
                          <Smartphone className="w-3 h-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Laptop className="w-3 h-3 text-blue-500 shrink-0" />
                        )}
                        <span className="truncate">{log.device}</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="td-standard pr-6 text-gray-400 text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
