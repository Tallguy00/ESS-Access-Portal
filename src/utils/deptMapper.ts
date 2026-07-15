export function getDepartmentFromEmail(email: string): string {
  const emailLower = (email || '').toLowerCase().trim();
  if (emailLower.startsWith('manager.')) {
    // E.g., manager.dir@ess.gov.et -> dep-dir
    const part = emailLower.replace('manager.', '').split('@')[0];
    if (['dir', 'deputy', 'business', 'household', 'ict', 'hr', 'finance', 'other'].includes(part)) {
      return `dep-${part}`;
    }
    // Backward compatibility mappings
    if (part === 'eng') return 'dep-ict';
    if (part === 'fin') return 'dep-finance';
    if (part === 'mkt') return 'dep-business';
    if (part === 'ops') return 'dep-ict';
  }
  
  if (emailLower.startsWith('abebe.')) return 'dep-household';
  if (emailLower.startsWith('aster.')) return 'dep-business';
  if (emailLower.startsWith('chala.')) return 'dep-ict';
  if (emailLower.startsWith('admin.')) return 'dep-ict';
  if (emailLower.startsWith('super.')) return 'dep-ict';
  
  // Backward compatibility check for @ess.gov.et standard emails
  if (emailLower.startsWith('employee.jane') || emailLower.startsWith('jane.')) return 'dep-ict';
  if (emailLower.startsWith('finance.mark') || emailLower.startsWith('mark.')) return 'dep-finance';
  if (emailLower.startsWith('hr.lucy') || emailLower.startsWith('lucy.')) return 'dep-hr';
  
  if (emailLower.startsWith('admin@') || emailLower.startsWith('super@')) return 'dep-ict';

  return 'dep-other';
}
