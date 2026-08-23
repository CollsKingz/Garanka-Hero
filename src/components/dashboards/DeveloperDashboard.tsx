import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  Layers,
  ShieldCheck,
  Smartphone,
  Building2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  AlertOctagon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Terminal,
  Activity,
  Cpu,
  Database,
  Radio,
} from 'lucide-react';
import { HouseUnit, RegisteredDevice, SecurityCompany, UserProfile, Incident } from '../../types';
import { TenantPlanService, MAX_HOUSES_PER_COMPANY, MAX_DEVICES_PER_HOUSE } from '../../services/tenantPlanService';

interface DeveloperDashboardProps {
  currentUser: UserProfile;
  company: SecurityCompany;
  companies: SecurityCompany[];
  houses: HouseUnit[];
  incidents: Incident[];
  onAddCompany: (comp: SecurityCompany) => void;
  onUpdateCompany: (comp: SecurityCompany) => void;
  onDeleteCompany: (companyId: string) => void;
  onAddHouse: (houseData: Omit<HouseUnit, 'id' | 'companyId' | 'registeredDevices'>) => { success: boolean; message?: string };
  onDeleteHouse: (houseId: string) => void;
  onAddDevice: (houseId: string, deviceData: Omit<RegisteredDevice, 'id' | 'houseId'>) => { success: boolean; message?: string };
  onDeleteDevice: (houseId: string, deviceId: string) => void;
  onUpdateDeviceApproval: (houseId: string, deviceId: string, approvalStatus: 'approved' | 'declined') => void;
  onTriggerTestPanic: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  currentUser,
  company,
  companies = [],
  houses = [],
  incidents = [],
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  onAddHouse,
  onDeleteHouse,
  onAddDevice,
  onDeleteDevice,
  onUpdateDeviceApproval,
  onTriggerTestPanic,
}) => {
  const [activeTab, setActiveTab] = useState<'slides' | 'companies' | 'device_approvals'>('slides');
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [sandboxMessage, setSandboxMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Company Form Modal State
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<SecurityCompany | null>(null);
  const [compName, setCompName] = useState<string>('');
  const [compShortCode, setCompShortCode] = useState<string>('');
  const [compRegion, setCompRegion] = useState<string>('');
  const [compLogo, setCompLogo] = useState<string>('🛡️');
  const [compPhone, setCompPhone] = useState<string>('');
  const [compEmail, setCompEmail] = useState<string>('');
  const [compDepartment, setCompDepartment] = useState<string>('General Security');
  const [compPlan, setCompPlan] = useState<string>('Enterprise Shield Tier');

  const slides = [
    {
      id: 1,
      tag: 'ARCHITECTURE & MULTI-TENANCY',
      title: 'Multi-Tenant Security Workspaces',
      subtitle: 'Isolated Tenant Segregation & Strict Workspace RBAC',
      icon: <Building2 className="w-8 h-8 text-red-600" />,
      bullets: [
        'Each Security Company operates as an independent tenant partition stored at /companies/{companyId}.',
        'Zero cross-company data leakage: Incidents, checkpoints, patrol logs, and equipment are tied to companyId.',
        'Developer (Super Admin) has full control to create, edit, and delete companies live across devices.',
      ],
      metricLabel: 'Active Tenant',
      metricValue: company.name,
    },
    {
      id: 2,
      tag: 'DATA MODEL CONSTRAINTS',
      title: '50 Houses & 2 Devices Plan Engine',
      subtitle: 'Guaranteed Quota Enforcement at the Business Logic Layer',
      icon: <Layers className="w-8 h-8 text-red-600" />,
      bullets: [
        'Security companies cannot register more than 50 houses per workspace (strict limit = 50).',
        'Each house is permitted a maximum of 2 connected devices (Resident Mobile App + Perimeter Panic FOB).',
        'Backend service blocks additions exceeding quota with descriptive error payloads.',
      ],
      metricLabel: 'Connected Houses Quota',
      metricValue: `${houses.length} / ${MAX_HOUSES_PER_COMPANY} Houses`,
    },
  ];

  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompName('');
    setCompShortCode('');
    setCompRegion('');
    setCompLogo('🛡️');
    setCompPhone('');
    setCompEmail('');
    setCompPlan('Enterprise Shield Tier');
    setShowCompanyModal(true);
  };

  const handleOpenEditCompany = (c: SecurityCompany) => {
    setEditingCompany(c);
    setCompName(c.name);
    setCompShortCode(c.shortCode);
    setCompRegion(c.region);
    setCompLogo(c.logo || '🛡️');
    setCompPhone(c.supportPhone);
    setCompEmail(c.supportEmail);
    setCompDepartment(c.department || 'General Security');
    setCompPlan(c.planName);
    setShowCompanyModal(true);
  };

  const handleSaveCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;

    if (editingCompany) {
      onUpdateCompany({
        ...editingCompany,
        name: compName,
        shortCode: compShortCode || compName.toUpperCase().slice(0, 5),
        region: compRegion,
        logo: compLogo,
        supportPhone: compPhone,
        supportEmail: compEmail,
        department: compDepartment,
        planName: compPlan,
      });
    } else {
      const newComp: SecurityCompany = {
        id: 'comp-' + Date.now(),
        name: compName,
        shortCode: compShortCode || compName.toUpperCase().slice(0, 5),
        region: compRegion || 'National',
        logo: compLogo,
        supportPhone: compPhone || '+27 11 000 0000',
        supportEmail: compEmail || 'control@security.za',
        department: compDepartment,
        planName: compPlan,
        planLimitHouses: 50,
        maxDevicesPerHouse: 2,
        activeHousesCount: 0,
      };
      onAddCompany(newComp);
    }

    setShowCompanyModal(false);
  };

  const planMetrics = TenantPlanService.getCompanyPlanMetrics(company, houses);

  return (
    <div className="space-y-6 text-left">
      {/* Developer Header & Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <Code2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Developer Super Admin & Tenant Console
            </h1>
            <p className="text-xs text-slate-500">
              Manage security companies at /companies/{'{companyId}'}, tenants, and quota enforcement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('slides')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'slides' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Architecture Slides
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'companies' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Companies Manager ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab('device_approvals')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'device_approvals' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Device Approvals
          </button>
        </div>
      </div>

      {activeTab === 'companies' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Security Companies Registry (/companies)</h2>
              <p className="text-xs text-slate-500">Create, edit, and delete security company tenants synchronized via Firebase.</p>
            </div>
            <button
              onClick={handleOpenAddCompany}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => {
              const companyHouses = houses.filter(h => h.companyId === c.id);
              const totalDevices = companyHouses.reduce((sum, h) => sum + (h.registeredDevices?.length || 0), 0);
              const activeDevices = companyHouses.reduce((sum, h) => sum + (h.registeredDevices?.filter(d => d.status === 'active').length || 0), 0);
              const recentRegistrations = companyHouses.reduce((sum, h) => sum + (h.registeredDevices?.filter(d => new Date(d.registeredAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length || 0), 0);
              const companyIncidents = incidents.filter(inc => inc.companyId === c.id);
              const totalIncidents = companyIncidents.length;
              
              return (
              <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{c.logo || '🛡️'}</span>
                    <span className="text-[10px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {c.shortCode}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-slate-900">{c.name}</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Region: <strong className="text-slate-800">{c.region}</strong></div>
                    <div>Department: <strong className="text-slate-800">{c.department || 'N/A'}</strong></div>
                    <div>Support: <strong className="text-slate-800">{c.supportPhone}</strong></div>
                    <div>Plan: <strong className="text-red-600">{c.planName}</strong></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 mt-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-sm">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Incidents</div>
                      <div className="text-base font-black text-slate-900">{totalIncidents}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-sm">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Devices</div>
                      <div className="text-base font-black text-slate-900">{activeDevices} <span className="text-[10px] text-slate-400 font-medium">/ {totalDevices}</span></div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-sm">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">New (7d)</div>
                      <div className="text-base font-black text-emerald-600">+{recentRegistrations}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditCompany(c)}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteCompany(c.id)}
                    className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-xl border border-slate-200 hover:border-red-200 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {activeTab === 'slides' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-3 py-1 bg-red-100 text-red-700 rounded-full">
                Slide {activeSlide + 1} of {slides.length}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{slides[activeSlide].tag}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">{slides[activeSlide].icon}</div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{slides[activeSlide].title}</h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">{slides[activeSlide].subtitle}</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-2">
                {slides[activeSlide].bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 text-slate-100 font-mono text-xs space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span>{slides[activeSlide].metricLabel}</span>
                <span className="text-red-400 font-bold">{slides[activeSlide].metricValue}</span>
              </div>
              <div className="text-emerald-400 font-bold">Workspace Partition Active</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                All security entities are securely segregated by companyId across Firestore and Realtime Database paths.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'device_approvals' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">Device Approvals Queue</h2>
            <p className="text-xs text-slate-500">Review and approve new device registrations from company administrators.</p>
          </div>

          <div className="space-y-4">
            {houses.flatMap(h => 
              (h.registeredDevices || [])
                .filter(d => d.approvalStatus === 'pending')
                .map(d => ({ ...d, house: h }))
            ).length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">All caught up!</h3>
                <p className="text-xs text-slate-500">No pending devices require approval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Device Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">UID</th>
                      <th className="px-4 py-3">House / Company</th>
                      <th className="px-4 py-3 rounded-tr-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {houses.flatMap(h => 
                      (h.registeredDevices || [])
                        .filter(d => d.approvalStatus === 'pending')
                        .map(d => ({ ...d, house: h }))
                    ).map(device => (
                      <tr key={device.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{device.deviceName}</td>
                        <td className="px-4 py-3 font-mono">{device.deviceType}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{device.deviceUid}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{device.house.houseNumber}</div>
                          <div className="text-[10px] text-slate-500">Comp ID: {device.house.companyId}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => onUpdateDeviceApproval(device.house.id, device.id, 'approved')}
                              className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-bold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onUpdateDeviceApproval(device.house.id, device.id, 'declined')}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold transition"
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPANY MODAL */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">
              {editingCompany ? 'Edit Security Company Tenant' : 'Register New Security Company'}
            </h3>
            <p className="text-xs text-slate-500">
              Stored securely at /companies/{'{companyId}'} with live multi-tenant synchronization.
            </p>

            <form onSubmit={handleSaveCompanySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name:</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="e.g. Apex Armed Response"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Short Code:</label>
                  <input
                    type="text"
                    value={compShortCode}
                    onChange={(e) => setCompShortCode(e.target.value)}
                    placeholder="APEX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Region / Precinct:</label>
                  <input
                    type="text"
                    value={compRegion}
                    onChange={(e) => setCompRegion(e.target.value)}
                    placeholder="Gauteng & Pretoria"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Support Phone:</label>
                  <input
                    type="tel"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    placeholder="+27 12 000 0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Support Email:</label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder="control@apexsec.za"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department (Developer Only):</label>
                <select
                  value={compDepartment}
                  onChange={(e) => setCompDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                >
                  <option value="General Security">General Security</option>
                  <option value="Executive Protection">Executive Protection</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Command Center">Command Center</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingCompany ? 'Save Changes' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
