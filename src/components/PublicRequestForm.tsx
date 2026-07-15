import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Department, SystemApplication, AccessRequest, PriorityLevel, AccessType } from '../types';
import { 
  ArrowLeft, 
  Upload, 
  File, 
  CheckCircle2, 
  Printer, 
  Download, 
  Plus, 
  AlertCircle, 
  Eye, 
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import { getTranslatedDeptName, getTranslatedSystemName } from '../utils/translateHelpers';

interface PublicRequestFormProps {
  departments: Department[];
  systems: SystemApplication[];
  onBack: () => void;
  onNavigateToTrack: (id: string) => void;
  onSubmitSuccess: (newRequest: AccessRequest) => void;
}

export default function PublicRequestForm({ departments, systems, onBack, onNavigateToTrack, onSubmitSuccess }: PublicRequestFormProps) {
  const { t } = useTranslation();
  // Form fields
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'Email' | 'Telegram' | 'SMS' | 'Phone Call'>('Email');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [additionalRemarks, setAdditionalRemarks] = useState('');
  
  // Attachments
  const [attachments, setAttachments] = useState<{ name: string; size: string; previewUrl?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<AccessRequest | null>(null);

  // File operations
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationError(`File "${file.name}" exceeds the maximum limit of 5MB.`);
        return null;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setValidationError(`File "${file.name}" has an invalid type. Only PDF, PNG, and JPG files are supported.`);
        return null;
      }

      setValidationError('');
      return {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
      };
    }).filter((f): f is { name: string; size: string } => f !== null);

    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!fullName.trim() || !employeeId.trim() || !departmentId || !systemId || !justification.trim() || !deliveryMethod) {
      setValidationError('Please fill in all required fields marked with a red asterisk (*).');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    // Generate Request ID
    const randomNum = String(Math.floor(100000 + Math.random() * 900000));
    const generatedId = `ESS-2026-${randomNum}`;
    const selectedSystem = systems.find(s => s.id === systemId)?.name || 'Other';
    const createdAt = new Date().toISOString();

    // Dynamically look up correct Department Manager based on selected departmentId
    const getDepartmentManagerInfo = (id: string): { id: string; name: string; email: string } => {
      switch (id) {
        case 'dep-dir':
          return { id: 'user-mgr-dir', name: 'Director General Office Manager', email: 'manager.dir@ess.gov.et' };
        case 'dep-deputy':
          return { id: 'user-mgr-deputy', name: 'Deputy Director Office Manager', email: 'manager.deputy@ess.gov.et' };
        case 'dep-business':
          return { id: 'user-mgr-business', name: 'Business Statistics Manager', email: 'manager.business@ess.gov.et' };
        case 'dep-household':
          return { id: 'user-mgr-household', name: 'Household Statistics Manager', email: 'manager.household@ess.gov.et' };
        case 'dep-ict':
          return { id: 'user-mgr-ict', name: 'ICT Coordinator', email: 'manager.ict@ess.gov.et' };
        case 'dep-hr':
          return { id: 'user-mgr-hr', name: 'HR Manager', email: 'manager.hr@ess.gov.et' };
        case 'dep-finance':
          return { id: 'user-mgr-finance', name: 'Finance Manager', email: 'manager.finance@ess.gov.et' };
        case 'dep-other':
        default:
          return { id: 'user-mgr-other', name: 'Branch Operations Manager', email: 'manager.other@ess.gov.et' };
      }
    };

    const mgrInfo = getDepartmentManagerInfo(departmentId);

    const requestData: AccessRequest = {
      id: generatedId,
      userId: 'public-guest',
      userEmail: email.trim() || 'public-guest@ess.gov.et',
      userFullName: fullName.trim(),
      departmentId,
      title: `${selectedSystem} Access Request`,
      accessType: 'Application Access',
      systemName: selectedSystem,
      justification: justification.trim(),
      priority,
      startDate: new Date().toISOString().split('T')[0],
      status: 'Pending Department Approval',
      createdAt,
      updatedAt: createdAt,
      manager: mgrInfo.name,
      employeeId: employeeId.trim(),
      departmentManagerId: mgrInfo.id,
      attachments: attachments,
      comments: additionalRemarks.trim() || undefined,
      commentsHistory: [
        {
          id: 'comm-initial',
          authorName: fullName.trim(),
          authorRole: 'User',
          action: 'Submit',
          text: justification.trim(),
          timestamp: createdAt
        }
      ]
    };

    try {
      // 1. Try to submit to Supabase public DB
      const { error } = await supabase.from('access_requests').insert({
        id: generatedId,
        user_id: null, // Public users don't have a login profiles ID
        user_email: email.trim() || 'public-guest@ess.gov.et',
        user_full_name: fullName.trim(),
        department_id: departmentId,
        title: requestData.title,
        access_type: 'Application Access',
        system_name: selectedSystem,
        justification: justification.trim(),
        priority,
        start_date: requestData.startDate,
        status: 'Pending Department Approval',
        created_at: createdAt,
        updated_at: createdAt,
        manager: mgrInfo.name,
        current_approver: mgrInfo.name,
        attachments: attachments,
        comments: additionalRemarks.trim() || null,
        comments_history: requestData.commentsHistory,
        employee_id: employeeId.trim(),
        department_manager_id: mgrInfo.id
      });

      if (error) {
        console.warn("Supabase insertion failed or was blocked by RLS policies. Storing locally as backup:", error);
      } else {
        // 2. Add notification directly to Supabase for the Department Manager
        try {
          const noticeId = 'nt-' + Math.random().toString(36).substring(2, 15);
          await supabase.from('notifications').insert({
            id: noticeId,
            user_email: mgrInfo.email,
            message: `📥 New public access request "${requestData.title}" from ${fullName.trim()} is pending your department approval.`,
            is_read: false,
            created_at: createdAt,
            type: 'info_requested'
          });
        } catch (noticeErr) {
          console.error("Failed to insert manager notification for public request:", noticeErr);
        }

        // 3. Add to secure audit logs in Supabase DB
        try {
          const logId = 'log-' + Math.random().toString(36).substring(2, 15);
          await supabase.from('audit_logs').insert({
            id: logId,
            user_email: email.trim() || 'public-guest@ess.gov.et',
            user_role: 'User',
            action: 'Public Request Submission',
            details: `Public user ${fullName.trim()} (ID: ${employeeId.trim()}) submitted access request for ${selectedSystem} in department ${departmentId}. Status: Pending Department Approval.`,
            created_at: createdAt
          });
        } catch (logErr) {
          console.error("Failed to insert audit log for public request:", logErr);
        }
      }
      
      // 4. Regardless of Supabase, store in localStorage so that this browser can always track it!
      const existingStr = localStorage.getItem('ess_public_requests') || '[]';
      const existing = JSON.parse(existingStr);
      localStorage.setItem('ess_public_requests', JSON.stringify([requestData, ...existing]));

      setSubmissionResult(requestData);
      onSubmitSuccess(requestData);
    } catch (err) {
      console.error("Submission exception. Saving locally as fallback:", err);
      // Fail-safe fallback storage
      const existingStr = localStorage.getItem('ess_public_requests') || '[]';
      const existing = JSON.parse(existingStr);
      localStorage.setItem('ess_public_requests', JSON.stringify([requestData, ...existing]));

      setSubmissionResult(requestData);
      onSubmitSuccess(requestData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Receipt PDF using jsPDF
  const handleDownloadReceipt = () => {
    if (!submissionResult) return;
    
    const doc = new jsPDF();
    const primaryColor = '#1e3a8a'; // Deep blue
    
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
    doc.text('Centralized User Access Request Portal - Acknowledgement Receipt', 15, 28);
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCESS REQUEST SUMMARY', 15, 55);
    
    // Table content layout helper
    let y = 65;
    const addRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || 'N/A', 75, y);
      y += 10;
    };

    addRow('Request ID:', submissionResult.id);
    addRow('Requester Name:', submissionResult.userFullName);
    addRow('Employee ID:', employeeId);
    addRow('Department:', departments.find(d => d.id === submissionResult.departmentId)?.name || 'Other');
    addRow('Requested System:', submissionResult.systemName);
    addRow('Delivery Method:', deliveryMethod);
    addRow('Email Address:', email || 'Not Provided');
    addRow('Phone Number:', phoneNumber || 'Not Provided');
    addRow('Priority Level:', submissionResult.priority);
    addRow('Current Status:', 'Pending Review');
    addRow('Submission Date:', new Date(submissionResult.createdAt).toLocaleString());

    // Justification wrapped text
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Request Justification:', 15, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const justificationLines = doc.splitTextToSize(submissionResult.justification, 180);
    doc.text(justificationLines, 15, y);
    
    // Footer notes
    y = 250;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, 195, y);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('This is an automatically generated system receipt. No physical signature is required.', 15, y + 8);
    doc.text('Please use your Request ID on the portal homepage to monitor review progress or collect your credentials.', 15, y + 13);
    doc.text('Ethiopian Statistics Service, ICT Department Helpdesk. Addis Ababa, Ethiopia.', 15, y + 18);

    doc.save(`ESS_Receipt_${submissionResult.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // If success, show acknowledgement screen
  if (submissionResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          
          {/* Top Decorative Colors of Ethiopia flag */}
          <div className="h-2 flex">
            <div className="flex-1 bg-emerald-600" />
            <div className="flex-1 bg-yellow-500" />
            <div className="flex-1 bg-red-600" />
          </div>

          <div className="p-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Request Submitted Formally</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your request has been saved in the centralized ESS Access Request directory. Administrators have been notified.
              </p>
            </div>

            {/* Core Request ID card */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 p-6 rounded-2xl text-center space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">Your Unique Request ID</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider select-all pt-1">
                  {submissionResult.id}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic pt-2">
                  (Tip: Double click to copy this ID to search or track later)
                </p>
              </div>

              {/* QR Code and Meta Details */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 border-t border-slate-200/50 dark:border-slate-900">
                <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-center">
                  {/* Interactive Mock SVG QR Code */}
                  <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-900">
                    <rect width="100" height="100" fill="white" />
                    {/* QR Anchors */}
                    <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                    <rect x="10" y="10" width="15" height="15" fill="white" />
                    <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                    <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                    <rect x="75" y="10" width="15" height="15" fill="white" />
                    <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                    <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                    <rect x="10" y="75" width="15" height="15" fill="white" />
                    <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                    {/* QR Random data pixels */}
                    <rect x="35" y="10" width="10" height="5" fill="currentColor" />
                    <rect x="50" y="5" width="15" height="10" fill="currentColor" />
                    <rect x="40" y="20" width="15" height="15" fill="currentColor" />
                    <rect x="15" y="40" width="20" height="10" fill="currentColor" />
                    <rect x="5" y="55" width="10" height="5" fill="currentColor" />
                    <rect x="45" y="45" width="20" height="15" fill="currentColor" />
                    <rect x="75" y="40" width="15" height="10" fill="currentColor" />
                    <rect x="70" y="60" width="10" height="20" fill="currentColor" />
                    <rect x="40" y="70" width="15" height="5" fill="currentColor" />
                    <rect x="50" y="80" width="25" height="15" fill="currentColor" />
                    <rect x="15" y="85" width="10" height="10" fill="currentColor" />
                  </svg>
                </div>
                <div className="text-left space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold">Requester:</strong> {submissionResult.userFullName}
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold">ESS Department:</strong> {departments.find(d => d.id === submissionResult.departmentId)?.name || 'Other'}
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold">Access System:</strong> {submissionResult.systemName}
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold">Delivery Method:</strong> {deliveryMethod}
                  </div>
                </div>
              </div>
            </div>

            {/* Print/Download and track buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Receipt (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Details</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTrack(submissionResult.id)}
                  className="px-5 py-2 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Track Status Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="space-y-6">
        
        {/* Back and Breadcrumb */}
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.cancel')}</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">{t('common.submitRequest')}</span>
        </div>

        {/* Header Title */}
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">{t('common.portalSubtitle')}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('publicRequest.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {t('publicRequest.desc')}
          </p>
        </div>

        {validationError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-3 text-xs text-red-800 dark:text-red-400 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Section banner */}
          <div className="h-1.5 flex">
            <div className="flex-1 bg-emerald-600" />
            <div className="flex-1 bg-yellow-500" />
            <div className="flex-1 bg-red-600" />
          </div>

          <div className="p-8 space-y-6">

            {/* 1. PERSONAL INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                <Briefcase className="w-4 h-4 text-[#0052cc] dark:text-blue-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">1. {t('userManagement.fullName')} &amp; {t('userProfileModal.secClearance')}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {t('publicRequest.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('publicRequest.fullNamePlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {t('userProfileModal.employeeId')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="E.g. ESS-2026-3022"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {t('publicRequest.email')} <span className="text-slate-400 dark:text-slate-600 font-semibold">({t('common.cancel')} / Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('publicRequest.emailPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {t('userProfileModal.phone')} <span className="text-slate-400 dark:text-slate-600 font-semibold">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="E.g. +251 (911) 00-0000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. REQUEST PARAMETERS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                <Layers className="w-4 h-4 text-[#0052cc] dark:text-blue-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">2. {t('dashboardPage.statsTitle')}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {t('publicRequest.department')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                  >
                    <option value="">-- {t('publicRequest.departmentSelect')} --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{getTranslatedDeptName(dept.id, dept.name, t)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {t('publicRequest.system')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={systemId}
                    onChange={(e) => setSystemId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                  >
                    <option value="">-- {t('publicRequest.systemSelect')} --</option>
                    {systems.map(sys => (
                      <option key={sys.id} value={sys.id}>{getTranslatedSystemName(sys.id, sys.name, t)} ({sys.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {t('requestDetailsModal.printCopy')} / {t('userProfileModal.notificationPrefs')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                  >
                    <option value="Email">Email</option>
                    <option value="Telegram">Telegram Channel Link</option>
                    <option value="SMS">SMS / Text Message</option>
                    <option value="Phone Call">Direct Phone Call</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Requested Priority Level
                  </label>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    {['Low', 'Medium', 'High', 'Critical'].map((pLevel) => (
                      <button
                        key={pLevel}
                        type="button"
                        onClick={() => setPriority(pLevel as PriorityLevel)}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] border transition-all text-center cursor-pointer ${
                          priority === pLevel 
                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {pLevel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. JUSTIFICATION & REMARKS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                <Clock className="w-4 h-4 text-[#0052cc] dark:text-blue-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">3. Justification & Details</h3>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Business Access Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="State the commercial or administrative reason why this system access is required."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  {t('reportsPage.remarks')} <span className="text-slate-400 dark:text-slate-600 font-semibold">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={additionalRemarks}
                  onChange={(e) => setAdditionalRemarks(e.target.value)}
                  placeholder="Specify any special credentials details or timing remarks."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 p-2.5 text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* 4. DOCUMENT UPLOAD */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                <Upload className="w-4 h-4 text-[#0052cc] dark:text-blue-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">4. {t('requestDetailsModal.attachments')}</h3>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20'
                }`}
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                />
                <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 shadow-sm">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-black text-slate-800 dark:text-white">
                    {t('publicRequest.dragDrop')}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-sm">
                    Only official PDF, PNG, or JPG formats are accepted. Maximum size: 5MB.
                  </p>
                </div>
              </div>

              {/* Uploaded attachments cards */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                        <File className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(index);
                        }}
                        className="text-[10px] font-extrabold text-red-500 hover:text-red-700 uppercase bg-transparent border-none cursor-pointer p-1"
                      >
                        {t('reportsPage.deleteBtn')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Form Actions footer */}
          <div className="px-8 py-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-sans">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Federal ESS Security Guidelines v2026.1 Apply</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-900"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>{t('publicRequest.submitting')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('common.submitRequest')}</span>
                    <Plus className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
