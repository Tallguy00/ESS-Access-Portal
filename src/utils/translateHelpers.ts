export function getTranslatedDeptName(id: string, defaultName: string, t: any): string {
  const cleanId = (id || '').toLowerCase();
  if (cleanId === 'dep-ict') return t('departments.ict');
  if (cleanId === 'dep-finance') return t('departments.finance');
  if (cleanId === 'dep-hr') return t('departments.hr');
  if (cleanId === 'dep-household') return t('departments.socio_economic');
  if (cleanId === 'dep-business') return t('departments.statistics');
  if (cleanId === 'dep-other') return t('departments.statistics');
  return defaultName;
}

export function getTranslatedSystemName(idOrName: string, defaultName: string, t: any): string {
  const clean = (idOrName || '').toLowerCase();
  if (clean.includes('email') || clean === 'sys-email') return t('systems.email');
  if (clean.includes('shared') || clean.includes('drive') || clean === 'sys-shared') return t('systems.drive');
  if (clean.includes('vpn')) return t('systems.vpn');
  if (clean.includes('hr') || clean.includes('database')) return t('systems.hr_db');
  if (clean.includes('census') || clean.includes('gis')) return t('systems.census_gis');
  if (clean.includes('survey') || clean === 'sys-survey') return t('systems.survey_portal');
  if (clean.includes('vms') || clean === 'sys-vms') return t('systems.vms');
  return defaultName;
}

export function getTranslatedStatus(status: string, t: any): string {
  const s = (status || '').toLowerCase().replace(' ', '_').replace('-', '_');
  if (s === 'draft') return t('statusValues.draft');
  if (s === 'pending') return t('statusValues.pending');
  if (s === 'under_review') return t('statusValues.under_review');
  if (s === 'approved') return t('statusValues.approved');
  if (s === 'delivered') return t('statusValues.delivered');
  if (s === 'rejected') return t('statusValues.rejected');
  if (s === 'completed') return t('statusValues.completed');
  return status;
}
