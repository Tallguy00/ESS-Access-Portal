import React, { useState } from 'react';
import { AccessRequest, AuditLog, SupportTicket } from '../types';
import { FolderUp, ShieldCheck, Activity, PlusCircle, Search, Filter, ShieldAlert, CheckCircle, Clock, XCircle, ArrowUpRight } from 'lucide-react';
import HighlightText from './HighlightText';
import SearchInput from './SearchInput';
import SharedDashboardContainer from './SharedDashboardContainer';

interface UserDashboardProps {
  requests: AccessRequest[];
  userEmail: string;
  onOpenCreateModal: () => void;
  onSelectRequest: (request: AccessRequest) => void;
  auditLogs: AuditLog[];
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  tickets?: SupportTicket[];
}

export default function UserDashboard({ 
  requests: rawRequests, 
  userEmail, 
  onOpenCreateModal, 
  onSelectRequest, 
  auditLogs: rawAuditLogs,
  searchTerm: externalSearchTerm,
  onSearchChange: externalOnSearchChange,
  tickets = []
}: UserDashboardProps) {
  const requests = Array.isArray(rawRequests) ? rawRequests.filter(Boolean) : [];
  const auditLogs = Array.isArray(rawAuditLogs) ? rawAuditLogs.filter(Boolean) : [];
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
  const setSearchTerm = externalOnSearchChange !== undefined ? externalOnSearchChange : setLocalSearchTerm;

  // Filter requests for currently logged in user (case-insensitively)
  const userRequests = requests.filter(req => req.userEmail?.toLowerCase().trim() === userEmail?.toLowerCase().trim());
  const userLogs = auditLogs.filter(log => log.userEmail?.toLowerCase().trim() === userEmail?.toLowerCase().trim());

  const userTickets = Array.isArray(tickets)
    ? tickets.filter(t => t.userEmail?.toLowerCase().trim() === userEmail?.toLowerCase().trim())
    : [];

  const requestIssues = userRequests.filter(req => 
    req.status === 'Rejected' || 
    req.status === 'Under Review' || 
    (req.commentsHistory && req.commentsHistory.some(c => c.authorRole === 'IT Admin' || c.authorRole === 'IT Support'))
  );

  const activeCount = userRequests.filter(r => ['Submitted', 'Under Review', 'Approved', 'Pending Department Approval', 'Pending IT Approval'].includes(r.status)).length;
  const approvedCount = userRequests.filter(r => r.status === 'Completed').length;
  const rejectedCount = userRequests.filter(r => r.status === 'Rejected').length;

  const filteredRequests = React.useMemo(() => {
    const filtered = userRequests.filter(req => {
      const titleStr = req.title || '';
      const systemNameStr = req.systemName || '';
      const accessTypeStr = req.accessType || '';
      const searchStr = searchTerm || '';
      const matchesSearch = titleStr.toLowerCase().includes(searchStr.toLowerCase()) || 
                            systemNameStr.toLowerCase().includes(searchStr.toLowerCase()) ||
                            accessTypeStr.toLowerCase().includes(searchStr.toLowerCase());
      
      if (statusFilter === 'All') return matchesSearch;
      if (statusFilter === 'Active') return matchesSearch && ['Submitted', 'Under Review', 'Approved', 'Pending Department Approval', 'Pending IT Approval'].includes(req.status);
      return matchesSearch && req.status === statusFilter;
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
  }, [userRequests, searchTerm, statusFilter, sortBy]);

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'Low': return 'bg-green-50 text-green-700 border-green-150 dark:bg-green-950/40 dark:text-green-450 dark:border-green-900/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded border';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded border';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-150 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded border';
      case 'Critical': return 'bg-red-50 text-red-700 border-red-150 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded border animate-pulse';
      default: return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft': return 'badge-review';
      case 'Submitted': return 'badge-pending';
      case 'Under Review': return 'badge-review';
      case 'Approved': return 'badge-approved';
      case 'Rejected': return 'badge-rejected';
      case 'Completed': return 'badge-approved';
      case 'Pending': 
      case 'Pending Department Approval':
      case 'Pending IT Approval':
        return 'badge-pending';
      default: return 'badge-review';
    }
  };

  const breadcrumbs = [
    { label: 'ESS Access Portal', active: false },
    { label: 'Workspace', active: false },
    { label: 'Employee Access Workspace', active: true }
  ];

  const headerAction = (
    <button
      id="btn-trigger-request"
      onClick={onOpenCreateModal}
      className="btn-primary-minimal shrink-0"
    >
      <PlusCircle className="w-4 h-4" />
      <span>New Access Request</span>
    </button>
  );

  return (
    <SharedDashboardContainer
      title="Employee Access Workspace"
      subtitle="Submit, monitor, and audit your organization security and systems access permissions."
      breadcrumbItems={breadcrumbs}
      action={headerAction}
    >

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active reqs card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Requests</div>
            <div className="text-2xl font-black text-gray-950 dark:text-white mt-1">{activeCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Pending security approval loop</div>
          </div>
        </div>

        {/* Approved reqs card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved & Active Access</div>
            <div className="text-2xl font-black text-gray-950 dark:text-white mt-1">{approvedCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Permissions written to IAM system</div>
          </div>
        </div>

        {/* Rejected reqs card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rejected Requests</div>
            <div className="text-2xl font-black text-gray-950 dark:text-white mt-1">{rejectedCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Access denied or revision requested</div>
          </div>
        </div>
      </div>

      {/* IT Admin Assigned Issues & Request Clarifications Panel */}
      <div id="it-assigned-issues-panel" className="bg-gradient-to-r from-red-50/20 to-amber-50/20 dark:from-red-950/10 dark:to-amber-950/5 border border-red-100/50 dark:border-red-900/20 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-red-150/20 dark:border-red-900/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950 dark:text-white">IT Admin Assigned Issues & Clarifications</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Access request issues, rejections, or ticket assignments requiring your review.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-red-100/60 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded font-bold uppercase tracking-wider">
            {requestIssues.length + userTickets.length} Actionable Items
          </span>
        </div>

        {requestIssues.length === 0 && userTickets.length === 0 ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs italic flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>All credentials, active access privileges, and support issues are fully resolved. No action required.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Access Request Issues */}
            {requestIssues.map(req => {
              const latestAdminComment = req.commentsHistory && [...req.commentsHistory]
                .reverse()
                .find(c => c.authorRole === 'IT Admin' || c.authorRole === 'IT Support' || c.authorRole === 'Manager');

              return (
                <div key={`issue-${req.id}`} className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-red-200 dark:hover:border-red-900/40 transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {req.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'Rejected' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {req.status === 'Rejected' ? 'Rejected' : 'Clarification Required'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-gray-950 dark:text-white truncate" title={req.title}>
                      {req.title}
                    </h4>

                    <p className="text-[11px] text-gray-500 dark:text-gray-450">
                      System: <strong className="text-gray-700 dark:text-gray-300 font-medium">{req.systemName}</strong>
                    </p>

                    {latestAdminComment ? (
                      <div className="mt-2 p-2.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-lg">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-400 mb-1">
                          <span>Feedback from {latestAdminComment.authorName} ({latestAdminComment.authorRole}):</span>
                        </div>
                        <p className="text-[10px] italic text-gray-600 dark:text-gray-350 leading-normal line-clamp-2">
                          "{latestAdminComment.text}"
                        </p>
                      </div>
                    ) : req.comments ? (
                      <div className="mt-2 p-2.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-lg">
                        <p className="text-[10px] italic text-gray-600 dark:text-gray-350 leading-normal line-clamp-2">
                          "{req.comments}"
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-gray-50 dark:border-gray-800/60">
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                    >
                      <span>Update & Resubmit</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Support Tickets (Issues) Assigned */}
            {userTickets.map(ticket => (
              <div key={`ticket-issue-${ticket.id}`} className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-blue-200 dark:hover:border-blue-900/40 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {ticket.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      ticket.status === 'Open' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40' 
                        : ticket.status === 'In Progress' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-gray-950 dark:text-white truncate" title={ticket.subject}>
                    {ticket.subject}
                  </h4>

                  <div className="flex items-center gap-1 text-[10px] text-gray-450 dark:text-gray-400">
                    <span>Category: <strong className="font-semibold text-gray-650 dark:text-gray-300">{ticket.category}</strong></span>
                    <span>•</span>
                    <span className={`font-bold ${
                      ticket.priority === 'High' ? 'text-rose-500' : 'text-gray-450'
                    }`}>Priority: {ticket.priority}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="w-5.5 h-5.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[9px] uppercase">
                      {ticket.assignedToName ? ticket.assignedToName[0] : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-gray-400 leading-none">Assigned Support Agent / IT Admin</div>
                      <div className="text-[10px] font-bold text-gray-800 dark:text-gray-250 truncate mt-0.5">
                        {ticket.assignedToName || 'Awaiting IT Admin Allocation'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-gray-50 dark:border-gray-800/60">
                  <span className="text-[10px] text-gray-400">
                    SLA Support Ticket Escalated
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Request Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - list of requests */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-gray-950 dark:text-white">Your Submission History</h2>
            
            {/* Search & filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Filter requests..."
                id="user-dashboard-search"
                containerClassName="w-full sm:w-56 md:w-64"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Loop</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-[11px] text-gray-700 dark:text-gray-300 focus:outline-none font-medium"
                title="Sort by"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="priority-desc">Priority: High to Low</option>
                <option value="priority-asc">Priority: Low to High</option>
                <option value="status">Status: Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/60 overflow-y-auto max-h-[500px]">
            {userRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                <FolderUp className="w-10 h-10 text-gray-300 animate-bounce" />
                <div className="font-semibold text-gray-500">No requests found</div>
                <div className="text-xs">Submit a request above to initialize privileges.</div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                <div className="font-semibold text-gray-500 dark:text-gray-400">No results found</div>
                <div className="text-xs text-gray-400">No requests match your current search queries or filters.</div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setSortBy('date-desc');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow"
                >
                  Clear search & filters
                </button>
              </div>
            ) : (
              filteredRequests.map(req => (
                <div 
                  key={req.id} 
                  className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400 font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {req.id}
                      </span>
                      <span className={getPriorityBadge(req.priority)}>
                        {req.priority}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <HighlightText text={req.accessType} search={searchTerm} />
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-gray-950 dark:text-white leading-snug">
                      <HighlightText text={req.title} search={searchTerm} />
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>System: <strong className="text-gray-600 dark:text-gray-300 font-medium"><HighlightText text={req.systemName} search={searchTerm} /></strong></span>
                      <span>•</span>
                      <span>Created {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-center shrink-0 ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className="btn-secondary-minimal py-1.5 px-3 text-xs shrink-0"
                    >
                      <span>Review Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column - personal activities log */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">Active Activity Feed</h2>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[420px]">
            {userLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs italic">
                No recent workspace operations recorded.
              </div>
            ) : (
              userLogs.map(log => (
                <div key={log.id} className="relative flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-800 dark:text-gray-200">
                      {log.action}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      {log.details}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </SharedDashboardContainer>
  );
}
