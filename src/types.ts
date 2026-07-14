export type UserRole = 'User' | 'Manager' | 'Department Manager' | 'IT Admin' | 'Super Admin' | 'IT Support';

export type RequestStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed' | 'Pending' | 'Pending Department Approval' | 'Pending IT Approval';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AccessType = 
  | 'Application Access' 
  | 'Database Access' 
  | 'Folder Access' 
  | 'Email Group Access' 
  | 'VPN Access' 
  | 'Server Access'
  | 'New'
  | 'Modify'
  | 'Remove';

export interface NotificationPreferences {
  onSubmitted?: boolean;
  onUnderReview?: boolean;
  onApproved?: boolean;
  onRejected?: boolean;
  onCompleted?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  status: 'Active' | 'Deactivated';
  createdAt: string;
  mfaEnabled?: boolean;
  notificationPreferences?: NotificationPreferences;
  phoneNumber?: string;
  jobTitle?: string;
  employeeId?: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface RequestComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  action?: string;
  text: string;
  timestamp: string;
}

export interface AccessRequest {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  departmentId: string;
  title: string;
  accessType: AccessType;
  systemName: string; // system/application
  justification: string;
  priority: PriorityLevel;
  startDate: string;
  endDate?: string;
  status: RequestStatus;
  createdAt: string;
  requestedRole?: string;
  manager?: string;
  currentApprover?: string;
  updatedAt?: string;
  attachments?: { name: string; size: string; previewUrl?: string; filePath?: string }[];
  comments?: string;
  commentsHistory?: RequestComment[];
  provisionedCredentials?: {
    username?: string;
    tokenType?: string;
    secretValue?: string;
    connectionUri?: string;
    expiresAt?: string;
  };
  employeeId?: string;
  departmentManagerId?: string;
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  action: 'Approve' | 'Reject' | 'Request Info';
  comments: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userEmail: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'submitted' | 'approved' | 'rejected' | 'granted' | 'info_requested' | 'security';
}

export interface AuditLog {
  id: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  details: string;
  createdAt: string;
  ipAddress: string;
  device: string;
}

export interface SystemApplication {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface TicketComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
  isInternal?: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartmentId: string;
  userRole: UserRole;
  subject: string;
  category: 'Login Issue' | 'Access Request' | 'Account Problem' | 'Technical Issue' | 'Password Reset' | 'Bug Report' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  description: string;
  attachmentName?: string;
  attachmentSize?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  activityLogs: {
    id: string;
    action: string;
    actorName: string;
    timestamp: string;
  }[];
}

