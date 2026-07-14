import React, { useState } from 'react';
import { AccessRequest, ApprovalAction, UserProfile, Department } from '../types';
import { ClipboardCheck, Users, HelpCircle, CheckCircle, Search, Filter, MessageSquare, ArrowUpRight, BarChart2, CheckSquare, Clock, AlertTriangle, Compass } from 'lucide-react';
import HighlightText from './HighlightText';
import SearchInput from './SearchInput';
import SharedDashboardContainer from './SharedDashboardContainer';
import PublicTrackRequest from './PublicTrackRequest';

interface ManagerDashboardProps {
  requests: AccessRequest[];
  departments: Department[];
  currentUser?: UserProfile | null;
  onSelectRequest: (request: AccessRequest) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onBulkWorkflowAction?: (requestIds: string[], action: 'Approve' | 'Reject', comments: string) => void;
}

export default function ManagerDashboard({ 
  requests: rawRequests, 
  departments,
  currentUser,
  onSelectRequest,
  searchTerm: externalSearchTerm,
  onSearchChange: externalOnSearchChange,
  onBulkWorkflowAction
}: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'track'>('pending');
  const requests = React.useMemo(() => {
    const arr = Array.isArray(rawRequests) ? rawRequests.filter(Boolean) : [];
    if (!currentUser) return arr;
    // If the user has a Manager role, filter to their department or assigned requests
    if (currentUser.role === 'Manager' || currentUser.role === 'Department Manager') {
      return arr.filter(r => {
        const isSameDept = r.departmentId === currentUser.departmentId;
        const isAssignedToMe = 
          (r.manager && r.manager.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim()) ||
          (r.currentApprover && r.currentApprover.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim()) ||
          (r.userEmail && r.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
        return isSameDept || isAssignedToMe;
      });
    }
    return arr;
  }, [rawRequests, currentUser]);

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  
  // Selection states for bulk processing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkComment, setBulkComment] = useState('');

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
  const setSearchTerm = externalOnSearchChange !== undefined ? externalOnSearchChange : setLocalSearchTerm;

  // Requests that require Manager Review (Submitted, Under Review, Pending status, or Pending Department Approval)
  const pendingApprovals = requests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending' || r.status === 'Pending Department Approval');
  // Team requests includes everything that has progressed past Draft
  const teamRequests = requests.filter(r => r.status !== 'Draft');

  // Stats
  const totalTeamRequests = teamRequests.length;
  const pendingCount = pendingApprovals.length;
  const approvedCount = teamRequests.filter(r => r.status === 'Completed' || r.status === 'Approved').length;
  const rejectedCount = teamRequests.filter(r => r.status === 'Rejected').length;
  const successRatio = totalTeamRequests > 0 ? Math.round((approvedCount / (approvedCount + rejectedCount || 1)) * 100) : 0;

  const filteredPending = React.useMemo(() => {
    const filtered = pendingApprovals.filter(req => {
      const titleStr = req.title || '';
      const userFullNameStr = req.userFullName || '';
      const systemNameStr = req.systemName || '';
      const searchStr = searchTerm || '';
      const matchesSearch = titleStr.toLowerCase().includes(searchStr.toLowerCase()) || 
                            userFullNameStr.toLowerCase().includes(searchStr.toLowerCase()) ||
                            systemNameStr.toLowerCase().includes(searchStr.toLowerCase());
      const matchesPriority = priorityFilter === 'All' || req.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority-desc') {
        const priorityScore: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const scoreA = priorityScore[a.priority] || 0;
        const scoreB = priorityScore[b.priority] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'priority-asc') {
        const priorityScore: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const scoreA = priorityScore[a.priority] || 0;
        const scoreB = priorityScore[b.priority] || 0;
        if (scoreA !== scoreB) return scoreA - scoreB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }, [pendingApprovals, searchTerm, priorityFilter, sortBy]);

  const isAllSelected = filteredPending.length > 0 && filteredPending.every(req => selectedIds.includes(req.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredPendingIds = filteredPending.map(req => req.id);
      setSelectedIds(prev => prev.filter(id => !filteredPendingIds.includes(id)));
    } else {
      const filteredPendingIds = filteredPending.map(req => req.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredPendingIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkActionSubmit = (action: 'Approve' | 'Reject') => {
    if (onBulkWorkflowAction && selectedIds.length > 0) {
      const commentToUse = bulkComment.trim() || `Sponsoring manager bulk ${action.toLowerCase()}d access requests.`;
      const validPendingIds = pendingApprovals.map(r => r.id);
      const idsToProcess = selectedIds.filter(id => validPendingIds.includes(id));
      if (idsToProcess.length > 0) {
        onBulkWorkflowAction(idsToProcess, action, commentToUse);
      }
      setSelectedIds([]);
      setBulkComment('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200';
      case 'High': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200';
      case 'Critical': return 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 animate-pulse';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const breadcrumbs = [
    { label: 'ESS Access Portal', active: false },
    { label: 'Workspace', active: false },
    { label: 'Manager Approvals', active: true }
  ];

  return (
    <SharedDashboardContainer
      title="Manager Approval Dashboard"
      subtitle="Review systems privileges, enforce enterprise security rules, and inspect audit activity trail."
      breadcrumbItems={breadcrumbs}
    >

      {/* Analytical Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat item */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Approvals</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{pendingCount}</div>
            <div className="text-[10px] text-gray-500">Requires review actions</div>
          </div>
        </div>

        {/* Stat item */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approved Access</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{approvedCount}</div>
            <div className="text-[10px] text-gray-500">Authorized for deployment</div>
          </div>
        </div>

        {/* Stat item */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rejected Requests</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{rejectedCount}</div>
            <div className="text-[10px] text-gray-500">Revoked / Disallowed access</div>
          </div>
        </div>

        {/* Stat item */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approval Success Rate</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{successRatio}%</div>
            <div className="text-[10px] text-gray-500">Compliance security success</div>
          </div>
        </div>
      </div>

      {/* Main Approval Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending approvals panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-1 p-1 bg-gray-50 dark:bg-gray-850 rounded-xl self-start">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pending');
                  setSearchTerm('');
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Incoming Queue ({filteredPending.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('track');
                  setSearchTerm('');
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'track'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Track Request Tool</span>
              </button>
            </div>

            {activeTab !== 'track' && (
              <div className="flex items-center gap-2 flex-wrap">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Filter by title or user..."
                  id="manager-dashboard-search"
                  containerClassName="w-full sm:w-52 md:w-60"
                />

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="All">All Priority</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-[11px] text-gray-700 dark:text-gray-300 focus:outline-none font-medium"
                  title="Sort by"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="priority-desc">Priority: High to Low</option>
                  <option value="priority-asc">Priority: Low to High</option>
                  <option value="status">Status: Alphabetical</option>
                </select>
              </div>
            )}
          </div>

          {/* Bulk comment and buttons overlay option */}
          {activeTab === 'pending' && selectedIds.length > 0 && (
            <div className="bg-blue-50/70 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-blue-600 text-white font-extrabold text-xs w-6 h-6 rounded-full shadow-xs shrink-0 select-none">
                  {selectedIds.length}
                </span>
                <div>
                  <div className="text-xs font-bold text-gray-950 dark:text-gray-100">Bulk processing {selectedIds.length} pending {selectedIds.length === 1 ? 'request' : 'requests'}</div>
                  <div className="text-[10px] text-gray-400">Provide an optional justification/comments to apply to all selected items to proceed.</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Bulk action comments / justification..."
                  value={bulkComment}
                  onChange={(e) => setBulkComment(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 sm:w-64"
                />
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleBulkActionSubmit('Approve')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    Bulk Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkActionSubmit('Reject')}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    Bulk Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-350 font-medium text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100 dark:divide-gray-800/60 overflow-y-auto max-h-[600px] p-2">
            {activeTab === 'track' ? (
              <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner">
                <PublicTrackRequest 
                  departments={departments}
                  onBack={() => setActiveTab('pending')}
                  embedded={true}
                />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                <ClipboardCheck className="w-10 h-10 text-gray-300 animate-bounce" />
                <div className="font-semibold text-gray-500">Inbox fully approved!</div>
                <div className="text-xs text-gray-400">All requested user team credentials processed.</div>
              </div>
            ) : filteredPending.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-650" />
                <div className="font-semibold text-gray-500 dark:text-gray-400 font-sans">No results found</div>
                <div className="text-xs text-gray-400">No requests match your current search queries or priority.</div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPriorityFilter('All');
                    setSortBy('date-desc');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow"
                >
                  Clear search & filters
                </button>
              </div>
            ) : (
              filteredPending.map(req => {
                const isSelected = selectedIds.includes(req.id);
                return (
                  <div 
                    key={req.id} 
                    className={`p-5 hover:bg-gray-55/60 dark:hover:bg-gray-800/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Control Checkbox */}
                      <div className="pt-1 flex items-center shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(req.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                            {req.id}
                          </span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(req.priority)}`}>
                            {req.priority}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            <HighlightText text={req.accessType} search={searchTerm} />
                          </span>

                          {(() => {
                            const createdTime = new Date(req.createdAt);
                            const now = new Date();
                            const isOverdue = (req.status === 'Submitted' || req.status === 'Under Review') && 
                              (now.getTime() - createdTime.getTime()) > (48 * 60 * 60 * 1000);
                            return isOverdue ? (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 flex items-center gap-1 shrink-0 select-none animate-pulse">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Pending &gt; 48h (Auto-Reminder)</span>
                              </span>
                            ) : null;
                          })()}
                        </div>

                        <h3 className="font-bold text-sm text-gray-950 dark:text-white leading-tight">
                          <HighlightText text={req.title} search={searchTerm} />
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Requester: <strong className="text-gray-700 dark:text-gray-300 font-medium"><HighlightText text={req.userFullName} search={searchTerm} /></strong></span>
                          <span>•</span>
                          <span>System: <strong className="text-gray-700 dark:text-gray-300 font-medium"><HighlightText text={req.systemName} search={searchTerm} /></strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className="btn-primary-minimal text-xs font-bold shrink-0 self-start sm:self-auto px-4 py-2"
                    >
                      <span>Assess & Decelerate</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column - Team Approval Metrics */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <BarChart2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">Approval Distribution</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Completed Approvals</span>
                <span className="font-bold text-gray-900 dark:text-white">{approvedCount}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalTeamRequests > 0 ? (approvedCount / totalTeamRequests) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Rejected / Denied Requests</span>
                <span className="font-bold text-gray-900 dark:text-white">{rejectedCount}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalTeamRequests > 0 ? (rejectedCount / totalTeamRequests) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Pending Processing State</span>
                <span className="font-bold text-gray-900 dark:text-white">{pendingCount}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalTeamRequests > 0 ? (pendingCount / totalTeamRequests) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-auto space-y-1.5">
            <div className="font-bold text-gray-950 dark:text-white">Security compliance rule:</div>
            <div>All requested database, VPN, and system console privileges require explicit business validation. Ensure justifications mention current projects and security directives.</div>
          </div>
        </div>

      </div>

    </SharedDashboardContainer>
  );
}
