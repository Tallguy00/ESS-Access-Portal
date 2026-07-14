import { Department, SystemApplication, AccessRequest, AuditLog, AppNotification } from './types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dep-dir', name: 'Director Office', description: 'Office of the Director-General of ESS' },
  { id: 'dep-deputy', name: 'Deputy Director Office', description: 'Deputy Director Office for sector management' },
  { id: 'dep-business', name: 'Business Statistics', description: 'Industrial, financial, and trade statistics compilation' },
  { id: 'dep-household', name: 'Household Statistics', description: 'Socio-economic, demographic, and household census coordination' },
  { id: 'dep-ict', name: 'ICT Department', description: 'Infrastructure, cybersecurity, database, and system operations' },
  { id: 'dep-hr', name: 'Human Resource', description: 'Staff recruitment, placement, and employee relations' },
  { id: 'dep-finance', name: 'Finance', description: 'Budgeting, accounting, and official payroll operations' },
  { id: 'dep-other', name: 'Other Departments', description: 'General regional branches and supportive staff offices' }
];

export const INITIAL_SYSTEMS: SystemApplication[] = [
  { id: 'sys-statbank', name: 'StatBank', description: 'ESS primary statistical database gateway for public and internal indicators', category: 'Database' },
  { id: 'sys-vms', name: 'VMS', description: 'Visitor and Vehicle Management System tracking ESS facilities', category: 'Application' },
  { id: 'sys-dashboard', name: 'Dashboard System', description: 'Interactive visual reporting dashboard for statistics compilation', category: 'Application' },
  { id: 'sys-shared', name: 'Shared Drive Access', description: 'Central storage for collaborative research, reports, and census letter sheets', category: 'File Storage' },
  { id: 'sys-survey', name: 'Survey Management System', description: 'Configuration, field collection, and verification platform for regional surveys', category: 'Application' },
  { id: 'sys-db', name: 'Database Access', description: 'Direct secure access to internal SQL/PostgreSQL database instances', category: 'Database' },
  { id: 'sys-email', name: 'Email Account', description: 'Official corporate ESS email suite for staff communication', category: 'Email/Comm' },
  { id: 'sys-other', name: 'Other Internal Systems', description: 'Miscellaneous custom utility tools used across ESS regional branches', category: 'Application' }
];

export const INITIAL_REQUESTS: AccessRequest[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: '',
    userEmail: '',
    userRole: 'User',
    action: '',
    details: '',
    createdAt: '',
    ipAddress: '',
    device: 'ThinkPad L14, Windows 11 (ESS ICT Lab)'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
