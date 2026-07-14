import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface SharedDashboardContainerProps {
  title: string;
  subtitle?: string;
  breadcrumbItems?: BreadcrumbItem[];
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function SharedDashboardContainer({
  title,
  subtitle,
  breadcrumbItems = [],
  action,
  children
}: SharedDashboardContainerProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 relative z-10">
      {/* Breadcrumbs Navigation */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <Home className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600" />
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
          {breadcrumbItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />}
              {item.onClick && !item.active ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  {item.label}
                </button>
              ) : (
                <span className={item.active ? "text-slate-800 dark:text-slate-200 font-extrabold" : "text-slate-400 dark:text-slate-500"}>
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Main Workspace Slot */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
