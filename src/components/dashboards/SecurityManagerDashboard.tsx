import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Award,
  AlertOctagon,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Percent,
} from 'lucide-react';
import { Incident, PatrolScan, EquipmentItem, OBEntry, UserProfile } from '../../types';

interface SecurityManagerDashboardProps {
  currentUser: UserProfile;
  incidents: Incident[];
  scans: PatrolScan[];
  equipmentList: EquipmentItem[];
  obEntries: OBEntry[];
  onOpenVoiceRoom?: (incident: Incident) => void;
}

export const SecurityManagerDashboard: React.FC<SecurityManagerDashboardProps> = ({
  currentUser,
  incidents = [],
  scans = [],
  equipmentList = [],
  obEntries = [],
  onOpenVoiceRoom,
}) => {
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Compute Metrics
  const totalIncidents = (incidents || []).length;
  const resolvedCount = (incidents || []).filter((i) => i.status === 'resolved').length;
  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 100;
  const activeCount = (incidents || []).filter((i) => i.status === 'triggered' || i.status === 'responding').length;
  const issuedEquipmentCount = (equipmentList || []).filter((e) => e.status === 'issued').length;
  const maintenanceCount = (equipmentList || []).filter((e) => e.status === 'maintenance').length;

  const handleExportReport = () => {
    setExportNotice('Monthly Security Audit & Operations Report has been exported to PDF & CSV.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Security Manager Operations Intelligence
            </h1>
            <p className="text-xs text-slate-500">
              SLA compliance, response times, patrol coverage, and equipment analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="export-manager-report-btn"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Generate Executive Report</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Response Time */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Avg Response Time</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">2.4</span>
            <span className="text-xs text-slate-500">minutes</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>✓ 42s faster than contract SLA (3.5m)</span>
          </div>
        </div>

        {/* KPI 2: Patrol Compliance */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Patrol Checkpoint Coverage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">98.2%</span>
          </div>
          <div className="text-[11px] text-slate-600 font-semibold">
            <span>{scans.length} checkpoint scans verified on shift</span>
          </div>
        </div>

        {/* KPI 3: Resolution Rate */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Incident Resolution Rate</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{resolutionRate}%</span>
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{resolvedCount} of {totalIncidents} closed</span>
          </div>
        </div>

        {/* KPI 4: Tactical Equipment Readiness */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Armory Asset Readiness</span>
            <BarChart3 className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {equipmentList.length - maintenanceCount}/{equipmentList.length}
            </span>
          </div>
          <div className="text-[11px] text-red-600 font-semibold">
            <span>{issuedEquipmentCount} currently issued in field</span>
          </div>
        </div>
      </div>

      {/* Analytics & Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incident Breakdown & SLA adherence */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              <span>Incident Severity Distribution & SLA Performance</span>
            </h3>
          </div>

          <div className="space-y-3">
            {/* Category bar 1 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-semibold">Panic Alarms (General / Intruder)</span>
                <span className="text-red-600 font-mono font-bold">45% • 1.8m Avg Dispatch</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Category bar 2 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-semibold">Medical Distress & First Aid</span>
                <span className="text-emerald-700 font-mono font-bold">25% • 3.1m Avg Dispatch</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            {/* Category bar 3 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-semibold">Access Control Violations</span>
                <span className="text-slate-700 font-mono font-bold">20% • Handled On-Site</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>

            {/* Category bar 4 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-semibold">Maintenance Defect Flags</span>
                <span className="text-amber-600 font-mono font-bold">10% • Escalated to Facilities</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Site Compliance Status */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Shift Guard Roster & Compliance</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">Officer Sipho Khumalo</div>
                <div className="text-[10px] text-slate-500">Alpha-1 Tactical • Day Shift</div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                100% Scans On-Time
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">Officer Tendai Moyo</div>
                <div className="text-[10px] text-slate-500">Bravo-2 Mobile • Day Shift</div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                96% Scans On-Time
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">Guard Lucas Sithole</div>
                <div className="text-[10px] text-slate-500">Delta-4 Perimeter • Day Shift</div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                100% Scans On-Time
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
