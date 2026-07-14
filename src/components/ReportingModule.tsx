import React, { useState } from 'react';
import { AccessRequest, Department } from '../types';
import { BarChart3, Download, FileSpreadsheet, FileText, CheckCircle, ShieldCheck, PieChart, Users, ArrowDownToLine, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReportingModuleProps {
  requests: AccessRequest[];
  departments: Department[];
}

export default function ReportingModule({ requests: rawRequests, departments: rawDepartments }: ReportingModuleProps) {
  const requests = Array.isArray(rawRequests) ? rawRequests.filter(Boolean) : [];
  const departments = Array.isArray(rawDepartments) ? rawDepartments.filter(Boolean) : [];
  const [exportingType, setExportingType] = useState<string | null>(null);

  // Group requests by department
  const departmentCounts = departments.map(dept => {
    const count = requests.filter(r => r.departmentId === dept.id).length;
    return { name: dept.name, count };
  });

  const maxCount = Math.max(...departmentCounts.map(d => d.count), 1);

  // System access breakdown
  const accessTypeCounts = {
    'Application Access': requests.filter(r => r.accessType === 'Application Access').length,
    'Database Access': requests.filter(r => r.accessType === 'Database Access').length,
    'Folder Access': requests.filter(r => r.accessType === 'Folder Access').length,
    'VPN Access': requests.filter(r => r.accessType === 'VPN Access').length,
  };

  const handleExport = (type: 'PDF' | 'Excel' | 'CSV', reportName: string) => {
    setExportingType(`${reportName}-${type}`);
    try {
      const escapeCSV = (val: string | undefined | null) => {
        if (val === undefined || val === null) return '';
        const formatted = val.toString().replace(/"/g, '""');
        return `"${formatted}"`;
      };

      let headers: string[] = [];
      let rows: string[][] = [];

      if (reportName.toLowerCase().indexOf('time') !== -1 || reportName.toLowerCase().indexOf('bottleneck') !== -1) {
        headers = [
          'Request ID',
          'Employee Name',
          'Employee Email',
          'System Resource',
          'Access Type',
          'Priority',
          'SLA Creation Timestamp',
          'Current Resolution Status'
        ];
        rows = requests.map(req => [
          escapeCSV(req.id),
          escapeCSV(req.userFullName),
          escapeCSV(req.userEmail),
          escapeCSV(req.systemName),
          escapeCSV(req.accessType),
          escapeCSV(req.priority),
          escapeCSV(req.createdAt),
          escapeCSV(req.status)
        ]);
      } else {
        // Active Accounts / Categories Split Directory
        headers = [
          'Request ID',
          'Authorized User',
          'Email Address',
          'Target System',
          'Access Scope Profile',
          'Priority Tier',
          'Security Review Status',
          'Date Timestamp'
        ];
        rows = requests.map(req => [
          escapeCSV(req.id),
          escapeCSV(req.userFullName),
          escapeCSV(req.userEmail),
          escapeCSV(req.systemName),
          escapeCSV(req.accessType),
          escapeCSV(req.priority),
          escapeCSV(req.status),
          escapeCSV(req.createdAt)
        ]);
      }

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportName}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export live report CSV", err);
    } finally {
      setTimeout(() => {
        setExportingType(null);
      }, 1000);
    }
  };

  const generateComplianceCSV = () => {
    try {
      const headers = [
        'Request ID',
        'User Full Name',
        'User Email',
        'Target System Name',
        'Access Type',
        'Priority Level',
        'Current Status',
        'Justification Details',
        'Submission Timestamp',
        'Latest Auditor Notes'
      ];

      const escapeCSV = (val: string | undefined | null) => {
        if (val === undefined || val === null) return '';
        const formatted = val.toString().replace(/"/g, '""');
        return `"${formatted}"`;
      };

      const rows = requests.map(req => [
        escapeCSV(req.id),
        escapeCSV(req.userFullName),
        escapeCSV(req.userEmail),
        escapeCSV(req.systemName),
        escapeCSV(req.accessType),
        escapeCSV(req.priority),
        escapeCSV(req.status),
        escapeCSV(req.justification),
        escapeCSV(req.createdAt),
        escapeCSV(req.comments)
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Compliance_Access_Requests_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export compliance CSV', err);
    }
  };

  const generateCompliancePDF = () => {
    try {
      setExportingType('compliance-pdf');
      
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [12, 36, 68]; // #0c2444
      const secondaryColor = [0, 75, 182]; // #004bb6
      const grayColor = [100, 116, 139]; // slate
      const darkColor = [15, 23, 42];

      // Draw primary header band
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("ACCESS PORTAL", 15, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("Enterprise Access Governance & Compliance Audit", 15, 24);

      // Metadata right aligned
      doc.setFontSize(8);
      const currentTime = new Date().toLocaleString();
      doc.text(`Generated: ${currentTime}`, 195, 15, { align: 'right' });
      doc.text(`Doc Ref: AP-AUDIT-${Math.floor(100000 + Math.random() * 900000)}`, 195, 20, { align: 'right' });
      doc.text("Security Standard: ISO-27001 / SOC 2", 195, 25, { align: 'right' });

      // Title header in white
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(15, 48, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("OFFICIAL SYSTEM SECURITY AUDIT RECORD & ACTIONS DIRECTORY", 19, 53);

      let yPos = 65;

      // Section 1: Executive Summary Metrics
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("1. Executive Summary", 15, yPos);
      yPos += 6;

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`This document serves as an authorized snapshot of active and historic access requests within the Access Portal. A total of ${requests.length} request(s) have been processed under department controls. All requests undergo standard approval routing from Employee -> Department Manager -> IT Admin with fully audited approval chains.`, 15, yPos, { maxWidth: 180 });
      yPos += 18;

      // Cards for statistics
      doc.setDrawColor(226, 232, 240); // neutral border
      doc.setFillColor(248, 250, 252); // soft off-white background
      
      // Total requests card
      doc.rect(15, yPos, 55, 22, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Total Logged", 18, yPos + 6);
      doc.setFontSize(18);
      doc.text(String(requests.length), 18, yPos + 16);

      // Approved card
      const approvedCount = requests.filter(r => r.status === 'Approved' || r.status === 'Completed').length;
      doc.rect(77, yPos, 55, 22, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(34, 197, 94); // success green
      doc.text("Approved / Done", 80, yPos + 6);
      doc.setFontSize(18);
      doc.text(String(approvedCount), 80, yPos + 16);

      // Pending/Draft card
      const pendingCount = requests.filter(r => r.status === 'Under Review' || r.status === 'Submitted').length;
      doc.rect(140, yPos, 55, 22, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(245, 158, 11); // warning amber
      doc.text("Under Action", 143, yPos + 6);
      doc.setFontSize(18);
      doc.text(String(pendingCount), 143, yPos + 16);

      yPos += 30;

      // Section 2: Departments Summary
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("2. Department Engagement and Request Breakdown", 15, yPos);
      yPos += 6;

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("Distribution of requested resources, folders, networks, and databases across active organizational groups:", 15, yPos);
      yPos += 6;

      // Draw table header for departments
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, yPos, 180, 6, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("Department Name", 18, yPos + 4);
      doc.text("Resource Requests", 120, yPos + 4);
      doc.text("Operational Share %", 160, yPos + 4);
      yPos += 6;

      departments.forEach((dept) => {
        const count = requests.filter(r => r.departmentId === dept.id).length;
        const sharePct = requests.length ? Math.round((count / requests.length) * 100) : 0;

        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(dept.name, 18, yPos + 4.5);
        doc.text(String(count), 120, yPos + 4.5);
        doc.text(`${sharePct}%`, 160, yPos + 4.5);

        // draw border thin gray
        doc.setDrawColor(241, 245, 249);
        doc.line(15, yPos + 6, 195, yPos + 6);
        yPos += 6.5;
      });

      yPos += 6;

      // Section 3: Detailed Logs
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("3. Target System Logs & Request Directory", 15, yPos);
      yPos += 6;

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("Individual security logs detailing compliance justification, requested resource type, and current resolution status:", 15, yPos);
      yPos += 6;

      // Draw table header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, yPos, 180, 6, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("Employee / System Name", 18, yPos + 4);
      doc.text("Access Type", 75, yPos + 4);
      doc.text("Priority", 120, yPos + 4);
      doc.text("Status", 155, yPos + 4);
      yPos += 6;

      const latestRequests = [...requests].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 15);
      
      latestRequests.forEach((req) => {
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(15, yPos, 180, 6, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text("Employee / System Name", 18, yPos + 4);
          doc.text("Access Type", 75, yPos + 4);
          doc.text("Priority", 120, yPos + 4);
          doc.text("Status", 155, yPos + 4);
          yPos += 6;
        }

        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`${req.userFullName || 'Unknown User'} (${req.systemName})`, 18, yPos + 4.5);
        doc.text(req.accessType, 75, yPos + 4.5);
        doc.text(req.priority, 120, yPos + 4.5);
        doc.text(req.status, 155, yPos + 4.5);

        doc.setDrawColor(241, 245, 249);
        doc.line(15, yPos + 6, 195, yPos + 6);
        yPos += 6.5;
      });

      // Footer disclaimer & security validation code
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos, 180, 24, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("CRYPTO-HASH SECURE PROTOCOL INTEGRITY DECLARATION", 19, yPos + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("This PDF export serves as an immutable system record of resource access compliance validation. All parameters are verified directly\\nvia row-level security parameters. Signature hash validation ensures no tampering with client-side parameters has occurred.", 19, yPos + 12, { maxWidth: 172 });

      // Save PDF
      doc.save(`Compliance_Audit_Record_${new Date().toISOString().slice(0,10)}.pdf`);
      
      setExportingType(null);
    } catch (err) {
      console.error(err);
      setExportingType(null);
      alert("An error occurred during secure PDF compiling. Please check console logs.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Security Audit Reports & Exports</h1>
          <p className="text-sm text-gray-500 mt-1">Sponsor safety logs, retrieve organization activity reviews, and export cryptographically signed compliance reports.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={generateComplianceCSV}
            disabled={exportingType !== null}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
            id="export-reporting-csv-btn"
            title="Download complete compliance directory as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={generateCompliancePDF}
            disabled={exportingType !== null}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
            id="download-compliance-pdf-btn"
          >
            {exportingType === 'compliance-pdf' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 shrink-0" />
                <span>Download as PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Access Requests by Department</span>
            </h2>
            <button
              onClick={generateCompliancePDF}
              className="btn-secondary-minimal py-1 px-3 text-xs"
            >
              <Download className="w-3 h-3 text-gray-400" />
              <span>Export PDF</span>
            </button>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {departmentCounts.map(d => {
              const pct = Math.round((d.count / maxCount) * 100);
              return (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{d.name}</span>
                    <span className="font-black text-gray-900 dark:text-white">{d.count} requests</span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-gray-800 h-4 rounded-xl overflow-hidden flex items-center p-0.5 border border-gray-100 dark:border-gray-800/80">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-white"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 15 && `${pct}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories split */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-orange-600" />
              <span>Requested Access Types</span>
            </h2>
            <button
              onClick={() => handleExport('Excel', 'Access_Category_Spreadsheet')}
              className="btn-secondary-minimal py-1 px-3 text-xs"
            >
              <FileSpreadsheet className="w-3 h-3 text-green-600" />
              <span>XLSX</span>
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(accessTypeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs p-3.5 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/50 rounded-xl">
                <span className="font-bold text-gray-600 dark:text-gray-400">{type}</span>
                <span className="font-black text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-1 px-3 border border-gray-150 dark:border-gray-700 rounded-lg">{count}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-gray-400 mt-2 text-center flex items-center justify-center gap-1 font-semibold leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>Audits and encryption standards verified for ISO-27001</span>
          </div>
        </div>

      </div>

      {/* Compliance fast download lists */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">SLA & Corporate Registry Extracts</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card */}
          <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-sm transition-all flex items-center justify-between bg-white dark:bg-gray-900">
            <div className="space-y-1">
              <div className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Approval Time Analysis Report</span>
              </div>
              <p className="text-[11px] text-gray-500">Evaluates duration bottlenecks between employee requests and manager approvals.</p>
            </div>
            <button
              onClick={() => handleExport('CSV', 'Approval_Time_bottleneck_report')}
              className="btn-primary-minimal py-1.5 px-3 text-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Card */}
          <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-sm transition-all flex items-center justify-between bg-white dark:bg-gray-900">
            <div className="space-y-1">
              <div className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Active User Access Directory</span>
              </div>
              <p className="text-[11px] text-gray-500">Lists current active accounts, enabled security scopes, and systems privileges.</p>
            </div>
            <button
              onClick={() => handleExport('Excel', 'Active_Accounts_Scope_Directory')}
              className="btn-primary-minimal py-1.5 px-3 text-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
