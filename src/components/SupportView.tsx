import React, { useState, useRef } from 'react';
import { UserProfile, Department, SupportTicket, TicketComment, UserRole } from '../types';
import { 
  Mail, Phone, Clock, PlusCircle, Search, Filter, CheckCircle2, 
  AlertCircle, MessageSquare, Paperclip, Shield, X, ChevronRight, 
  Send, UserCheck, Inbox, Info, HelpCircle, FileText, Check, 
  Trash2, AlertTriangle, MessageCircle, RefreshCw, Layers
} from 'lucide-react';
import SearchInput from './SearchInput';

interface SupportViewProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  departments: Department[];
  tickets: SupportTicket[];
  onAddTicket: (ticket: SupportTicket) => void;
  onUpdateTicket: (ticket: SupportTicket) => void;
  onOpenFAQ: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function SupportView({
  currentUser,
  profiles,
  departments,
  tickets,
  onAddTicket,
  onUpdateTicket,
  onOpenFAQ,
  showToast
}: SupportViewProps) {
  // Determine if user has administrative rights for support desk
  const isAdmin = currentUser.role === 'IT Admin' || currentUser.role === 'Super Admin' || currentUser.role === 'IT Support';
  const isManager = currentUser.role === 'Manager' || currentUser.role === 'Department Manager' || currentUser.fullName.toLowerCase().includes('manager');

  // Tabs: 'portal' (Standard User Contact/Submit & My Tickets) or 'management' (IT Staff Queue)
  const [activeView, setActiveView] = useState<'portal' | 'management'>(
    (isAdmin || isManager) ? 'management' : 'portal'
  );

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Submit Ticket Form States
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'Login Issue' | 'Access Request' | 'Account Problem' | 'Technical Issue' | 'Password Reset' | 'Bug Report' | 'Other'>('Technical Issue');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Ticket for detailed drawer/modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Filter staff profiles who can be assigned (including all Managers, IT Support, IT Admin, but excluding Super Admin if the current user is an IT Admin)
  const itStaffMembers = profiles.filter(p => {
    const isManagerRole = p.role === 'Manager' || p.role === 'Department Manager' || p.fullName.toLowerCase().includes('manager');
    const isITRole = p.role === 'IT Admin' || p.role === 'IT Support';
    const isSuperAdminRole = p.role === 'Super Admin';

    // The user requested: "Allow to asign all managers for IT Admin not Super Admin"
    if (currentUser.role === 'IT Admin') {
      return (isITRole || isManagerRole) && !isSuperAdminRole;
    }

    // Otherwise, allow IT Admin, IT Support, Super Admin, and all Managers
    return isITRole || isSuperAdminRole || isManagerRole || p.email.startsWith('admin@');
  });

  // Handler for drag & drop file upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      setAttachedFile({ name: file.name, size: sizeStr });
      showToast(`Attached ${file.name} successfully`, 'success');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      setAttachedFile({ name: file.name, size: sizeStr });
      showToast(`Attached ${file.name} successfully`, 'success');
    }
  };

  // Ticket submission logic
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast('Please fill in the Subject and Description fields', 'error');
      return;
    }

    const hash = Math.floor(Math.random() * 9000) + 1000;
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const ticketId = `TCK-${dateStr.slice(2)}-${hash}`;

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userEmail: currentUser.email,
      userDepartmentId: currentUser.departmentId,
      userRole: currentUser.role,
      subject: subject.trim(),
      category,
      priority,
      status: 'Open',
      description: description.trim(),
      attachmentName: attachedFile?.name,
      attachmentSize: attachedFile?.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      activityLogs: [
        {
          id: `act-${Math.random()}`,
          action: 'Ticket Submitted',
          actorName: currentUser.fullName,
          timestamp: new Date().toISOString()
        }
      ]
    };

    onAddTicket(newTicket);
    showToast(`Support ticket ${ticketId} submitted successfully!`, 'success');

    // Reset Form
    setSubject('');
    setCategory('Technical Issue');
    setPriority('Medium');
    setDescription('');
    setAttachedFile(null);
    setShowSubmitForm(false);
  };

  // Add Comment/Response
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newComment.trim()) return;

    const commentId = `cmt-${Math.random().toString(36).substr(2, 9)}`;
    const isNote = (isAdmin || selectedTicket?.assignedToId === currentUser.id) && isInternalComment;

    const comment: TicketComment = {
      id: commentId,
      authorName: currentUser.fullName,
      authorEmail: currentUser.email,
      authorRole: currentUser.role,
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      isInternal: isNote
    };

    const actionText = isNote 
      ? `Added Internal Note: "${newComment.substring(0, 30)}${newComment.length > 30 ? '...' : ''}"`
      : `Added Public Response`;

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      updatedAt: new Date().toISOString(),
      comments: [...selectedTicket.comments, comment],
      activityLogs: [
        ...selectedTicket.activityLogs,
        {
          id: `act-${Math.random()}`,
          action: actionText,
          actorName: currentUser.fullName,
          timestamp: new Date().toISOString()
        }
      ]
    };

    onUpdateTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
    setNewComment('');
    setIsInternalComment(false);
    showToast(isNote ? 'Internal note saved securely' : 'Response dispatched to user', 'success');
  };

  // Update Status
  const handleStatusChange = (newStatus: SupportTicket['status']) => {
    if (!selectedTicket) return;

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      activityLogs: [
        ...selectedTicket.activityLogs,
        {
          id: `act-${Math.random()}`,
          action: `Status updated from ${selectedTicket.status} to ${newStatus}`,
          actorName: currentUser.fullName,
          timestamp: new Date().toISOString()
        }
      ]
    };

    onUpdateTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
    showToast(`Ticket status updated to ${newStatus}`, 'success');
  };

  // Assign Ticket
  const handleAssigneeChange = (staffId: string) => {
    if (!selectedTicket) return;

    const staff = profiles.find(p => p.id === staffId);
    if (!staff && staffId !== '') return;

    const assignedName = staff ? staff.fullName : undefined;
    const assignedId = staff ? staff.id : undefined;

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      assignedToId: assignedId,
      assignedToName: assignedName,
      status: selectedTicket.status === 'Open' ? 'In Progress' : selectedTicket.status, // Auto move to In Progress if it was Open
      updatedAt: new Date().toISOString(),
      activityLogs: [
        ...selectedTicket.activityLogs,
        {
          id: `act-${Math.random()}`,
          action: staff ? `Assigned to ${staff.fullName}` : 'Unassigned ticket',
          actorName: currentUser.fullName,
          timestamp: new Date().toISOString()
        }
      ]
    };

    onUpdateTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
    showToast(staff ? `Assigned to ${staff.fullName}` : 'Ticket unassigned', 'success');
  };

  // Close ticket quick action
  const handleCloseTicket = (ticket: SupportTicket) => {
    const updatedTicket: SupportTicket = {
      ...ticket,
      status: 'Closed',
      updatedAt: new Date().toISOString(),
      activityLogs: [
        ...ticket.activityLogs,
        {
          id: `act-${Math.random()}`,
          action: 'Ticket closed by user',
          actorName: currentUser.fullName,
          timestamp: new Date().toISOString()
        }
      ]
    };

    onUpdateTicket(updatedTicket);
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket(updatedTicket);
    }
    showToast(`Ticket ${ticket.id} closed successfully`, 'success');
  };

  // Filter logic for standard user tickets vs IT admin queue
  const displayTickets = tickets.filter(ticket => {
    const isOwner = ticket.userEmail.toLowerCase() === currentUser.email.toLowerCase();
    const isAssignedToMe = ticket.assignedToId === currentUser.id;

    // Permission barrier: Standard users/managers only see their own tickets or those assigned to them
    if (!isAdmin && !isOwner && !isAssignedToMe) {
      return false;
    }

    // Standard filter for portal: standard users see only their own or those assigned to them
    if (activeView === 'portal' && !isOwner && !isAssignedToMe) {
      return false;
    }

    // Filter for management queue: managers and standard users see only tickets assigned to them
    if (activeView === 'management' && !isAdmin && !isAssignedToMe) {
      return false;
    }

    // Searches
    const searchMatch = 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    // Status Filter
    const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;

    // Category Filter
    const categoryMatch = categoryFilter === 'all' || ticket.category === categoryFilter;

    // Priority Filter
    const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;

    // Department Filter
    const deptMatch = departmentFilter === 'all' || ticket.userDepartmentId === departmentFilter;

    return searchMatch && statusMatch && categoryMatch && priorityMatch && deptMatch;
  });

  const userDept = (deptId: string) => departments.find(d => d.id === deptId)?.name || 'Operations';

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40';
      case 'Medium': return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/60';
    }
  };

  const getStatusBadgeColor = (s: string) => {
    switch (s) {
      case 'Open': return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40';
      case 'In Progress': return 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40';
      default: return 'bg-gray-100 text-gray-750 border border-gray-200 dark:bg-gray-850 dark:text-gray-400 dark:border-gray-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in" id="support-view-container">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#0052cc]" />
            <span>IT Support & Help Desk Hub</span>
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-450 mt-1">
            Submit service tickets, browse corporate security FAQs, and communicate directly with System Administrators.
          </p>
        </div>

        {/* Admin/User view toggles */}
        {(isAdmin || isManager) && (
          <div className="bg-gray-100 dark:bg-gray-850 p-1 rounded-xl flex border border-gray-200 dark:border-gray-800 shrink-0">
            <button
              onClick={() => {
                setActiveView('management');
                setSelectedTicket(null);
              }}
              className={`px-3 py-1.5 text-xs font-black tracking-tight rounded-lg cursor-pointer transition-all ${
                activeView === 'management'
                  ? 'bg-white dark:bg-gray-900 text-[#0052cc] dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-850 dark:text-gray-450 dark:hover:text-gray-200'
              }`}
            >
              {isAdmin ? "Support Desk Queue" : "Supporting Dashboard"}
            </button>
            <button
              onClick={() => {
                setActiveView('portal');
                setSelectedTicket(null);
              }}
              className={`px-3 py-1.5 text-xs font-black tracking-tight rounded-lg cursor-pointer transition-all ${
                activeView === 'portal'
                  ? 'bg-white dark:bg-gray-900 text-[#0052cc] dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-850 dark:text-gray-450 dark:hover:text-gray-200'
              }`}
            >
              My Client Portal
            </button>
          </div>
        )}
      </div>

      {/* NEED HELP FAQ CALLOUT SECTION */}
      {activeView === 'portal' && !showSubmitForm && !selectedTicket && (
        <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-150/60 dark:border-blue-900/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <HelpCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-950 dark:text-blue-300">Need Immediate Assistance? Try checking our FAQs first!</h4>
              <p className="text-[11px] text-blue-700 dark:text-blue-400/80 leading-normal mt-0.5 max-w-2xl">
                We might already have an instant solution for your request! We have published articles about resetting MFA keys, syncing active directory accounts, and requesting domain clearance.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenFAQ}
            className="px-4 py-2 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            Open FAQ Base
          </button>
        </div>
      )}

      {/* CORE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SIDE BAR: CONTACT & CONTACT HOURS - only on standard view */}
        {activeView === 'portal' && !selectedTicket && (
          <div className="lg:col-span-1 space-y-6">
            
            {/* Contacts Info */}
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">IT Directory Contacts</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 bg-gray-50 dark:bg-gray-805 rounded-lg text-[#0052cc] dark:text-blue-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold">IT Support Email</p>
                    <a href="mailto:support@company.com" className="text-xs font-black text-gray-900 dark:text-white hover:underline">
                      support@company.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 bg-gray-50 dark:bg-gray-805 rounded-lg text-indigo-500">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold">System Administrator</p>
                    <a href="mailto:sysadmin@company.com" className="text-xs font-black text-gray-900 dark:text-white hover:underline">
                      sysadmin@company.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 bg-gray-50 dark:bg-gray-805 rounded-lg text-emerald-500">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold">Phone Hotline (Optional)</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white">
                      +1 (555) 019-9999
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Working Hours</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Standard SLA Issues</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">Mon - Fri, 8AM - 6PM EST</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-850 pt-2 text-[#0052cc] dark:text-blue-400 font-bold">
                  <span>Critical Network Downtime</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>24/7/365 On-Call</span>
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className={`${activeView === 'management' || selectedTicket ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
          
          {/* TICKET DETAILS AND DISCUSSION (DRAWER DETAIL VIEW) */}
          {selectedTicket ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
              
              {/* Detail Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-850 bg-gray-50/70 dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="text-xs font-black text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>Back to Ticket Queue</span>
                  </button>
                  <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                    <span className="text-xs font-mono font-black bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                      {selectedTicket.id}
                    </span>
                    <h3 className="text-sm font-black text-gray-950 dark:text-white">
                      {selectedTicket.subject}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status badge */}
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase ${getStatusBadgeColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  
                  {/* Priority badge */}
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase ${getPriorityBadgeColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority} Priority
                  </span>

                  {/* Close Ticket Option for User */}
                  {!isAdmin && selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' && (
                    <button
                      onClick={() => handleCloseTicket(selectedTicket)}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-[10px] rounded-lg cursor-pointer border border-rose-100/30 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Close Ticket</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 flex-1">
                
                {/* DISCUSSION PANEL */}
                <div className="md:col-span-2 border-r border-gray-100 dark:border-gray-850 p-5 flex flex-col h-[550px]">
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 scrollbar-thin">
                    
                    {/* Ticket Origin Post */}
                    <div className="p-4 bg-gray-50/60 dark:bg-gray-805 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const senderProfile = profiles.find(p => p.email.toLowerCase() === selectedTicket.userEmail.toLowerCase());
                            return senderProfile?.avatarUrl ? (
                              <img 
                                src={senderProfile.avatarUrl} 
                                alt={selectedTicket.userName} 
                                className="w-7 h-7 rounded-full object-cover border border-blue-500/10 shadow-sm shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/35 text-[#0052cc] dark:text-blue-400 text-xs font-black flex items-center justify-center uppercase shrink-0">
                                {selectedTicket.userName ? selectedTicket.userName.split(' ').map(n=>n[0]).join('') : ''}
                              </div>
                            );
                          })()}
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white leading-none">
                              {selectedTicket.userName}
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium font-mono leading-none">
                              {selectedTicket.userEmail}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-450 font-mono font-bold">
                          {new Date(selectedTicket.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-gray-700 dark:text-gray-350 leading-relaxed whitespace-pre-wrap">
                        {selectedTicket.description}
                      </div>

                      {/* Attachment if present */}
                      {selectedTicket.attachmentName && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-850 flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                            {selectedTicket.attachmentName}
                          </span>
                          <span className="text-[9px] text-gray-450">
                            ({selectedTicket.attachmentSize})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timeline Comments */}
                    {selectedTicket.comments.map((comment) => {
                      // Internal note color logic
                      const isNote = comment.isInternal;
                      const authorIsIt = comment.authorRole === 'IT Admin' || comment.authorRole === 'Super Admin' || comment.authorRole === 'IT Support';

                      return (
                        <div 
                          key={comment.id} 
                          className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                            isNote 
                              ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-100 dark:border-amber-950/40 shadow-sm' 
                              : authorIsIt
                                ? 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-950/20'
                                : 'bg-white dark:bg-gray-850 border-gray-100 dark:border-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              {isNote && <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              <span className="font-black text-gray-900 dark:text-white">
                                {comment.authorName}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                authorIsIt
                                  ? 'bg-blue-100 text-blue-750 dark:bg-blue-950/30 dark:text-blue-400' 
                                  : 'bg-gray-100 text-gray-650 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {comment.authorRole}
                              </span>
                              {isNote && (
                                <span className="text-[9px] bg-amber-150 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Internal Note
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(comment.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                      );
                    })}

                  </div>

                  {/* Comment Submission form */}
                  {selectedTicket.status !== 'Closed' ? (
                    <form onSubmit={handleAddComment} className="border-t border-gray-100 dark:border-gray-850 pt-4 mt-3 space-y-3">
                      
                      {(isAdmin || selectedTicket.assignedToId === currentUser.id) && (
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={isInternalComment}
                              onChange={(e) => setIsInternalComment(e.target.checked)}
                              className="rounded text-amber-500 border-gray-300 focus:ring-amber-500"
                            />
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-500" />
                              <span>Internal Staff Note (Hidden from User)</span>
                            </span>
                          </label>
                        </div>
                      )}

                      <div className="relative">
                        <textarea
                          rows={2}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={isInternalComment ? "Add hidden staff collaboration note..." : "Post response..."}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 resize-none pr-10"
                        />
                        <button
                          type="submit"
                          className="absolute right-3.5 bottom-3.5 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer shadow transition-all disabled:opacity-50"
                          disabled={!newComment.trim()}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-805 border border-gray-150 dark:border-gray-800 rounded-xl text-center text-xs text-gray-400 dark:text-gray-500 italic mt-4">
                      This service ticket has been fully closed. No further commentary can be appended.
                    </div>
                  )}

                </div>

                {/* SIDE META DETAILS INFO PANEL */}
                <div className="p-5 bg-gray-50/40 dark:bg-gray-900 space-y-6">
                  
                  {/* User Profile Info */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Client Details</h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-450">Department</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {userDept(selectedTicket.userDepartmentId)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-450">System Role</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {selectedTicket.userRole}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-450">Ticket Category</span>
                        <span className="font-black text-blue-600 dark:text-blue-400">
                          {selectedTicket.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* IT ADMIN INTERACTIVE ACTIONS - Visible only to admins or the assigned agent */}
                  {(isAdmin || selectedTicket.assignedToId === currentUser.id) ? (
                    <div className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-5">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Staff Controls</span>
                      </h4>

                      {/* Dropdown status update */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500">
                          Ticket Status
                        </label>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleStatusChange(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      {/* Assign to IT Staff member */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500">
                          Assign IT Agent
                        </label>
                        <select
                          value={selectedTicket.assignedToId || ''}
                          onChange={(e) => handleAssigneeChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500"
                        >
                          <option value="">-- Unassigned --</option>
                          {itStaffMembers.map(staff => (
                            <option key={staff.id} value={staff.id}>
                              {staff.fullName} ({staff.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quick resolve / close buttons */}
                      <div className="flex gap-2 pt-2">
                        {selectedTicket.status !== 'Resolved' && (
                          <button
                            onClick={() => handleStatusChange('Resolved')}
                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Set Resolved</span>
                          </button>
                        )}
                        {selectedTicket.status !== 'Closed' && (
                          <button
                            onClick={() => handleStatusChange('Closed')}
                            className="flex-1 px-3 py-2 bg-slate-650 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg shadow cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Close Ticket</span>
                          </button>
                        )}
                      </div>

                    </div>
                  ) : (
                    // For standard users, show current assigned agent details
                    <div className="space-y-3 border-t border-gray-100 dark:border-gray-850 pt-5">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Assigned Support Agent</h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2.5 text-xs">
                        <div className="w-7 h-7 rounded-full bg-[#0052cc] text-white flex items-center justify-center font-bold">
                          {selectedTicket.assignedToName ? selectedTicket.assignedToName[0] : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {selectedTicket.assignedToName || 'Unassigned Queue'}
                          </p>
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                            {selectedTicket.assignedToName ? 'Active IT Agent' : 'Pending Allocation'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity Log Audit Timeline */}
                  <div className="space-y-3 border-t border-gray-100 dark:border-gray-850 pt-5">
                    <h4 className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Activity Log Timeline</h4>
                    <div className="flow-root max-h-[160px] overflow-y-auto pr-1">
                      <ul className="space-y-3 text-[10px]">
                        {selectedTicket.activityLogs.map((log) => (
                          <li key={log.id} className="relative flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                            <div>
                              <p className="font-bold text-gray-800 dark:text-gray-200">
                                {log.action}
                              </p>
                              <span className="text-[9px] text-gray-400">
                                {log.actorName} • {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            // SUBMIT TICKET FORM OR MAIN QUEUE TABLE
            <div className="space-y-6">
              
              {/* SUBMIT FORM COLLAPSIBLE PANEL */}
              {showSubmitForm ? (
                <form onSubmit={handleSubmitTicket} className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-1.5">
                        <PlusCircle className="w-5 h-5 text-[#0052cc]" />
                        <span>Submit New Support Ticket</span>
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Please provide specific details so our System Admins can expedite review.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSubmitForm(false)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Subject */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                        Subject / Brief Issue Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Inbound VPN sync keeps throwing TLS handshake rejection"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                        Incident Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all"
                      >
                        <option value="Login Issue">Login Issue</option>
                        <option value="Access Request">Access Request</option>
                        <option value="Account Problem">Account Problem</option>
                        <option value="Technical Issue">Technical Issue</option>
                        <option value="Password Reset">Password Reset</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                        Impact Priority <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all font-semibold"
                      >
                        <option value="Low" className="text-gray-500 font-bold">Low Priority</option>
                        <option value="Medium" className="text-amber-500 font-bold">Medium Priority</option>
                        <option value="High" className="text-rose-500 font-bold">High Priority</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                        Detailed Incident Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please state clearly what you did, what the error displays, and logs where possible..."
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all resize-none"
                      />
                    </div>

                    {/* Attachment Drag & Drop Zone */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-750 dark:text-gray-300">
                        Diagnostic Attachments (Optional)
                      </label>
                      
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          dragActive 
                            ? 'border-blue-500 bg-blue-50/20' 
                            : 'border-gray-200 dark:border-gray-750 hover:border-gray-300 bg-gray-50/50 dark:bg-gray-850/50'
                        }`}
                      >
                        <Paperclip className="w-5.5 h-5.5 text-gray-400" />
                        <div className="text-xs">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer bg-transparent border-none"
                          >
                            Browse diagnostic reports
                          </button>
                          <span className="text-gray-500"> or drag screenshot here</span>
                        </div>
                        <p className="text-[10px] text-gray-400">PDF, JPG, PNG, LOG file limits up to 10MB</p>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {attachedFile && (
                          <div className="mt-2.5 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-center gap-2 text-[11px] animate-fade-in text-gray-800 dark:text-gray-200">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="font-bold truncate max-w-xs">{attachedFile.name}</span>
                            <span className="text-gray-400">({attachedFile.size})</span>
                            <button
                              type="button"
                              onClick={() => setAttachedFile(null)}
                              className="ml-auto text-rose-500 hover:text-rose-700 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-850 pt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSubmitForm(false)}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel Submission
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Ticket</span>
                    </button>
                  </div>

                </form>
              ) : (
                // SEARCH, FILTER, AND QUEUE TABLE
                <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                  
                  {/* SEARCH FILTERS AND HEAD BUTTONS */}
                  <div className="flex flex-col gap-3.5 md:flex-row md:items-center justify-between">
                    
                    {/* Searches */}
                    <SearchInput
                      id="support-ticket-search"
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder={activeView === 'portal' ? "Search my tickets by keyword or ID..." : "Search support tickets..."}
                      containerClassName="max-w-md"
                    />

                    {/* Submit ticket for Standard users */}
                    {activeView === 'portal' && (
                      <button
                        onClick={() => setShowSubmitForm(true)}
                        className="px-4 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start md:self-auto"
                      >
                        <PlusCircle className="w-4.5 h-4.5" />
                        <span>Submit Ticket</span>
                      </button>
                    )}
                  </div>

                  {/* DROP DOWN GRID FILTERS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-805/40 p-3.5 rounded-xl border border-gray-150/60 dark:border-gray-800/80">
                    
                    {/* Status filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                      >
                        <option value="all">All Categories</option>
                        <option value="Login Issue">Login Issue</option>
                        <option value="Access Request">Access Request</option>
                        <option value="Account Problem">Account Problem</option>
                        <option value="Technical Issue">Technical Issue</option>
                        <option value="Password Reset">Password Reset</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                      >
                        <option value="all">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    {/* Department Filter (Only for admin views) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Department</label>
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                      >
                        <option value="all">All Depts</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* ACTIVE TABLE */}
                  <div className="overflow-x-auto border border-gray-150 dark:border-gray-800/80 rounded-xl bg-white dark:bg-gray-900">
                    <table className="table-standard border-collapse">
                      <thead>
                        <tr className="table-header-row text-[10px] font-black uppercase text-gray-450 dark:text-gray-400 tracking-wider">
                          <th className="th-standard">Ticket ID</th>
                          <th className="th-standard">Subject / Incident</th>
                          {activeView === 'management' && <th className="th-standard">Client</th>}
                          <th className="th-standard">Category</th>
                          <th className="th-standard">Priority</th>
                          <th className="th-standard">Status</th>
                          <th className="th-standard text-right">Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                        {displayTickets.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-gray-400 dark:text-gray-500 italic">
                              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <span>No support tickets match the selected filters.</span>
                            </td>
                          </tr>
                        ) : (
                          displayTickets.map((ticket) => (
                            <React.Fragment key={ticket.id}>
                              <tr 
                                className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20 transition-colors"
                              >
                                {/* Ticket ID */}
                                <td className="td-standard font-mono font-bold text-gray-700 dark:text-gray-300">
                                  {ticket.id}
                                </td>

                                {/* Subject */}
                                <td className="td-standard max-w-xs sm:max-w-md">
                                  <button
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="font-black text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left block cursor-pointer pr-4 truncate"
                                  >
                                    {ticket.subject}
                                  </button>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                    <span>Submitted {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    {ticket.assignedToName && (
                                      <>
                                        <span>•</span>
                                        <span className="font-semibold text-gray-500">Assigned: {ticket.assignedToName}</span>
                                      </>
                                    )}
                                  </span>
                                </td>

                                {/* Client Info (Visible to Admin only) */}
                                {activeView === 'management' && (
                                  <td className="td-standard">
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      {ticket.userName}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      {userDept(ticket.userDepartmentId)}
                                    </div>
                                  </td>
                                )}

                                {/* Category */}
                                <td className="td-standard font-bold text-gray-550 dark:text-gray-400">
                                  {ticket.category}
                                </td>

                                {/* Priority */}
                                <td className="td-standard">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(ticket.priority)}`}>
                                    {ticket.priority}
                                  </span>
                                </td>

                                {/* Interactive Status Badge */}
                                <td className="td-standard">
                                  <select
                                    value={ticket.status}
                                    onChange={(e) => {
                                      const nextStatus = e.target.value as any;
                                      const updatedTicket: SupportTicket = {
                                        ...ticket,
                                        status: nextStatus,
                                        updatedAt: new Date().toISOString(),
                                        activityLogs: [
                                          ...ticket.activityLogs,
                                          {
                                            id: `act-${Math.random().toString(36).substr(2, 9)}`,
                                            action: 'Status Changed via Interactive Badge',
                                            actorName: currentUser.fullName,
                                            timestamp: new Date().toISOString()
                                          }
                                        ]
                                      };
                                      onUpdateTicket(updatedTicket);
                                      showToast(`Ticket ${ticket.id} status changed to ${nextStatus}`, 'success');
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-transparent border border-gray-200 dark:border-gray-700 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 ${getStatusBadgeColor(ticket.status)}`}
                                  >
                                    <option value="Open" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Open</option>
                                    <option value="In Progress" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">In Progress</option>
                                    <option value="Resolved" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Resolved</option>
                                    <option value="Closed" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Closed</option>
                                  </select>
                                </td>

                                {/* Actions / Trigger */}
                                <td className="td-standard text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedTicket(ticket)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-450 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                      title="View Ticket Conversation"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Close ticket directly if not closed */}
                                    {!isAdmin && ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
                                      <button
                                        onClick={() => handleCloseTicket(ticket)}
                                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-gray-450 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                        title="Close Resolved Ticket"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* Quick Reply Row */}
                              <tr key={`${ticket.id}-quickreply`} className="bg-gray-50/20 dark:bg-gray-900/40 border-b border-gray-150 dark:border-gray-800/60">
                                <td colSpan={activeView === 'management' ? 7 : 6} className="px-4 py-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 shrink-0 flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3 text-blue-500" />
                                      <span>Quick Reply:</span>
                                    </span>
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.currentTarget;
                                        const input = form.elements.namedItem(`quickReply-${ticket.id}`) as HTMLInputElement;
                                        const text = input.value.trim();
                                        if (!text) return;

                                        const commentId = `cmt-${Math.random().toString(36).substr(2, 9)}`;
                                        const comment = {
                                          id: commentId,
                                          authorName: currentUser.fullName,
                                          authorEmail: currentUser.email,
                                          authorRole: currentUser.role,
                                          text: text,
                                          timestamp: new Date().toISOString(),
                                          isInternal: false
                                        };

                                        const updatedTicket: SupportTicket = {
                                          ...ticket,
                                          updatedAt: new Date().toISOString(),
                                          comments: [...ticket.comments, comment],
                                          activityLogs: [
                                            ...ticket.activityLogs,
                                            {
                                              id: `act-${Math.random().toString(36).substr(2, 9)}`,
                                              action: 'Added Response via Quick Reply',
                                              actorName: currentUser.fullName,
                                              timestamp: new Date().toISOString()
                                            }
                                          ]
                                        };

                                        onUpdateTicket(updatedTicket);
                                        input.value = '';
                                        showToast(`Response added to Ticket ${ticket.id}`, 'success');
                                      }}
                                      className="flex-1 flex items-center gap-2"
                                    >
                                      <input
                                        id={`quickReply-${ticket.id}`}
                                        name={`quickReply-${ticket.id}`}
                                        type="text"
                                        placeholder="Type quick reply and press Enter..."
                                        className="w-full max-w-lg px-2.5 py-1 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                      <button
                                        type="submit"
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase cursor-pointer whitespace-nowrap transition-colors"
                                      >
                                        Send
                                      </button>
                                    </form>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
