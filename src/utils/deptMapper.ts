export function getDepartmentFromEmail(email: string): string {
  const emailLower = (email || '').toLowerCase().trim();
  if (emailLower.startsWith('manager.')) {
    // E.g., manager.dir@company.com -> dep-dir
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
  

  
  if (emailLower.startsWith('admin@') || emailLower.startsWith('super@')) return 'dep-ict';

  return 'dep-other';
}
