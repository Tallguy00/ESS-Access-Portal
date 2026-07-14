import React, { useState } from 'react';
import { AccessRequest, UserProfile, Department, RequestStatus } from '../types';
import { ShieldAlert, Cpu, KeyRound, CheckSquare, Search, Lock, AlertTriangle, Play, CheckCircle, BarChart2, TrendingUp, Calendar as CalendarIcon, Download, FileSpreadsheet, Eye, FileText, Compass } from 'lucide-react';
import HighlightText from './HighlightText';
import SearchInput from './SearchInput';
import SharedDashboardContainer from './SharedDashboardContainer';
import PublicTrackRequest from './PublicTrackRequest';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

interface AdminDashboardProps {
  requests: AccessRequest[];
  profiles: UserProfile[];
  departments: Department[];
  onSelectRequest: (request: AccessRequest) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  theme?: 'light' | 'dark';
}

export default function AdminDashboard({ 
  requests: rawRequests, 
  profiles: rawProfiles, 
  departments: rawDepartments,
  onSelectRequest,
  searchTerm: externalSearchTerm,
  onSearchChange: externalOnSearchChange,
  theme = 'light'
}: AdminDashboardProps) {
  const requests = Array.isArray(rawRequests) ? rawRequests.filter(Boolean) : [];
  const profiles = Array.isArray(rawProfiles) ? rawProfiles.filter(Boolean) : [];
  const departments = Array.isArray(rawDepartments) ? rawDepartments.filter(Boolean) : [];

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [activeQueueTab, setActiveQueueTab] = useState<'approved' | 'all' | 'track'>('approved');

  const isDark = theme === 'dark';
  const gridStrokeColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#9ca3af';
  const yAxisLabelColor = isDark ? '#cbd5e1' : '#4b5563';

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
  const setSearchTerm = externalOnSearchChange !== undefined ? externalOnSearchChange : setLocalSearchTerm;

  // Requests source based on current active tab
  const displayedRequestsSource = React.useMemo(() => {
    return activeQueueTab === 'approved' 
      ? requests.filter(r => r.status === 'Approved' || r.status === 'Pending' || r.status === 'Pending IT Approval')
      : requests;
  }, [requests, activeQueueTab]);

  const approvedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'Pending' || r.status === 'Pending IT Approval');
  const totalRequestsCount = requests.length;
  const activeUsersCount = profiles.filter(p => p.status === 'Active').length;
  const completedCount = requests.filter(r => r.status === 'Completed').length;
  const criticalCount = requests.filter(r => r.priority === 'Critical' && r.status !== 'Completed').length;

  const filteredRequests = React.useMemo(() => {
    const filtered = displayedRequestsSource.filter(req => {
      const titleStr = req.title || '';
      const userFullNameStr = req.userFullName || '';
      const systemNameStr = req.systemName || '';
      const searchStr = searchTerm || '';
      return titleStr.toLowerCase().includes(searchStr.toLowerCase()) ||
             userFullNameStr.toLowerCase().includes(searchStr.toLowerCase()) ||
             systemNameStr.toLowerCase().includes(searchStr.toLowerCase());
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
  }, [displayedRequestsSource, searchTerm, sortBy]);

  // Generate the last 30 days of data for Recharts
  const chartData = React.useMemo(() => {
    const dates: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize the last 30 days with 0 counts
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., "Jun 22"
      dates[dateString] = 0;
    }

    // Populate counts from requests
    requests.forEach(req => {
      const reqDate = new Date(req.createdAt);
      const dateString = reqDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Only increment if the day falls within our 30-day window
      if (dates[dateString] !== undefined) {
        dates[dateString]++;
      }
    });

    // Convert map to Recharts-friendly array
    return Object.entries(dates).map(([date, count]) => ({
      date,
      count
    }));
  }, [requests]);

  // Insights derived from chartData
  const chartInsights = React.useMemo(() => {
    let total30Days = 0;
    let peakCount = 0;
    let peakDate = '';

    chartData.forEach(item => {
      total30Days += item.count;
      if (item.count > peakCount) {
        peakCount = item.count;
        peakDate = item.date;
      }
    });

    const averagePerDay = (total30Days / 30).toFixed(1);

    return {
      total30Days,
      averagePerDay,
      peakCount,
      peakDate: peakDate || 'None'
    };
  }, [chartData]);

  // Generate data for Requests by Department
  const departmentData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize all departments with 0 counts
    if (departments && departments.length > 0) {
      departments.forEach(dept => {
        counts[dept.name] = 0;
      });
    }

    requests.forEach(req => {
      const deptName = departments?.find(d => d.id === req.departmentId)?.name || req.departmentId || 'Unassigned';
      counts[deptName] = (counts[deptName] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [requests, departments]);

  // Generate data for Request Status Distribution
  const statusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const statuses: RequestStatus[] = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Completed'];
    
    statuses.forEach(status => {
      counts[status] = 0;
    });

    requests.forEach(req => {
      if (req.status) {
        counts[req.status] = (counts[req.status] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [requests]);

  const STATUS_COLORS: Record<string, string> = {
    'Draft': '#9ca3af',
    'Submitted': '#3b82f6',
    'Under Review': '#f59e0b',
    'Approved': '#8b5cf6',
    'Rejected': '#ef4444',
    'Completed': '#10b981',
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        'Request ID',
        'User Full Name',
        'User Email',
        'Target System Name',
        'Access Type',
        'Priority Level',
        'Current Status',
        'Justification Details',
        'Submission Timestamp',
        'Latest Auditor Notes'
      ];

      const escapeCSV = (val: string | undefined | null) => {
        if (val === undefined || val === null) return '';
        const formatted = val.toString().replace(/"/g, '""');
        return `"${formatted}"`;
      };

      const rows = requests.map(req => [
        escapeCSV(req.id),
        escapeCSV(req.userFullName),
        escapeCSV(req.userEmail),
        escapeCSV(req.systemName),
        escapeCSV(req.accessType),
        escapeCSV(req.priority),
        escapeCSV(req.status),
        escapeCSV(req.justification),
        escapeCSV(req.createdAt),
        escapeCSV(req.comments)
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Compliance_Access_Requests_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to compile compliance CSV', err);
    }
  };

  const breadcrumbs = [
    { label: 'ESS Access Portal', active: false },
    { label: 'Workspace', active: false },
    { label: 'IT Administration', active: true }
  ];

  const headerAction = (
    <button
      onClick={handleExportCSV}
      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
      id="export-admin-csv-btn"
      title="Download complete request log as CSV"
    >
      <FileSpreadsheet className="w-4 h-4 shrink-0" />
      <span>Export to CSV</span>
    </button>
  );

  return (
    <SharedDashboardContainer
      title="IT Privileges Administration"
      subtitle="Settle approved supervisor requests, monitor system connections, and audit security compliance."
      breadcrumbItems={breadcrumbs}
      action={headerAction}
    >

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl animate-pulse">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending IAM Grants</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{approvedRequests.length}</div>
            <div className="text-[10px] text-gray-500">Awaiting technical setup</div>
          </div>
        </div>

        {/* Metric */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Active Users</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{activeUsersCount}</div>
            <div className="text-[10px] text-gray-500">Enabled IAM accounts</div>
          </div>
        </div>

        {/* Metric */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Successful Requests</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{completedCount} / {totalRequestsCount}</div>
            <div className="text-[10px] text-gray-500">Requests granted</div>
          </div>
        </div>

        {/* Metric */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Critical Open Loop</div>
            <div className="text-xl font-black text-gray-950 dark:text-white">{criticalCount}</div>
            <div className="text-[10px] text-gray-500">Uncompleted critical requests</div>
          </div>
        </div>

      </div>

      {/* Daily Request Volume Trends Line Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                Access Requests Submission Volume
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full select-none">
                  Last 30 Days
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Continuous request tracking timeline to help identify load and seasonal spikes.</p>
            </div>
          </div>

          {/* Quick Insights Pills */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-center min-w-[70px]">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">30D Volume</div>
              <div className="text-sm font-black text-gray-900 dark:text-white mt-0.5 flex items-center justify-center gap-0.5">
                <TrendingUp className="w-3 h-3 text-blue-500 shrink-0" />
                <span>{chartInsights.total30Days}</span>
              </div>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-center min-w-[70px]">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Daily Avg</div>
              <div className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{chartInsights.averagePerDay}</div>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-center min-w-[70px]">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Peak Count</div>
              <div className="text-sm font-black text-gray-900 dark:text-white mt-0.5" title={`On ${chartInsights.peakDate}`}>
                {chartInsights.peakCount} <span className="text-[9px] font-normal text-gray-400">({chartInsights.peakDate})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStrokeColor} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} 
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                dx={-10}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-950 dark:bg-gray-900 p-3 rounded-xl border border-gray-800 dark:border-gray-750 shadow-xl font-sans text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-400 uppercase tracking-wider">
                          <CalendarIcon className="w-3 h-3 text-blue-500" />
                          <span>{label}</span>
                        </div>
                        <p className="text-sm font-black text-white mt-1.5">
                          {payload[0].value} {payload[0].value === 1 ? 'Request' : 'Requests'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 3, stroke: '#3b82f6', strokeWidth: 1, fill: '#ffffff' }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Insights: Department & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-955 dark:text-white">Requests by Department</h3>
              <p className="text-xs text-gray-400 mt-0.5">Frequency of privileges requested across business units.</p>
            </div>
          </div>
          
          <div className="w-full h-[240px] flex items-center justify-center">
            {departmentData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={departmentData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStrokeColor} />
                  <XAxis type="number" tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: yAxisLabelColor, fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-950 dark:bg-gray-900 p-2.5 rounded-xl border border-gray-800 shadow-xl text-white text-xs font-sans">
                            <span className="font-semibold block text-gray-400 mb-1">{payload[0].payload.name}</span>
                            <span className="font-bold text-sm text-white">{payload[0].value} {payload[0].value === 1 ? 'Request' : 'Requests'}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    {departmentData.map((entry, index) => {
                      const colors = ['#4f46e5', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-gray-400">No department request records found</span>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-955 dark:text-white">Request Status Distribution</h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time status breakdown across the authorization lifecycle.</p>
            </div>
          </div>

          <div className="w-full h-[240px] flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="40%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const total = statusData.reduce((acc, curr) => acc + curr.value, 0);
                        const percent = ((payload[0].value / total) * 100).toFixed(0);
                        return (
                          <div className="bg-gray-950 dark:bg-gray-900 p-2.5 rounded-xl border border-gray-800 shadow-xl text-white text-xs font-sans">
                            <span className="font-semibold block text-gray-400 mb-1">{payload[0].name}</span>
                            <span className="font-bold text-sm text-white">{payload[0].value} {payload[0].value === 1 ? 'Request' : 'Requests'} ({percent}%)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif', paddingLeft: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-gray-400">No status distribution records found</span>
            )}
          </div>
        </div>

      </div>

      {/* Admin Central Portal Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approved and Ready queue */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-1 p-1 bg-gray-50 dark:bg-gray-850 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => {
                    setActiveQueueTab('approved');
                    setSearchTerm('');
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeQueueTab === 'approved'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Action Required ({requests.filter(r => r.status === 'Approved' || r.status === 'Pending' || r.status === 'Pending IT Approval').length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQueueTab('all');
                    setSearchTerm('');
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeQueueTab === 'all'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All Requests ({requests.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQueueTab('track');
                    setSearchTerm('');
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    activeQueueTab === 'track'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Track Request Tool</span>
                </button>
              </div>

              {activeQueueTab !== 'track' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={activeQueueTab === 'approved' ? "Search action required..." : "Search all requests..."}
                    id="admin-dashboard-search"
                    containerClassName="w-full sm:w-52"
                  />

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
                    {activeQueueTab === 'all' && <option value="status">Status</option>}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h2 className="text-sm font-bold text-gray-950 dark:text-white">
                {activeQueueTab === 'approved' ? 'Action Required Queue' : activeQueueTab === 'track' ? 'Track Request Status' : 'All System Requests'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeQueueTab === 'approved'
                  ? 'Pending guest submissions or manager-approved requests waiting for review or provisioning.'
                  : activeQueueTab === 'track'
                  ? 'Input a request ID below to retrieve real-time verification progress, comments, and action updates.'
                  : 'Central administrative ledger tracking all submitted, under review, and completed requests.'}
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/60 overflow-y-auto max-h-[600px] p-2">
            {activeQueueTab === 'track' ? (
              <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner">
                <PublicTrackRequest 
                  departments={departments}
                  onBack={() => setActiveQueueTab('approved')}
                  embedded={true}
                />
              </div>
            ) : activeQueueTab === 'approved' && requests.filter(r => r.status === 'Approved' || r.status === 'Pending' || r.status === 'Pending IT Approval').length === 0 ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <div className="font-bold text-gray-900 dark:text-white">Access Provision Queue Empty!</div>
                <div className="text-xs text-gray-400">All manager authorization approvals have been deployed successfully.</div>
              </div>
            ) : activeQueueTab === 'all' && requests.length === 0 ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                <div className="font-bold text-gray-900 dark:text-white">No System Requests Found</div>
                <div className="text-xs text-gray-400">No access requests have been created in the sandbox registry yet.</div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-650" />
                <div className="font-semibold text-gray-500 dark:text-gray-400">No results found</div>
                <div className="text-xs text-gray-400">No requests match your current search queries or filters.</div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy('date-desc');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredRequests.map(req => (
                <div 
                  key={req.id} 
                  className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-black text-blue-600 dark:text-blue-400 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded">
                        {req.id}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                        req.priority === 'Critical' ? 'bg-red-50 text-red-650 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800'
                      }`}>
                        {req.priority}
                      </span>
                      <span className="text-xs text-blue-700 border border-blue-200 dark:border-blue-900/50 rounded px-1.5 font-bold">
                        <HighlightText text={req.accessType} search={searchTerm} />
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-950 dark:text-white leading-tight">
                      <HighlightText text={req.title} search={searchTerm} />
                    </h3>

                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5">
                      <div>Requester: <strong className="text-gray-900 dark:text-white font-medium"><HighlightText text={req.userFullName} search={searchTerm} /></strong></div>
                      <span>•</span>
                      <div>System: <strong className="text-gray-900 dark:text-white font-medium"><HighlightText text={req.systemName} search={searchTerm} /></strong></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status !== 'Approved' && (
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                        req.status === 'Completed' ? 'bg-green-50 text-green-750 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30' :
                        req.status === 'Rejected' ? 'bg-red-50 text-red-750 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' :
                        req.status === 'Under Review' ? 'bg-amber-50 text-amber-750 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' :
                        'bg-indigo-50 text-indigo-755 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                      }`}>
                        {req.status}
                      </span>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className={`text-xs font-bold shrink-0 px-4 py-2 rounded-xl text-white transition-all flex items-center space-x-1 ${
                        req.status === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700' :
                        req.status === 'Completed' ? 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700' :
                        req.status === 'Rejected' ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700' :
                        'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                      }`}
                    >
                      {req.status === 'Approved' ? (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Provision Credentials</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-white" />
                          <span>
                            {req.status === 'Completed' ? 'View Details' :
                             req.status === 'Rejected' ? 'View Rejection' : 'Inspect Request'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Alert Log Simulator */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Active Environment Security</h2>
          </div>

          <div className="space-y-3.5">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 rounded-xl flex gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 grow-0 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-red-850 dark:text-red-400">AWS Root Credential Attempt</div>
                <div className="text-red-700 dark:text-red-300">Jane Smith requested root credentials for AWS production database. Request flagged for investigation.</div>
                <div className="text-[10px] text-red-400">June 20, 2026 - 4 hours ago</div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-xl flex gap-3 text-xs">
              <AlertSquareNoCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 grow-0 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-850 dark:text-amber-400">Unencrypted DB Access Requested</div>
                <div className="text-amber-750 dark:text-amber-300">User billing analyst requested database connection without secure SSL key certs attached.</div>
                <div className="text-[10px] text-amber-400">June 19, 2026</div>
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/40 rounded-xl flex gap-3 text-xs">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 grow-0 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-green-850 dark:text-green-400">VPC Firewall Config Updated</div>
                <div className="text-green-750 dark:text-green-300">Remote VPN cluster restricted to pre-validated corporate IP subnets on the firewall layer.</div>
                <div className="text-[10px] text-green-400">June 18, 2026</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </SharedDashboardContainer>
  );
}

// Internal small helper icon representation for ease
const AlertSquareNoCheck = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={props.className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
