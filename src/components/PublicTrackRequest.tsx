import React, { useState, useEffect } from 'react';
import { AccessRequest, Department } from '../types';
import { 
  ArrowLeft, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Printer, 
  Download, 
  HelpCircle, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  ShieldAlert, 
  Key,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import { getTranslatedStatus, getTranslatedDeptName, getTranslatedSystemName } from '../utils/translateHelpers';

interface PublicTrackRequestProps {
  departments: Department[];
  onBack: () => void;
  initialSearchId?: string;
  embedded?: boolean;
}

export default function PublicTrackRequest({ departments, onBack, initialSearchId = '', embedded = false }: PublicTrackRequestProps) {
  const { t } = useTranslation();
  const [searchId, setSearchId] = useState(initialSearchId);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundRequest, setFoundRequest] = useState<AccessRequest | null>(null);

  // Trigger search if initialSearchId is provided
  useEffect(() => {
    if (initialSearchId) {
      handleSearch(null, initialSearchId);
    }
  }, [initialSearchId]);

  const handleSearch = async (e: React.FormEvent | null, directId?: string) => {
    if (e) e.preventDefault();
    const queryId = (directId || searchId).trim();

    if (!queryId) {
      setSearchError('Please provide a valid Access Request ID.');
      return;
    }

    setSearchError('');
    setIsSearching(true);
    setFoundRequest(null);

    try {
      // 1. Query from Supabase first for the live database status
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('id', queryId)
        .maybeSingle();

      if (error) {
        console.warn("Supabase select request error, or table empty. Bypassing.", error);
      }

      if (data) {
        // Map database column names (snake_case) to typescript CamelCase schema properties
        const mappedRequest: AccessRequest = {
          id: data.id,
          userId: data.user_id || 'public-guest',
          userEmail: data.user_email,
          userFullName: data.user_full_name,
          departmentId: data.department_id,
          title: data.title,
          accessType: data.access_type,
          systemName: data.system_name,
          justification: data.justification,
          priority: data.priority,
          startDate: data.start_date,
          endDate: data.end_date || undefined,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          manager: data.manager || undefined,
          currentApprover: data.current_approver || undefined,
          attachments: data.attachments || [],
          comments: data.comments || undefined,
          commentsHistory: data.comments_history || [],
          provisionedCredentials: data.provisioned_credentials || undefined
        };
        setFoundRequest(mappedRequest);
      } else {
        // 2. Try to search from localStorage fallback if not found in database (instant response)
        const existingStr = localStorage.getItem('ess_public_requests') || '[]';
        const localRequests: AccessRequest[] = JSON.parse(existingStr);
        const matchedLocal = localRequests.find(r => r.id.toLowerCase() === queryId.toLowerCase());

        if (matchedLocal) {
          setFoundRequest(matchedLocal);
          setIsSearching(false);
          return;
        }

        // Try exact match in hardcoded mock initial requests
        const hardcodedMockExisting = localStorage.getItem('all_requests');
        if (hardcodedMockExisting) {
          const reqs: AccessRequest[] = JSON.parse(hardcodedMockExisting);
          const matchedHardcoded = reqs.find(r => r.id.toLowerCase() === queryId.toLowerCase());
          if (matchedHardcoded) {
            setFoundRequest(matchedHardcoded);
            setIsSearching(false);
            return;
          }
        }
        setSearchError(`No access request found matching ID "${queryId}". Please verify your code and retry.`);
      }
    } catch (err) {
      console.error("Database query exception:", err);
      setSearchError('Connection timeout searching request database. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Helper to determine status order and active level index for visual stepper
  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'Draft':
        return 0;
      case 'Pending':
      case 'Submitted':
      case 'Pending Department Approval':
        return 1;
      case 'Under Review':
        return 2;
      case 'Approved':
      case 'Pending IT Approval':
        return 3;
      case 'Completed':
      case 'Delivered':
        return 4;
      case 'Rejected':
        return -1; // Special Red timeline case
      default:
        return 1;
    }
  };

  // Generate PDF Receipt
  const handleDownloadReceipt = () => {
    if (!foundRequest) return;
    
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ETHIOPIAN STATISTICS SERVICE (ESS)', 15, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Centralized User Access Request Portal - Live Status Update', 15, 28);
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET STATUS AND SUMMARY', 15, 55);
    
    // Table
    let y = 65;
    const addRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || 'N/A', 75, y);
      y += 10;
    };

    addRow('Request ID:', foundRequest.id);
    addRow('Requester Name:', foundRequest.userFullName);
    addRow('Department:', departments.find(d => d.id === foundRequest.departmentId)?.name || 'Other');
    addRow('Requested System:', foundRequest.systemName);
    addRow('Current Status:', foundRequest.status.toUpperCase());
    addRow('Priority Level:', foundRequest.priority);
    addRow('Submission Date:', new Date(foundRequest.createdAt).toLocaleString());
    addRow('Last Updated At:', new Date(foundRequest.updatedAt).toLocaleString());

    if (foundRequest.comments) {
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Administrative Review Comments:', 15, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(foundRequest.comments, 180);
      doc.text(lines, 15, y);
    }
    
    // Footer notes
    y = 250;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, 195, y);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Ethiopian Statistics Service, ICT Department Helpdesk. Addis Ababa, Ethiopia.', 15, y + 10);

    doc.save(`ESS_Status_${foundRequest.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const commentsHistory = React.useMemo(() => {
    if (!foundRequest) return [];
    if (foundRequest.commentsHistory && foundRequest.commentsHistory.length > 0) {
      return foundRequest.commentsHistory;
    }

    // Synthesize history if it's not saved/persisted on the request yet
    const computed = [
      {
        id: 'initial-' + foundRequest.id,
        authorName: foundRequest.userFullName,
        authorRole: 'User',
        action: 'Submit',
        text: foundRequest.justification || 'No justification provided.',
        timestamp: foundRequest.createdAt
      }
    ];

    if (foundRequest.comments) {
      computed.push({
        id: 'legacy-' + foundRequest.id,
        authorName: 'Sponsoring Approver',
        authorRole: 'Manager',
        action: foundRequest.status === 'Completed' || foundRequest.status === 'Delivered' ? 'Complete' : foundRequest.status === 'Rejected' ? 'Reject' : 'Approve',
        text: foundRequest.comments,
        timestamp: foundRequest.updatedAt || foundRequest.createdAt
      });
    }

    return computed;
  }, [foundRequest]);

  const activeStep = foundRequest ? getStatusStepIndex(foundRequest.status) : 0;

  return (
    <div className={embedded ? "max-w-3xl mx-auto px-1 py-2" : "max-w-3xl mx-auto px-4 py-12"}>
      <div className="space-y-6">

        {/* Back and Breadcrumb */}
        {!embedded && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <button 
              onClick={onBack}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.home')}</span>
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-white">{t('common.trackRequest')}</span>
          </div>
        )}

        {/* Header */}
        {!embedded && (
          <div className="space-y-2 border-b border-slate-200 dark:border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">{t('common.portalSubtitle')}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('publicTrack.title')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('publicTrack.desc')}
            </p>
          </div>
        )}

        {/* Search input card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  setSearchError('');
                }}
                placeholder="E.g. ESS-2026-804104 or ESS-REQ-1029"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 pl-10 pr-4 py-3 text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-white uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0 border-none cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>{t('publicTrack.searching')}</span>
                </>
              ) : (
                <>
                  <span>{t('publicTrack.lookupBtn')}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {searchError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center gap-2.5 text-xs text-red-800 dark:text-red-400 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Found Request Details Content */}
        {foundRequest && (
          <div className="space-y-6 animate-fade-in">

            {/* VISUAL WORKFLOW STEPPER */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Live Request Tracking Timeline</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded uppercase">
                    {foundRequest.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-slate-400 dark:text-slate-500">{t('requestDetailsModal.status')}:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    foundRequest.status === 'Approved' || foundRequest.status === 'Completed' || foundRequest.status === 'Delivered'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                      : foundRequest.status === 'Rejected'
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200'
                  }`}>
                    {getTranslatedStatus(foundRequest.status, t)}
                  </span>
                </div>
              </div>

              {/* Step indicator */}
              {activeStep === -1 ? (
                /* RED REJECTED TIMELINE */
                <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-4">
                  <ShieldAlert className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-red-800 dark:text-red-400 uppercase tracking-tight">Request Rejected / Denied</h3>
                    <p className="text-xs text-red-700/90 dark:text-red-300 leading-relaxed font-medium">
                      The administrative gatekeepers have formally declined this access ticket. Review comments indicate the exact security boundary violation or corrective remarks below.
                    </p>
                  </div>
                </div>
              ) : (
                /* STANDARD FLOW STEPPER */
                <div className="relative pt-2">
                  {/* Connection Line */}
                  <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 dark:bg-slate-800 -z-0 rounded-full" />
                  <div 
                    className="absolute top-4 left-4 h-1 bg-indigo-500 -z-0 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, activeStep * 25))}%` }}
                  />

                  {/* Steps Icons */}
                  <div className="relative z-10 flex items-center justify-between">
                    {[
                      { label: t('statusValues.draft'), desc: 'Prepared' },
                      { label: t('statusValues.pending'), desc: 'Awaiting Gate' },
                      { label: t('statusValues.under_review'), desc: 'In Progress' },
                      { label: t('statusValues.approved'), desc: 'Sign-Off OK' },
                      { label: t('statusValues.delivered'), desc: 'Credentials Ready' }
                    ].map((step, idx) => {
                      const isCompleted = activeStep >= idx;
                      const isActive = activeStep === idx;
                      
                      return (
                        <div key={idx} className="flex flex-col items-center text-center space-y-2">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 font-black text-xs ${
                            isActive
                              ? 'bg-indigo-500 text-white border-indigo-500 shadow-md ring-4 ring-indigo-100 dark:ring-indigo-950/40 scale-110'
                              : isCompleted
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-wider block ${
                              isActive ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-600'
                            }`}>
                              {step.label}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold block sm:inline">
                              {step.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CORE METADATA CARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Requester details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2.5">
                  <FileText className="w-4 h-4 text-[#0052cc] dark:text-blue-400" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Access Request Metrics</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex gap-2.5 items-start">
                    <User className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <strong className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Requester</strong>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{foundRequest.userFullName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <Building className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <strong className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">ESS Department</strong>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">
                        {departments.find(d => d.id === foundRequest.departmentId)?.name || 'Other'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <strong className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Submission Date</strong>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                        {new Date(foundRequest.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <strong className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Priority</strong>
                      <span className={`font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded ${
                        foundRequest.priority === 'Critical' || foundRequest.priority === 'High'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
                          : 'bg-slate-50 text-slate-600 dark:bg-slate-800'
                      }`}>
                        {foundRequest.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-900">
                  <strong className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Target Access Subsystem</strong>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {foundRequest.systemName}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-900">
                  <strong className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Justification</strong>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {foundRequest.justification}
                  </p>
                </div>
              </div>

              {/* Right Column: review comments and action tools */}
              <div className="space-y-6">
                
                {/* Admin review comment box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                    <HelpCircle className="w-4 h-4 text-[#0052cc] dark:text-blue-400" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Gatekeeper Notes</h4>
                  </div>
                  
                  {foundRequest.comments ? (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs space-y-2">
                      <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                        "{foundRequest.comments}"
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold block text-right">
                        — ESS IT Security Office
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic font-medium">
                        Awaiting administrative routing comments. Currently pending review.
                      </p>
                      <div className="text-[11px] font-medium text-indigo-750 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-2 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl space-y-1">
                        <span className="font-extrabold uppercase tracking-wide text-[9px] block text-indigo-500">Current Responsible Party</span>
                        <span>
                          {foundRequest.status === 'Pending' || foundRequest.status === 'Submitted' 
                            ? `${foundRequest.manager || 'Department Manager'} (or ICT System Administrator for routing)`
                            : foundRequest.status === 'Under Review'
                            ? `Sponsoring Reviewer / Department Manager (${foundRequest.manager || 'Approver'})`
                            : foundRequest.status === 'Approved'
                            ? 'ICT System Administrator (IT Admin) - Pending credential provisioning setup'
                            : 'Access Control Sponsoring Authority'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Secure Credential Output if status is completed/approved */}
                {foundRequest.provisionedCredentials && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200 dark:border-indigo-900/40 p-6 rounded-2xl shadow-xl space-y-4 animate-pulse">
                    <div className="flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900 pb-2">
                      <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Provisioned Parameters</h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <strong className="text-[9px] text-indigo-500 uppercase tracking-wide block font-bold">Username / Entry Access ID</strong>
                        <div className="bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900 font-mono font-bold text-slate-800 dark:text-indigo-200">
                          {foundRequest.provisionedCredentials.username || 'ess-assigned-user'}
                        </div>
                      </div>

                      <div>
                        <strong className="text-[9px] text-indigo-500 uppercase tracking-wide block font-bold">Temporary Entry Token</strong>
                        <div className="bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900 font-mono font-bold text-slate-800 dark:text-indigo-200">
                          {foundRequest.provisionedCredentials.tempPassword || '••••••••'}
                        </div>
                      </div>

                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold leading-relaxed">
                        ⚠️ Please sign in and reset your credentials within 24 hours. This token is temporary.
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* CHRONOLOGICAL APPROVAL WORKFLOW & COMMENT TIMELINE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Approval Workflow & Event Timeline ({commentsHistory.length})</span>
                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-850">
                  Chronological Record
                </span>
              </h3>

              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3.5 pl-6 space-y-6 py-1">
                {commentsHistory.map((cmt, idx) => {
                  let badgeColor = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350';
                  let circleBorderColor = 'border-slate-400 dark:border-slate-600';
                  
                  if (cmt.action === 'Submit') {
                    badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300 border-blue-100 dark:border-blue-900/40 border';
                    circleBorderColor = 'border-blue-500';
                  } else if (cmt.action === 'Approve') {
                    badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300 border-amber-100 dark:border-amber-900/40 border';
                    circleBorderColor = 'border-amber-500';
                  } else if (cmt.action === 'Complete' || cmt.action === 'Delivered' || cmt.action === 'Complete Access') {
                    badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40 border';
                    circleBorderColor = 'border-emerald-500';
                  } else if (cmt.action === 'Reject') {
                    badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/45 dark:text-rose-300 border-rose-100 dark:border-rose-900/40 border';
                    circleBorderColor = 'border-rose-500';
                  } else if (cmt.action === 'Request Info') {
                    badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/40 border';
                    circleBorderColor = 'border-indigo-500';
                  }

                  return (
                    <div key={cmt.id || idx} className="relative group animate-fade-in">
                      {/* Circle timeline point on left */}
                      <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-slate-900 transition-colors z-10 ${circleBorderColor}`} />

                      <div className="space-y-1.5 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">{cmt.authorName}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">({cmt.authorRole})</span>
                            
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${badgeColor}`}>
                              {cmt.action || 'Comment'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {new Date(cmt.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed break-words italic">
                          "{cmt.text}"
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Live Status (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFoundRequest(null);
                  setSearchId('');
                }}
                className="px-5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-900"
              >
                Track Another Token
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
