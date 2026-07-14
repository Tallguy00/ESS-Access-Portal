import React, { useState, useRef, useEffect } from 'react';
import { AccessRequest, AccessType, PriorityLevel, Department, SystemApplication, UserProfile } from '../types';
import { X, Upload, File, Plus, AlertCircle, Camera, Check, Sparkles, Loader2, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<AccessRequest, 'userId' | 'userEmail' | 'userFullName' | 'createdAt' | 'status'> & { id?: string }) => void;
  departments: Department[];
  systems: SystemApplication[];
  profiles: UserProfile[];
  currentUser: UserProfile | null;
}

export default function CreateRequestModal({ isOpen, onClose, onSubmit, departments, systems, profiles, currentUser }: CreateRequestModalProps) {
  const [reqId, setReqId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [accessType, setAccessType] = useState<AccessType>('New');
  const [requestedRole, setRequestedRole] = useState('');
  const [manager, setManager] = useState('');
  const [systemName, setSystemName] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [departmentId, setDepartmentId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [simulatedAttachments, setSimulatedAttachments] = useState<{ name: string; size: string; previewUrl?: string; filePath?: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Draft States
  const draftKey = `access_request_draft_${currentUser?.id || 'default'}`;
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedFeedback, setDraftSavedFeedback] = useState(false);

  // Check for existing draft when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          setHasDraft(true);
        } else {
          setHasDraft(false);
        }
      } catch (err) {
        console.error("Error reading draft:", err);
      }
    }
  }, [isOpen, draftKey]);

  const handleSaveDraft = () => {
    try {
      const draftData = {
        title,
        accessType,
        systemName,
        requestedRole,
        manager,
        departmentId,
        priority,
        startDate,
        endDate,
        justification,
        simulatedAttachments
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftSavedFeedback(true);
      setHasDraft(false); // Hide the restore banner since we just saved a fresh one
      setTimeout(() => setDraftSavedFeedback(false), 3000);
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title !== undefined) setTitle(draft.title);
        if (draft.accessType !== undefined) setAccessType(draft.accessType);
        if (draft.systemName !== undefined) setSystemName(draft.systemName);
        if (draft.requestedRole !== undefined) setRequestedRole(draft.requestedRole);
        if (draft.manager !== undefined) setManager(draft.manager);
        if (draft.departmentId !== undefined) setDepartmentId(draft.departmentId);
        if (draft.priority !== undefined) setPriority(draft.priority);
        if (draft.startDate !== undefined) setStartDate(draft.startDate);
        if (draft.endDate !== undefined) setEndDate(draft.endDate);
        if (draft.justification !== undefined) setJustification(draft.justification);
        if (draft.simulatedAttachments !== undefined) setSimulatedAttachments(draft.simulatedAttachments);
      }
      setHasDraft(false);
    } catch (err) {
      console.error("Failed to restore draft:", err);
    }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (err) {
      console.error("Failed to discard draft:", err);
    }
  };

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Generate unique request ID when modal opens
  useEffect(() => {
    if (isOpen) {
      setReqId('req-' + generateUUID());
    }
  }, [isOpen]);

  // Pre-fill department and manager of the user when modal opens
  useEffect(() => {
    if (isOpen) {
      const userDept = currentUser?.departmentId || '';
      setDepartmentId(userDept);
      
      if (userDept) {
        // Find the manager for this department
        const deptManager = profiles.find(p => p.role === 'Manager' && p.departmentId === userDept);
        if (deptManager) {
          setManager(deptManager.fullName);
        } else {
          setManager('');
        }
      } else {
        setManager('');
      }
    }
  }, [isOpen, currentUser, profiles]);

  // Camera & Mock Screenshot states
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'generate'>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [genErrorType, setGenErrorType] = useState('Access Denied (403)');
  const [genDetails, setGenDetails] = useState('Workspace authorization policy group invalidation detected.');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      setCameraError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFileToSupabase = async (fileOrBlob: File | Blob, originalName: string): Promise<{ filePath: string; signedUrl: string }> => {
    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    
    // 2. Generate path safely (handling Android files without extension or uppercase/malformed names)
    let extension = 'png';
    const hasDot = originalName.includes('.');
    if (hasDot) {
      const parts = originalName.split('.');
      const ext = parts[parts.length - 1].toLowerCase().trim();
      // Validate that extension contains only standard alphanumeric characters (2 to 5 letters)
      if (/^[a-z0-9]{2,5}$/.test(ext)) {
        extension = ext;
      }
    } else if (fileOrBlob.type) {
      // Fallback to mime type mapping if filename has no dot
      const mimeExt = fileOrBlob.type.split('/').pop();
      if (mimeExt && /^[a-z0-9]{2,5}$/.test(mimeExt.toLowerCase())) {
        extension = mimeExt.toLowerCase();
      }
    }
    
    const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const filePath = `${userId}/requests/${reqId}/${uuid}.${extension}`;
    
    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('app-files')
      .upload(filePath, fileOrBlob, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Supabase Storage upload error:", error);
      throw error;
    }
    
    // 4. Create signed URL since the bucket is private
    const { data: signData, error: signError } = await supabase.storage
      .from('app-files')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
      
    if (signError || !signData?.signedUrl) {
      console.error("Supabase Storage sign error:", signError);
      throw signError || new Error("Could not create signed URL");
    }
    
    return {
      filePath,
      signedUrl: signData.signedUrl
    };
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const processFiles = async (files: FileList) => {
    const filesArray = Array.from(files);
    setIsUploading(true);
    setValidationError('');
    
    for (const file of filesArray) {
      try {
        // Clean up mobile filename for display if it has a weird name or no dot
        let cleanName = file.name;
        if (!file.name.includes('.') || file.name.startsWith('content:') || file.name.includes(':')) {
          const extension = file.type ? file.type.split('/').pop() || 'png' : 'png';
          cleanName = `uploaded_file_${Math.floor(1000 + Math.random() * 9000)}.${extension}`;
        }

        // Upload file to Supabase Storage directly
        const uploadResult = await uploadFileToSupabase(file, cleanName);
        
        const attachmentObj = {
          name: cleanName,
          size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
          previewUrl: uploadResult.signedUrl,
          filePath: uploadResult.filePath
        };
        
        setSimulatedAttachments(prev => [...prev, attachmentObj]);
      } catch (err: any) {
        console.error("Error uploading file to storage:", err);
        setValidationError(`Failed to upload ${file.name} to storage: ${err.message || err}`);
      }
    }
    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeAttachment = async (index: number) => {
    const attachment = simulatedAttachments[index];
    if (attachment && attachment.filePath) {
      try {
        const { error } = await supabase.storage
          .from('app-files')
          .remove([attachment.filePath]);
        if (error) {
          console.error("Failed to delete file from Supabase Storage:", error);
        }
      } catch (err) {
        console.error("Error deleting file from Supabase Storage:", err);
      }
    }
    setSimulatedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setCameraError('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam access API (navigator.mediaDevices.getUserMedia) is not supported in this frame context.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError(err?.message || "Camera access failed. Permission dismissed or blocked by third-party iframe constraints.");
      setIsCameraActive(false);
    }
  };

  const handleGenerateBadgeSimulation = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw a real corporate access card badge background
      const gr = ctx.createLinearGradient(0, 0, 640, 480);
      gr.addColorStop(0, '#1e293b');
      gr.addColorStop(1, '#0f172a');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, 640, 480);

      // Card boundary box
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 40, 440, 400);

      // Header color stripe on badge
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(102, 42, 436, 100);

      // Corporate Badge Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('SECURE ENTERPRISE KEY', 140, 85);
      
      ctx.fillStyle = '#bae6fd';
      ctx.font = '12px Courier';
      ctx.fillText('PROPRIETARY IDENTITY SYSTEMS', 142, 115);

      // ID Avatar screen placeholder
      ctx.fillStyle = '#334155';
      ctx.fillRect(160, 180, 120, 150);

      // Let's draw a stylized person avatar head/shoulders in the placeholder block
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(220, 230, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(220, 290, 40, 30, 0, 0, Math.PI, true);
      ctx.fill();

      // Badge Credentials text info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('CLEARANCE DEPT:', 305, 205);
      
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText((departments.find(d => d.id === departmentId)?.name || 'IT SECTOR').toUpperCase(), 305, 225);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('SYSTEM TARGET:', 305, 260);

      ctx.fillStyle = '#fdba74';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText((systemName || 'ADMIN CORE DIRECTORY').toUpperCase(), 305, 280);

      // ID Badge Serial numbers
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`SERIAL: ${Math.floor(100000 + Math.random() * 900000)}`, 305, 315);
      const randomSig = Math.random().toString(36).substring(3, 9).toUpperCase();
      ctx.fillText(`AUTHORITY: AUT-SEC-${randomSig}`, 305, 335);

      // Draw stylized barcode lines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(160, 370, 320, 40);
      
      // Barcode bars
      ctx.fillStyle = '#000000';
      let currentX = 175;
      while (currentX < 465) {
        const barWidth = Math.random() > 0.4 ? 4 : 2;
        ctx.fillRect(currentX, 370, barWidth, 40);
        currentX += barWidth + (Math.random() > 0.5 ? 4 : 2);
      }

      const imgUrl = canvas.toDataURL('image/png');
      const blob = dataURLtoBlob(imgUrl);
      const filename = `badge_credentials_verification_${Math.floor(1000 + Math.random() * 9000)}.png`;

      setIsUploading(true);
      uploadFileToSupabase(blob, filename).then((uploadResult) => {
        const attachmentObj = {
          name: filename,
          size: '0.15MB',
          previewUrl: uploadResult.signedUrl,
          filePath: uploadResult.filePath
        };
        setSimulatedAttachments(prev => [...prev, attachmentObj]);
        setCameraError('');
      }).catch((err) => {
        console.error("Camera badge capture simulation upload failed", err);
        setValidationError(`Failed to upload badge simulation to storage: ${err.message || err}`);
      }).finally(() => {
        setIsUploading(false);
      });
    } catch (err) {
      console.error("Camera badge capture simulation failed", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgUrl = canvas.toDataURL('image/png');
        const blob = dataURLtoBlob(imgUrl);
        const filename = `camera_screenshot_${Math.floor(1000 + Math.random() * 9000)}.png`;

        setIsUploading(true);
        uploadFileToSupabase(blob, filename).then((uploadResult) => {
          const attachmentObj = {
            name: filename,
            size: '0.1MB',
            previewUrl: uploadResult.signedUrl,
            filePath: uploadResult.filePath
          };
          setSimulatedAttachments(prev => [...prev, attachmentObj]);
          stopCamera();
        }).catch((err) => {
          console.error("Camera photo upload failed", err);
          setValidationError(`Failed to upload photo to storage: ${err.message || err}`);
        }).finally(() => {
          setIsUploading(false);
        });
      }
    } catch (err) {
      console.error("Snapshot drawing failed", err);
    }
  };

  const handleGenerateScreenshot = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark terminal theme background
      const gradient = ctx.createLinearGradient(0, 0, 0, 360);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 360);

      // Tech Grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 640; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 360); ctx.stroke();
      }
      for (let j = 0; j < 360; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(640, j); ctx.stroke();
      }

      // Title window decoration
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 640, 36);

      // Red, yellow, green shell circles
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(20, 18, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(36, 18, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(52, 18, 5, 0, 2 * Math.PI); ctx.fill();

      // Console title
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${(systemName || 'SYSTEM_DIRECTORY_CORE').toUpperCase()} DIAGNOSTICS LOG`, 75, 22);

      // Warning Box bounds
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 70, 560, 110, 8);
      ctx.fill();
      ctx.stroke();

      // Error highlight column stripe
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(40, 70, 6, 110);

      // Text traces
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('CRITICAL EXCEPTION SECURITY_CREDENTIALS_VIOLATION', 65, 105);

      // Warning Box Info
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText(`Type: ${genErrorType}`, 65, 130);
      
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Target: ${systemName || 'Unspecified App_Segment'}`, 65, 150);
      ctx.fillText(`Nature: Privilege Group Assertion Required`, 65, 165);

      // CLI interaction trace
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('DIAGNOSTIC TRACE BACK:', 40, 210);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText(`$ verify-claims --app="${systemName || 'TargetSystem'}" --action="${accessType}"`, 40, 235);

      ctx.fillStyle = '#fca5a5';
      ctx.fillText(`[REJECTED] Principal identity context lack correct scopes.`, 40, 255);
      
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText(`[SUCCESS] Evidence simulation complete. Form verification bypass active.`, 40, 275);

      // Details block
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'italic 10px monospace';
      ctx.fillText(`Note: "${genDetails || 'Supporting context'}"`, 40, 310);

      // Cryto secure token tag on bottom-right
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.font = '9px monospace';
      const sigHash = Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      ctx.fillText(`EVIDENCE-SHA256: [${sigHash}]`, 440, 340);

      const imgUrl = canvas.toDataURL('image/png');
      const blob = dataURLtoBlob(imgUrl);
      const filename = `mockup_diagnostic_evidence_${Math.floor(100 + Math.random() * 900)}.png`;

      setIsUploading(true);
      uploadFileToSupabase(blob, filename).then((uploadResult) => {
        const attachmentObj = {
          name: filename,
          size: '0.1MB',
          previewUrl: uploadResult.signedUrl,
          filePath: uploadResult.filePath
        };
        setSimulatedAttachments(prev => [...prev, attachmentObj]);
      }).catch((err) => {
        console.error("Screenshot upload failed", err);
        setValidationError(`Failed to upload screenshot to storage: ${err.message || err}`);
      }).finally(() => {
        setIsUploading(false);
      });
    } catch (err) {
      console.error("Screenshot simulation failed", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      setValidationError('Please wait while attachments are uploading to storage.');
      return;
    }
    if (isSaving) {
      return;
    }
    if (!title.trim() || !systemName || !justification.trim() || !departmentId || !requestedRole.trim() || !manager) {
      setValidationError('Please complete all required fields (*).');
      return;
    }
    setValidationError('');
    setIsSaving(true);

    try {
      await onSubmit({
        id: reqId,
        title,
        accessType,
        systemName,
        justification,
        priority,
        departmentId,
        startDate,
        endDate: endDate || undefined,
        requestedRole,
        manager,
        currentApprover: manager,
        attachments: simulatedAttachments.length > 0 ? simulatedAttachments : undefined
      });

      // Reset status & Stop camera & Clear draft
      try {
        localStorage.removeItem(draftKey);
      } catch (err) {
        console.error("Error removing draft on submit:", err);
      }
      setTitle('');
      setAccessType('New');
      setRequestedRole('');
      setManager('');
      setSystemName('');
      setJustification('');
      setPriority('Medium');
      setDepartmentId('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setSimulatedAttachments([]);
      stopCamera();
      onClose();
    } catch (err: any) {
      console.error("Failed to submit request", err);
      setValidationError(err?.message || 'An error occurred while saving the request.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="create-request-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm overflow-y-auto animate-backdrop-fade">
      <div id="create-request-modal" className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col my-8 animate-modal-slide">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Submit New Access Request</h2>
            <p className="text-sm text-gray-500 mt-1">Submit access privilege requests for security approval workflows.</p>
          </div>
          <button 
            id="close-modal-btn"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(100vh-16rem)] space-y-5">
          {validationError && (
            <div id="form-error" className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {hasDraft && (
            <div id="draft-restore-banner" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-800 dark:text-blue-300 text-xs font-medium animate-pulse">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-[#0052cc] shrink-0" />
                <span>You have an unsaved draft from a previous session. Would you like to restore it?</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-restore-draft"
                  onClick={handleRestoreDraft}
                  className="px-2.5 py-1.5 bg-[#0052cc] hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  id="btn-discard-draft"
                  onClick={handleDiscardDraft}
                  className="px-2.5 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer text-[11px]"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label id="lbl-title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Request Title <span className="text-red-500">*</span>
            </label>
            <input
              id="input-title"
              type="text"
              required
              placeholder="e.g. Temporary production access for billing debug"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Access Type */}
            <div className="space-y-1.5">
              <label id="lbl-type" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Access Type <span className="text-red-500">*</span>
              </label>
              <select
                id="select-type"
                value={accessType}
                onChange={(e) => setAccessType(e.target.value as AccessType)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm"
              >
                <option value="New">New</option>
                <option value="Modify">Modify</option>
                <option value="Remove">Remove</option>
              </select>
            </div>

            {/* Target System */}
            <div className="space-y-1.5">
              <label id="lbl-system" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                System / Application <span className="text-red-500">*</span>
              </label>
              <select
                id="select-system"
                required
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm"
              >
                <option value="">Select Target System</option>
                {systems.map(sys => (
                  <option key={sys.id} value={sys.name}>{sys.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Requested Role */}
            <div className="space-y-1.5">
              <label id="lbl-requested-role" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Requested Role <span className="text-red-500">*</span>
              </label>
              <input
                id="input-requested-role"
                type="text"
                required
                placeholder="e.g. Reader, Contributor, Administrator"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm"
              />
            </div>

            {/* Manager */}
            <div className="space-y-1.5">
              <label id="lbl-manager" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Manager <span className="text-red-500">*</span>
              </label>
              {profiles && profiles.length > 0 ? (
                <select
                  id="select-manager"
                  required
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm cursor-pointer"
                >
                  <option value="">Select Department Manager</option>
                  {profiles
                    .filter(p => {
                      const isDeptManager = (p.role === 'Manager' || p.role === 'Department Manager') && p.departmentId === departmentId;
                      const isAdmin = p.role === 'Super Admin' || p.role === 'IT Admin';
                      return isDeptManager || isAdmin;
                    })
                    .map(mgr => (
                      <option key={mgr.id} value={mgr.fullName}>{mgr.fullName} ({mgr.email})</option>
                    ))}
                </select>
              ) : (
                <input
                  id="input-manager"
                  type="text"
                  required
                  placeholder="Enter Manager's Full Name"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-1.5">
              <label id="lbl-department" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Sponsoring Department <span className="text-red-500">*</span>
              </label>
              <select
                id="select-department"
                required
                value={departmentId}
                onChange={(e) => {
                  const newDeptId = e.target.value;
                  setDepartmentId(newDeptId);
                  // Find the manager for this newly selected department and pre-fill
                  const deptManager = profiles.find(p => p.role === 'Manager' && p.departmentId === newDeptId);
                  if (deptManager) {
                    setManager(deptManager.fullName);
                  } else {
                    setManager('');
                  }
                }}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm cursor-pointer"
              >
                <option value="">Select Department</option>
                {departments.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            </div>

            {/* Priority Level */}
            <div className="space-y-1.5">
              <label id="lbl-priority" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <div id="priority-options" className="flex items-center gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as PriorityLevel[]).map(level => {
                  const colors = {
                    Low: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 selected:bg-green-500 selected:text-white',
                    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                    High: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
                    Critical: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                  };
                  const activeColor = priority === level 
                    ? level === 'Low' ? 'bg-green-600 text-white border-green-600'
                      : level === 'Medium' ? 'bg-amber-500 text-white border-amber-500'
                      : level === 'High' ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-red-600 text-white border-red-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300';

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border text-center transition-all ${activeColor}`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label id="lbl-start-date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Access Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="input-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label id="lbl-end-date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Access End Date (Optional)
              </label>
              <input
                id="input-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm"
              />
            </div>
          </div>

          {/* Business Justification */}
          <div className="space-y-1.5">
            <label id="lbl-justification" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Business Justification / Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              id="input-justification"
              required
              rows={4}
              placeholder="Provide a detailed business description of why this access is required, listing any active projects, tasks, or security references."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-shadow text-sm leading-relaxed"
            />
          </div>

          {/* Supporting Evidence Area */}
          <div className="space-y-4 border-t border-gray-150 dark:border-gray-805 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label id="lbl-uploads" className="block text-sm font-extrabold text-blue-900 dark:text-blue-400">
                Supporting Evidence & Context
              </label>
              
              {/* Tab Selector Buttons */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
                <button
                  type="button"
                  onClick={() => { stopCamera(); setActiveTab('upload'); }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  📂 File Upload
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('camera'); }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'camera'
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  📸 Camera Capture
                </button>
                <button
                  type="button"
                  onClick={() => { stopCamera(); setActiveTab('generate'); }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'generate'
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  ✨ System Mockup
                </button>
              </div>
            </div>

            {/* TAB CONTENT: FILE UPLOAD */}
            {activeTab === 'upload' && (
              <div
                id="drag-drop-zone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20' 
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/10 dark:bg-gray-950/20'
                }`}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label 
                  htmlFor="file-input"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2 group"
                >
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-all">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Click to upload</span> or drag and drop files
                  </div>
                  <div className="text-[10px] text-gray-400">PDF, DOCX, JPEG, PNG, Max 10MB</div>
                </label>
              </div>
            )}

            {/* TAB CONTENT: DEVICE CAMERA */}
            {activeTab === 'camera' && (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/30 dark:bg-gray-900/40 text-center space-y-4">
                {cameraError && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-left text-xs text-amber-800 dark:text-amber-400 space-y-1.5">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Camera Access Unavailable</span>
                    </div>
                    <p className="leading-relaxed">
                      {cameraError} 
                    </p>
                    <p className="font-semibold text-[10px] text-amber-700 dark:text-amber-300">
                      Inside sandboxed preview iframes, webcam features are often restricted. You can open the app in a new tab, or use our instant high-fidelity secure badge mockup simulator below.
                    </p>
                  </div>
                )}

                {!isCameraActive ? (
                  <div className="py-4 flex flex-col items-center justify-center space-y-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-full text-blue-600 dark:text-blue-400">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">Use Device Webcam / Camera</h4>
                        <p className="text-[11px] text-gray-500 max-w-sm mt-0.5 mx-auto">Authorize camera permissions to capture a live workspace screenshot or badge validation directly from your browser.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Activate Webcam</span>
                      </button>

                      <span className="text-xs text-gray-400 font-bold">OR</span>

                      <button
                        type="button"
                        onClick={handleGenerateBadgeSimulation}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-250 animate-pulse" />
                        <span>Simulate Secure Badge Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative aspect-video max-w-md mx-auto rounded-xl bg-black overflow-hidden border-2 border-blue-500 shadow-md">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[9px] font-mono font-bold uppercase rounded-md flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                        <span>Webcam Live Feed</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Capture Snap & Attach</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-extrabold text-[11px] rounded-lg transition-all cursor-pointer"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: GENERATED SYSTEM BLUEPRINT */}
            {activeTab === 'generate' && (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/30 dark:bg-gray-900/40 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Interactive System Evidence Mockup & Blueprint Generator</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Synthesize high-fidelity system telemetry logs, permission mismatch diagnostics, or connection error screens directly in your browser. Perfect for testing and demonstrating credentials blocks.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block">Preset System Error</label>
                    <select
                      value={genErrorType}
                      onChange={(e) => setGenErrorType(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white focus:outline-none"
                    >
                      <option value="Access Denied (403)">Access Denied (HTTP 403)</option>
                      <option value="Connection Timeout (504)">Connection Timeout (HTTP 504)</option>
                      <option value="SAML SSO Assertion Expired">SAML SSO Assertion Expired</option>
                      <option value="LDAP Connection Reset">LDAP Connection Reset</option>
                      <option value="IAM Missing permission Group">IAM Missing permission Group</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 block">Custom Trace Log Details</label>
                    <input
                      type="text"
                      value={genDetails}
                      onChange={(e) => setGenDetails(e.target.value)}
                      placeholder="e.g. Missing developer segmentation keys..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:text-right">
                  <button
                    type="button"
                    onClick={handleGenerateScreenshot}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Evidence & Attach</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of uploaded files with screenshots thumbnails */}
            {simulatedAttachments.length > 0 && (
              <div id="attachments-box" className="mt-4 space-y-2">
                <div className="text-xs font-extrabold text-gray-500 dark:text-gray-400">Attached Supporting Evidence:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {simulatedAttachments.map((f, i) => (
                    <div key={i} className="flex flex-col p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs border border-gray-150 dark:border-gray-800 relative group overflow-hidden">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 truncate">
                        <File className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="truncate flex-1 min-w-0">
                          <span className="font-semibold truncate block text-gray-900 dark:text-white leading-tight">{f.name}</span>
                          <span className="text-[10px] text-gray-400">{f.size}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="text-gray-400 hover:text-red-650 dark:hover:text-red-400 font-extrabold text-[10px] uppercase tracking-wider px-2 py-1 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750 rounded-lg hover:border-red-200 dark:hover:border-red-900/30 transition-all cursor-pointer select-none"
                          title="Remove this attachment"
                        >
                          Remove
                        </button>
                      </div>

                      {f.previewUrl && (
                        <div className="mt-2 text-center rounded-lg overflow-hidden border border-gray-100 dark:border-gray-750 bg-black max-h-32 aspect-video flex items-center justify-center relative">
                          <img
                            src={f.previewUrl}
                            alt={f.name}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 rounded-b-2xl">
          {draftSavedFeedback && (
            <div id="draft-saved-feedback" className="mr-auto flex items-center gap-1.5 text-xs text-emerald-650 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30">
              <Check className="w-3.5 h-3.5" />
              <span>Draft saved!</span>
            </div>
          )}
          <button
            id="cancel-request-btn"
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="btn-secondary-minimal py-2 px-4"
          >
            Cancel
          </button>
          <button
            id="save-draft-btn"
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4 text-gray-400" />
            <span>Save Draft</span>
          </button>
          <button
            id="submit-request-btn"
            type="button"
            disabled={isUploading || isSaving}
            onClick={handleSubmit}
            className={`btn-primary-minimal py-2 px-5 ${(isUploading || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUploading || isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Submit Request'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
