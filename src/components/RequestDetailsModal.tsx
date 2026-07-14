import React, { useState } from 'react';
import { AccessRequest, UserRole, RequestStatus } from '../types';
import { X, Calendar, User, Eye, Download, CheckCircle, AlertTriangle, HelpCircle, FileText, Send, Clock, Loader2, Check, ExternalLink, ShieldCheck, FileSpreadsheet, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface RequestDetailsModalProps {
  request: AccessRequest | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  currentUserId: string;
  currentUserFullName: string;
  onWorkflowAction: (
    requestId: string, 
    action: 'Approve' | 'Reject' | 'Request Info', 
    comments: string,
    provisionedCredentials?: {
      username?: string;
      tokenType?: string;
      secretValue?: string;
      connectionUri?: string;
      expiresAt?: string;
    }
  ) => void;
  departments: { id: string; name: string }[];
  onDeleteAttachment?: (requestId: string, attachmentIndex: number) => Promise<void>;
}

export default function RequestDetailsModal({
  request,
  isOpen,
  onClose,
  currentUserRole,
  currentUserId,
  currentUserFullName,
  onWorkflowAction,
  departments,
  onDeleteAttachment
}: RequestDetailsModalProps) {
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState('');
  const [showRequestInfoConfirm, setShowRequestInfoConfirm] = useState(false);

  // Dynamic Credentials state configurations
  const [iamUsername, setIamUsername] = useState('');
  const [credentialType, setCredentialType] = useState('Password / IAM Token');
  const [secretKeyValue, setSecretKeyValue] = useState('');
  const [connectionEndPoint, setConnectionEndPoint] = useState('');
  const [tokenCopied, setTokenCopied] = useState(false);
  const [showSecretValue, setShowSecretValue] = useState(false);

  // Supporting documentation fetch states
  const [fetchingStates, setFetchingStates] = useState<{ [key: number]: boolean }>({});
  const [fetchedStates, setFetchedStates] = useState<{ [key: number]: boolean }>({});
  const [activePreviewFileIndex, setActivePreviewFileIndex] = useState<number | null>(null);

  // Auto synchronizer on modal transitions
  React.useEffect(() => {
    if (request && isOpen) {
      const emailPrefix = request.userEmail ? request.userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') : 'user';
      setIamUsername(`${emailPrefix}_iam`);
      setCredentialType('Password / IAM Token');
      
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let key = "sec_acc_";
      for (let i = 0; i < 20; i++) {
        key += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      setSecretKeyValue(key);
      
      const cleanSystem = request.systemName ? request.systemName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'resource';
      setConnectionEndPoint(`${cleanSystem}.company.internal.cloud:8443`);
      
      setTokenCopied(false);
      setShowSecretValue(false);
      setActionError('');
      setComment('');
      
      // Reset fetch states for new active request
      setFetchingStates({});
      setFetchedStates({});
      setActivePreviewFileIndex(null);
    }
  }, [request, isOpen]);

  const commentsHistory = React.useMemo(() => {
    if (!request) return [];
    if (request.commentsHistory && request.commentsHistory.length > 0) {
      return request.commentsHistory;
    }

    // Synthesize history if it's not saved/persisted on the request yet
    const computed = [
      {
        id: 'initial-' + request.id,
        authorName: request.userFullName,
        authorRole: 'User' as UserRole,
        action: 'Submit',
        text: request.justification || 'No justification provided.',
        timestamp: request.createdAt
      }
    ];

    if (request.comments) {
      computed.push({
        id: 'legacy-' + request.id,
        authorName: 'Sponsoring Approver (Legacy)',
        authorRole: 'Manager' as UserRole,
        action: request.status === 'Completed' ? 'Complete' : request.status === 'Rejected' ? 'Reject' : 'Approve',
        text: request.comments,
        timestamp: request.createdAt // fallback to createdAt
      });
    }

    return computed;
  }, [request]);

  if (!isOpen || !request) return null;

  const departmentName = departments.find(d => d.id === request.departmentId)?.name || request.departmentId;

  // Calculate the request progress state for the lifecycle pipeline
  const isRejected = request.status === 'Rejected';
  
  const timelineSteps = [
    {
      id: 1,
      title: 'Submitted',
      desc: 'Access requested',
      status: 'completed' as 'pending' | 'active' | 'completed' | 'failed'
    },
    {
      id: 2,
      title: 'Review',
      desc: isRejected 
        ? 'Rejected by Manager' 
        : request.status === 'Under Review' 
          ? 'Awaiting authorization' 
          : (['Submitted', 'Pending Department Approval', 'Pending'].includes(request.status) ? 'Review queued' : 'Authorized by Manager'),
      status: isRejected 
        ? 'failed' 
        : (request.status === 'Under Review' 
            ? 'active' 
            : (['Approved', 'Pending IT Approval', 'Completed'].includes(request.status) ? 'completed' : 'active'))
    },
    {
      id: 3,
      title: 'Approved',
      desc: isRejected 
        ? 'Discontinued' 
        : ['Approved', 'Pending IT Approval'].includes(request.status) 
          ? 'Pending IT Action' 
          : (request.status === 'Completed' ? 'Sponsorship approved' : 'Pending sponsorship'),
      status: isRejected
        ? 'failed'
        : (['Approved', 'Pending IT Approval'].includes(request.status)
            ? 'active'
            : (request.status === 'Completed' ? 'completed' : 'pending'))
    },
    {
      id: 4,
      title: 'Provisioned',
      desc: isRejected 
        ? 'Discontinued' 
        : request.status === 'Completed' 
          ? 'Credentials active' 
          : 'IT queue pending',
      status: isRejected
        ? 'failed'
        : (request.status === 'Completed' ? 'completed' : 'pending')
    }
  ];

  let progressPercent = 0;
  if (isRejected) {
    progressPercent = 33;
  } else if (request.status === 'Submitted' || request.status === 'Pending Department Approval' || request.status === 'Pending') {
    progressPercent = 10;
  } else if (request.status === 'Under Review') {
    progressPercent = 33;
  } else if (request.status === 'Approved' || request.status === 'Pending IT Approval') {
    progressPercent = 66;
  } else if (request.status === 'Completed') {
    progressPercent = 100;
  }


  // Visual classes for priority
  const priorityClasses = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-900/30',
    Medium: 'bg-amber-100 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
    High: 'bg-orange-100 font-bold text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/30',
    Critical: 'bg-red-100 font-bold tracking-wide text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/30 animate-pulse',
  };

  const statusClasses: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    Submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
    'Under Review': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400',
    Approved: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400',
    Completed: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400',
    'Pending Department Approval': 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200',
    'Pending IT Approval': 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200',
    Pending: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
  };

  const handleAction = (action: 'Approve' | 'Reject' | 'Request Info') => {
    if (!comment.trim() && action !== 'Approve') {
      setActionError('Comments are mandatory for rejection or requesting more information.');
      return;
    }
    setActionError('');
    onWorkflowAction(request.id, action, comment.trim() || 'Approved.');
    setComment('');
    onClose();
  };

  const handleITProvisionComplete = () => {
    if (!iamUsername.trim()) {
      setActionError('IAM Username is required for credential provisioning.');
      return;
    }
    if (!secretKeyValue.trim()) {
      setActionError('Authentication key or secure secret access token cannot be empty.');
      return;
    }
    setActionError('');
    onWorkflowAction(
      request.id, 
      'Approve', 
      comment.trim() || 'Access provisioned. Credentials and connection indicators configured securely.',
      {
        username: iamUsername,
        tokenType: credentialType,
        secretValue: secretKeyValue,
        connectionUri: connectionEndPoint,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    );
    setComment('');
    onClose();
  };

  const handleAutoGenerateSecret = () => {
    let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let prefix = "sec_acc_";
    let length = 20;

    if (credentialType === 'SAML Token / Certificate') {
      charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      prefix = "SAML_CERT_";
      length = 32;
    } else if (credentialType === 'API Keypair / Access Token') {
      charset = "abcdef0123456789";
      prefix = "jwt_live_";
      length = 24;
    } else if (credentialType === 'SSH Private Key') {
      charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      prefix = "ssh-rsa_key_";
      length = 40;
    }

    let generated = prefix;
    for (let i = 0; i < length; i++) {
      generated += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setSecretKeyValue(generated);
  };

  const handleFetchFile = async (index: number, fileName: string) => {
    setFetchingStates(prev => ({ ...prev, [index]: true }));
    
    try {
      const file = request?.attachments?.[index];
      if (file && file.filePath) {
        // Retrieve a live signed URL from Supabase Storage since the bucket is private!
        const { data, error } = await supabase.storage
          .from('app-files')
          .createSignedUrl(file.filePath, 3600); // 1 hour expiry
          
        if (error) {
          throw error;
        }
        
        if (data?.signedUrl) {
          file.previewUrl = data.signedUrl;
        }
      } else {
        // Fallback for mock/legacy screenshots to simulate server roundtrip
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (err) {
      console.error("Error fetching private signed URL:", err);
    } finally {
      setFetchingStates(prev => ({ ...prev, [index]: false }));
      setFetchedStates(prev => ({ ...prev, [index]: true }));
      setActivePreviewFileIndex(index);
    }
  };

  // Determine if active user can approve this request based on security workflow rules:
  // "Flow: User -> Manager -> IT Admin -> Access Granted"
  // Manager approves requests in 'Submitted', 'Under Review', 'Pending', or 'Pending Department Approval' status.
  // IT Admin processes approved requests in 'Approved' or 'Pending IT Approval' status to mark them as 'Completed' and grant access.
  const canActAsManager = (
    (currentUserRole === 'Manager' || currentUserRole === 'Department Manager' || currentUserRole === 'Super Admin') && 
    (request.status === 'Submitted' || request.status === 'Under Review' || request.status === 'Pending' || request.status === 'Pending Department Approval')
  ) || (
    (currentUserRole === 'IT Admin' || currentUserRole === 'IT Support' || currentUserRole === 'Super Admin') && 
    (request.status === 'Pending' || request.status === 'Pending Department Approval')
  );

  const canActAsITAdmin = (currentUserRole === 'IT Admin' || currentUserRole === 'Super Admin' || currentUserRole === 'IT Support') && 
                          (request.status === 'Approved' || request.status === 'Pending IT Approval');

  // Completed status check
  const isPendingProcess = request.status === 'Approved' || request.status === 'Pending IT Approval';

  return (
    <div id="request-details-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm overflow-y-auto animate-backdrop-fade">
      <div id="request-details-modal" className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col my-8 animate-modal-slide">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span id="request-id" className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                {request.id}
              </span>
              <span id="request-status" className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusClasses[request.status]}`}>
                {request.status}
              </span>
            </div>
            <h2 id="request-title" className="text-lg font-bold text-gray-950 dark:text-white mt-2 leading-tight">
              {request.title}
            </h2>
          </div>
          <button 
            id="close-details-btn"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div id="request-details-scroll-content" className="p-6 overflow-y-auto max-h-[calc(100vh-18rem)] space-y-6">
          
          {/* Lifecycle Timeline */}
          <div id="request-lifecycle-timeline" className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Lifecycle Pipeline Timeline</span>
              </h3>
              <span id="timeline-status-badge" className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wide uppercase ${
                request.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20' :
                request.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20' :
                request.status === 'Approved' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              }`}>
                {request.status === 'Completed' ? 'Access Granted' : request.status === 'Rejected' ? 'Access Denied' : 'In Progress'}
              </span>
            </div>

            <div className="relative flex items-center justify-between w-full px-2">
              {/* Timeline Connector Line Background */}
              <div className="absolute left-6 right-6 top-[15px] h-0.5 bg-gray-200 dark:bg-gray-800 -z-0" />
              
              {/* Timeline Active Progress Line Filler */}
              <div 
                id="timeline-active-bar"
                className={`absolute left-6 top-[15px] h-0.5 transition-all duration-500 -z-0 ${
                  request.status === 'Rejected' ? 'bg-rose-500' : 'bg-blue-500 dark:bg-blue-400'
                }`}
                style={{ width: `calc(${progressPercent}% - 12px)` }}
              />

              {/* Timeline Steps */}
              {timelineSteps.map((step) => {
                const isCompleted = step.status === 'completed';
                const isActive = step.status === 'active';
                const isFailed = step.status === 'failed';
                
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
                    {/* Circle Node */}
                    <div 
                      id={`timeline-step-node-${step.id}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 font-bold border ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                          : isFailed
                            ? 'bg-rose-500 border-rose-650 text-white shadow-md shadow-rose-500/10'
                            : isActive 
                              ? 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-550 text-white ring-4 ring-blue-550/15 dark:ring-blue-550/25' 
                              : 'bg-white dark:bg-gray-950 border-gray-350 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-white stroke-[3px]" />
                      ) : isFailed ? (
                        <X className="w-4 h-4 text-white stroke-[3px]" />
                      ) : isActive ? (
                        <Clock className="w-4 h-4 animate-pulse text-white" />
                      ) : (
                        <span className="text-xs">{step.id}</span>
                      )}
                    </div>

                    {/* Step Labels */}
                    <span className={`text-[11px] font-bold mt-2.5 text-center ${
                      isFailed ? 'text-rose-600 dark:text-rose-450' :
                      isActive ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 
                      isCompleted ? 'text-emerald-600 dark:text-emerald-450' : 
                      'text-gray-500 font-semibold'
                    }`}>
                      {step.title}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 text-center leading-tight max-w-[90px] hidden sm:block font-medium">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Display Credentials if completed and exists */}
          {request.status === 'Completed' && (
            <div className="border border-emerald-250 dark:border-emerald-900/60 rounded-xl p-4 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider">Secure Access Credentials Provisioned</h4>
              </div>
              
              <div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-emerald-100 dark:border-emerald-955 space-y-2.5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 leading-relaxed">
                  <div>
                    <span className="text-gray-400 font-bold text-[10px] block uppercase tracking-wider">IAM Username Profile</span>
                    <span className="font-mono text-gray-900 dark:text-gray-200 font-bold bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                      {request.provisionedCredentials?.username || `${request.userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')}_iam`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold text-[10px] block uppercase tracking-wider">Credential Token Type</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                      {request.provisionedCredentials?.tokenType || 'Password / IAM Token'}
                    </span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-gray-400 font-bold text-[10px] block uppercase tracking-wider">Gateway System Endpoint</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 select-all font-semibold break-all bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                      {request.provisionedCredentials?.connectionUri || `${request.systemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.company.internal.cloud:8443`}
                    </span>
                  </div>
                  <div className="col-span-1 md:col-span-2 relative">
                    <span className="text-gray-400 font-bold text-[10px] block uppercase tracking-wider mb-1">Identity Access Key secret</span>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-250 dark:border-gray-800">
                      <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300 break-all select-all flex-1 font-semibold">
                        {showSecretValue 
                          ? (request.provisionedCredentials?.secretValue || 'sec_acc_z83fkal029375hfdks')
                          : '••••••••••••••••••••••••••••••••••••'
                        }
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSecretValue(!showSecretValue)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-gray-500 cursor-pointer animate-none"
                        title={showSecretValue ? "Hide Secret" : "Reveal Secret"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = request.provisionedCredentials?.secretValue || 'sec_acc_z83fkal029375hfdks';
                          navigator.clipboard.writeText(val);
                          setTokenCopied(true);
                          setTimeout(() => setTokenCopied(false), 2000);
                        }}
                        className="p-1 px-2 hover:bg-emerald-150 dark:hover:bg-emerald-950 rounded transition-colors text-emerald-600 dark:text-emerald-400 font-black text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <span>{tokenCopied ? 'Copied' : 'Copy Key'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 text-[10px] font-semibold text-rose-800 dark:text-rose-450 bg-rose-50/40 dark:bg-rose-950/25 p-2.5 border border-rose-100 dark:border-rose-950 rounded-xl leading-relaxed">
                    ⚠️ COMPLIANCE ADVISORY: This is a secure operational IAM token. Sharing credentials, checking in keys to repositories, or logging secrets to terminal output represents a Direct Security Audit Infraction.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {(() => {
            const createdTime = new Date(request.createdAt);
            const now = new Date();
            const isOverdue = (request.status === 'Submitted' || request.status === 'Under Review') && 
              (now.getTime() - createdTime.getTime()) > (48 * 60 * 60 * 1000);
            return isOverdue ? (
              <div className="bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40 p-4 rounded-xl flex items-start gap-3 text-xs animate-pulse">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-orange-900 dark:text-orange-400">Automated SLA Escalation active</div>
                  <p className="text-orange-850 dark:text-orange-300 font-semibold leading-relaxed">
                    This access request has been inactive for more than 48 hours without receiving review feedback. Sponsoring managers have been automatically notified to take immediate action.
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/50">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Requester</div>
              <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>{request.userFullName}</span>
              </div>
              <div className="text-xs text-gray-500 shrink-0 select-all truncate">{request.userEmail}</div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Target System</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                {request.systemName}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{request.accessType}</div>
            </div>

            <div className="col-span-1 md:col-span-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Details</div>
              <div className="text-xs text-gray-700 dark:text-gray-300 mt-1 flex flex-col gap-0.5">
                <div>Dept: <span className="font-medium text-gray-900 dark:text-white">{departmentName}</span></div>
                <div className="flex items-center gap-1">
                  <span>Priority:</span>
                  <span className={`px-1.5 py-0.2 text-[10px] uppercase font-bold rounded-md border ${priorityClasses[request.priority]}`}>
                    {request.priority}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-3 border-t border-gray-100 dark:border-gray-800/50 pt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Validity: {request.startDate} {request.endDate ? `to ${request.endDate}` : '(Indefinite)'}</span>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Business Justification</h3>
            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {request.justification}
            </div>
          </div>

          {/* Attachments List */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Supporting Documentation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {request.attachments.map((file, i) => (
                  <div key={i} className={`flex flex-col p-3 bg-white dark:bg-gray-900 rounded-xl border transition-all ${
                    activePreviewFileIndex === i 
                      ? 'border-blue-500 ring-1 ring-blue-500/10' 
                      : 'border-gray-200 dark:border-gray-800'
                  } hover:shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 truncate">
                        {/\.(xlsx|xls|csv)$/i.test(file.name) ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : /\.(png|jpg|jpeg|gif|webp|bmp|heic|heif)$/i.test(file.name) ? (
                          <Eye className="w-4 h-4 text-purple-555 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold truncate max-w-[140px]">{file.name}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{file.size}</div>
                        </div>
                      </div>
                      
                      <div className="shrink-0 font-sans flex items-center gap-1.5">
                        {fetchingStates[i] ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                            <span>Fetching...</span>
                          </div>
                        ) : fetchedStates[i] ? (
                          <button 
                            type="button" 
                            onClick={() => {
                              setActivePreviewFileIndex(activePreviewFileIndex === i ? null : i);
                            }}
                            className={`p-1 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                              activePreviewFileIndex === i 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                            }`}
                          >
                            {activePreviewFileIndex === i ? (
                              <span>Hide Preview</span>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 text-emerald-600 dark:text-emerald-450" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => handleFetchFile(i, file.name)}
                            className="p-1 px-2.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-950/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/30 rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>Fetch</span>
                          </button>
                        )}

                        {onDeleteAttachment && currentUserId === request?.userId && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Are you sure you want to permanently delete this attachment? This will delete the file from storage and remove its database reference.")) {
                                await onDeleteAttachment(request.id, i);
                                if (activePreviewFileIndex === i) {
                                  setActivePreviewFileIndex(null);
                                }
                              }
                            }}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/40 cursor-pointer transition-all active:scale-95"
                            title="Delete attachment permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Preview Panel */}
          {activePreviewFileIndex !== null && request.attachments && request.attachments[activePreviewFileIndex] && (() => {
            const f = request.attachments[activePreviewFileIndex];
            const isExcel = /\.(xlsx|xls|csv)$/i.test(f.name);
            const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|heic|heif)$/i.test(f.name);
            const isPdf = /\.pdf$/i.test(f.name);
                
                return (
                  <div className="border border-blue-200 dark:border-blue-900/40 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/30 shadow-inner p-4 space-y-4 animate-modal-slide">
                    <div className="flex items-center justify-between border-b border-gray-255 dark:border-gray-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                        <div>
                          <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Secured File Vault Live Reader</h4>
                          <p className="text-[10px] text-emerald-650 dark:text-emerald-450 font-mono font-bold">SHA256: Decrypted & Verified Secure Asset</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActivePreviewFileIndex(null)}
                        className="text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 p-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isImage ? (
                      <div className="space-y-2">
                        <div className="text-[10px] text-gray-400 font-mono font-bold uppercase bg-white dark:bg-gray-900 px-2 py-1 rounded inline-block border border-gray-150 dark:border-gray-800">
                          File: {f.name} ({f.size})
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex items-center justify-center">
                          {f.previewUrl ? (
                            <img 
                              src={f.previewUrl} 
                              alt="Captured Badge" 
                              className="max-h-80 w-auto rounded-lg object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full min-h-[220px] bg-gray-950 text-emerald-400 p-4 font-mono text-xs rounded-xl space-y-3 flex flex-col justify-between text-left">
                              <div className="space-y-1.5 leading-relaxed">
                                <span className="text-gray-500 block">// AWS LIVE ENVIRONMENT PORTAL CLOUDSHOT</span>
                                <span className="text-blue-400 block"># kubectl get pods -n prod-core</span>
                                <div>NAME                         READY   STATUS    RESTARTS   AGE</div>
                                <div>prod-auth-service-78f9     1/1     Running   0          42d</div>
                                <div>prod-gateway-api-bc89       1/1     Running   2          12d</div>
                                <div className="text-yellow-400">prod-db-replica-319a        1/1     Running   0          194d</div>
                                <div className="text-emerald-400 font-bold mt-1 block">[STATUS] ALL SYTEMS RUNNING GREEN (STABLE)</div>
                              </div>
                              <div className="border-t border-gray-800 pt-2 text-[10px] text-gray-500 text-right uppercase font-bold tracking-wider">
                                WATERMARKED CONFIDENTIAL SECURITY PREVIEW
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : isExcel ? (
                      <div className="space-y-3">
                        <div className="text-[10px] text-gray-400 font-mono font-bold uppercase bg-white dark:bg-gray-900 px-2 py-1 rounded inline-block border border-gray-150 dark:border-gray-800">
                          Spreadsheet: {f.name}
                        </div>
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                          <table className="table-standard border-collapse">
                            <thead>
                              <tr className="table-header-row text-gray-500 uppercase tracking-wider">
                                <th className="th-standard border-r border-gray-150 dark:border-gray-800">Item Node</th>
                                <th className="th-standard border-r border-gray-150 dark:border-gray-800">Security Gate Requirement</th>
                                <th className="th-standard">Audited State</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 font-mono">
                              <tr>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 font-bold text-gray-900 dark:text-gray-100">C-01</td>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-300">Identity Background Screening Checked</td>
                                <td className="td-standard text-emerald-600 dark:text-emerald-450 font-black">✓ VERIFIED</td>
                              </tr>
                              <tr>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 font-bold text-gray-900 dark:text-gray-100">C-02</td>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-300">Sponsoring Manager Credentials Validated</td>
                                <td className="td-standard text-emerald-600 dark:text-emerald-450 font-black">✓ SECURED</td>
                              </tr>
                               <tr>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 font-bold text-gray-900 dark:text-gray-100">C-03</td>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-300">Justified Professional Engagement Scope</td>
                                <td className="td-standard text-emerald-600 dark:text-emerald-450 font-black">✓ APPLICABLE</td>
                              </tr>
                              <tr>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 font-bold text-gray-900 dark:text-gray-100">C-04</td>
                                <td className="td-standard border-r border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-300">Security Device Registry Enrollment</td>
                                <td className="td-standard text-amber-600 dark:text-amber-450 font-black">⚠️ ENROUTE</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : isPdf && f.previewUrl ? (
                      <div className="space-y-3 text-left">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="text-[10px] text-gray-400 font-mono font-bold uppercase bg-white dark:bg-gray-900 px-2 py-1 rounded inline-block border border-gray-150 dark:border-gray-800">
                            PDF Document: {f.name} ({f.size})
                          </div>
                          <a 
                            href={f.previewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                          >
                            <span>Open Document in New Tab</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white">
                          <iframe 
                            src={`${f.previewUrl}#toolbar=0`} 
                            className="w-full h-[450px] border-0" 
                            title={f.name}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-[10px] text-gray-400 font-mono font-bold uppercase bg-white dark:bg-gray-900 px-2 py-1 rounded inline-block border border-gray-150 dark:border-gray-800">
                          Document Type: Clear PDF Digital Letterhead
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs space-y-4 shadow-sm relative overflow-hidden text-left">
                          {/* Formal stamp mark */}
                          <div className="absolute right-4 top-4 border-4 border-dashed border-emerald-580/30 text-emerald-500/25 text-[9px] font-black uppercase tracking-widest p-1.5 rounded rotate-12 select-none">
                            VERIFIED COMPLIANT
                          </div>

                          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-xl text-blue-600 shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="leading-snug">
                              <div className="font-extrabold text-[13px] text-gray-900 dark:text-white uppercase tracking-wider">GLOBALSECURE LOGISTICS INC</div>
                              <div className="text-[10px] text-gray-400 font-mono font-bold">100 Pine Street, San Francisco, CA • SECURITY DEPT</div>
                            </div>
                          </div>

                          <div className="space-y-2.5 text-gray-700 dark:text-gray-300 leading-relaxed text-[11px]">
                            <p>
                              <strong>MEMORANDUM OF SPONSORSHIP ACCESS AUTHORIZATION</strong>
                            </p>
                            <p>
                              The bearer, designated as <strong className="text-gray-900 dark:text-white">{request.userFullName}</strong> (<span className="font-mono text-[10px]">{request.userEmail}</span>), requires access permissions for the target system: <strong className="text-blue-600 dark:text-blue-400">{(request.systemName || "AWS Cluster").toUpperCase()}</strong>.
                            </p>
                            <p>
                              Our identity assurance validation confirms that this user is assigned to the department <strong className="text-gray-900 dark:text-white">{departmentName}</strong> under authorized corporate operations. Access is designated with <strong>{request.priority} PRIORITY</strong> clearance.
                            </p>
                            <p className="italic text-gray-500 text-[10px]">
                              Identity Validation Hash: SEC-MD5-{Math.random().toString(36).substring(4, 10).toUpperCase()}-{request.id.substring(0, 5).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

          {/* System Audit/Approval Timeline */}
          <div className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-5">
            <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-400 flex items-center justify-between">
              <span>Approval Workflow & Comment History ({commentsHistory.length})</span>
              <span className="text-[10px] font-mono font-medium text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">Chronological Thread</span>
            </h3>
            
            <div className="relative border-l-2 border-gray-150 dark:border-gray-800 ml-3.5 pl-6 space-y-6 py-1">
              {commentsHistory.map((cmt, idx) => {
                // Determine icon colors and text decorations based on action
                let badgeColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                let circleBorderColor = 'border-gray-400';
                
                if (cmt.action === 'Submit') {
                  badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300 border-blue-100 dark:border-blue-900/40 border';
                  circleBorderColor = 'border-blue-500';
                } else if (cmt.action === 'Approve') {
                  badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300 border-amber-100 dark:border-amber-900/40 border';
                  circleBorderColor = 'border-amber-500';
                } else if (cmt.action === 'Complete') {
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
                  <div key={cmt.id} className="relative group">
                    {/* Circle timeline point on left */}
                    <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-gray-900 transition-colors z-10 ${circleBorderColor}`} />

                    <div className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-gray-950 dark:text-white">{cmt.authorName}</span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">({cmt.authorRole})</span>
                          
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${badgeColor}`}>
                            {cmt.action || 'Comment'}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-450 font-mono">
                          {new Date(cmt.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-gray-800 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/15 p-3 rounded-xl border border-gray-100 dark:border-gray-800/60 leading-relaxed break-words italic">
                        "{cmt.text}"
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Interactive Drawer */}
          {(canActAsManager || canActAsITAdmin) && (
            <div className="border-t border-indigo-100 dark:border-indigo-950/50 pt-5 mt-4 bg-indigo-50/20 dark:bg-indigo-950/10 p-4 rounded-xl border border-indigo-200/30">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Interactive Access Control Panel</span>
                <span className="text-[10px] font-normal uppercase px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                  {currentUserRole} View
                </span>
              </h4>
              
              {actionError && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/20 p-2 border border-red-100 dark:border-red-900/30 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="mt-3 space-y-2.5">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">
                  Approval Notes / Justification Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Approved. Provision coordinates to DB segment. or Rejection comments mandatory."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
                
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {canActAsManager ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction('Approve')}
                        className="btn-primary-minimal bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 py-2 px-4"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('Reject')}
                        className="btn-primary-minimal bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 py-2 px-4"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Reject Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRequestInfoConfirm(true)}
                        className="btn-secondary-minimal py-2 px-4 hover:border-amber-500 dark:hover:border-amber-500"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Request Info</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4 pt-1 pb-3 text-left w-full">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                          Configure IAM and system access details below. Generating secure secrets will update the user's dashboard credentiality storage upon task completion.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        {/* IAM Username */}
                        <div>
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider text-[10px]">
                            IAM Username Profile <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={iamUsername}
                            onChange={(e) => setIamUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="username_iam"
                          />
                        </div>

                        {/* Credential type */}
                        <div>
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider text-[10px]">
                            Credential Token Style <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={credentialType}
                            onChange={(e) => {
                              setCredentialType(e.target.value);
                              // Auto regenerate corresponding to type
                              setTimeout(() => {
                                handleAutoGenerateSecret();
                              }, 50);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Password / IAM Token">Password / IAM Token</option>
                            <option value="API Keypair / Access Token">API Keypair / Access Token</option>
                            <option value="SAML Token / Certificate">SAML Token / Certificate</option>
                            <option value="SSH Private Key">SSH Private Key</option>
                          </select>
                        </div>

                        {/* System Gateway Host */}
                        <div className="md:col-span-2">
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider text-[10px]">
                            Connection Gateway Endpoint Host <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={connectionEndPoint}
                            onChange={(e) => setConnectionEndPoint(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="subsystem.company.internal.cloud:8443"
                          />
                        </div>

                        {/* Security Secret Token Key */}
                        <div className="md:col-span-2">
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 tracking-wider text-[10px] uppercase flex items-center justify-between">
                            <span>Private Authorization Secret Token</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type={showSecretValue ? "text" : "password"}
                              value={secretKeyValue}
                              onChange={(e) => setSecretKeyValue(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white dark:bg-gray-950 border border-gray-250 dark:border-gray-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                              placeholder="Generate or supply access secrets..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowSecretValue(!showSecretValue)}
                              className="p-2 border border-gray-250 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors text-gray-500 cursor-pointer"
                              title={showSecretValue ? "Hide" : "Reveal"}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleAutoGenerateSecret}
                              className="px-3.5 py-2 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                              title="Regenerate secure access secret keys"
                            >
                              <span>Regenerate Key</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action trigger button */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-850/65 flex justify-end">
                        <button
                          type="button"
                          onClick={handleITProvisionComplete}
                          className="btn-primary-minimal bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 py-2.5 px-5 w-full md:w-auto text-center justify-center font-bold flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all text-white"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-200" />
                          <span>Provision Credentials & Complete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 rounded-b-2xl">
          <button
            id="close-action-details"
            type="button"
            onClick={onClose}
            className="btn-secondary-minimal py-2 px-4"
          >
            Close
          </button>
        </div>

      </div>

      {/* Confirmation Dialog Overlay */}
      {showRequestInfoConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                  Confirm Info Clarification Request
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  You are returning this request to the employee. Please supply a mandatory, detailed explanation explaining exactly what information or credentials need validation.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">
                Instruction Details <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={comment}
                autoFocus
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe precisely what information or justification you need the user to update..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!comment.trim() && (
                <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Please provide a comment before submitting.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setShowRequestInfoConfirm(false);
                }}
                className="btn-secondary-minimal py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!comment.trim()}
                onClick={() => {
                  if (!comment.trim()) return;
                  setShowRequestInfoConfirm(false);
                  setActionError('');
                  onWorkflowAction(request.id, 'Request Info', comment.trim());
                  setComment('');
                  onClose();
                }}
                className="btn-primary-minimal py-2 px-4 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Request Clarification
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
