import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  QrCode,
  Users,
  Building2,
  Plus,
  Download,
  Trash2,
  History,
  AlertTriangle,
  Lock,
  Layers,
  Smartphone,
  CheckCircle2,
  Home,
} from 'lucide-react';
import { Checkpoint, AuditLog, UserProfile, SiteBranch, HouseUnit, RegisteredDevice, SecurityCompany } from '../../types';
import { TenantPlanService, MAX_HOUSES_PER_COMPANY, MAX_DEVICES_PER_HOUSE } from '../../services/tenantPlanService';

interface SecurityAdminDashboardProps {
  currentUser: UserProfile;
  company: SecurityCompany;
  houses: HouseUnit[];
  checkpoints: Checkpoint[];
  auditLogs: AuditLog[];
  branches: SiteBranch[];
  onAddCheckpoint: (cp: Omit<Checkpoint, 'id' | 'companyId'>) => void;
  onAddHouse: (houseData: Omit<HouseUnit, 'id' | 'companyId' | 'registeredDevices'>) => { success: boolean; message?: string };
  onDeleteHouse: (houseId: string) => void;
  onAddDevice: (houseId: string, deviceData: Omit<RegisteredDevice, 'id' | 'houseId'>) => { success: boolean; message?: string };
  onDeleteDevice: (houseId: string, deviceId: string) => void;
}

export const SecurityAdminDashboard: React.FC<SecurityAdminDashboardProps> = ({
  currentUser,
  company,
  houses = [],
  checkpoints = [],
  auditLogs = [],
  branches = [],
  onAddCheckpoint,
  onAddHouse,
  onDeleteHouse,
  onAddDevice,
  onDeleteDevice,
}) => {
  const [activeTab, setActiveTab] = useState<'houses_devices' | 'qr_library' | 'users_roles' | 'audit_logs'>('houses_devices');
  const [showAddCpModal, setShowAddCpModal] = useState<boolean>(false);
  const [showAddHouseModal, setShowAddHouseModal] = useState<boolean>(false);
  const [selectedHouseForDevice, setSelectedHouseForDevice] = useState<HouseUnit | null>(null);
  const [qrPreviewModal, setQrPreviewModal] = useState<{ checkpoint: Checkpoint; dataUrl: string } | null>(null);
  const [formError, setFormError] = useState<string>('');

  // House Form
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [residentName, setResidentName] = useState<string>('');
  const [residentEmail, setResidentEmail] = useState<string>('');
  const [residentPhone, setResidentPhone] = useState<string>('');

  // Device Form
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceType, setDeviceType] = useState<'mobile_app' | 'guard_terminal' | 'iot_keyfob'>('mobile_app');

  // Checkpoint Form
  const [cpName, setCpName] = useState<string>('');
  const [cpZone, setCpZone] = useState<string>('Zone A - Ground Level');
  const [cpInterval, setCpInterval] = useState<number>(30);

  const planMetrics = TenantPlanService.getCompanyPlanMetrics(company, houses);

  const handleGenerateQR = async (cp: Checkpoint) => {
    try {
      const url = await QRCode.toDataURL(cp.code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#dc2626',
          light: '#ffffff',
        },
      });
      setQrPreviewModal({ checkpoint: cp, dataUrl: url });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!houseNumber.trim() || !residentName.trim()) return;

    const res = onAddHouse({
      siteId: currentUser.siteId,
      houseNumber,
      streetAddress: streetAddress || `${houseNumber} Residential Avenue`,
      residentName,
      residentEmail: residentEmail || `${residentName.toLowerCase().replace(/\s+/g, '.')}@estate.za`,
      residentPhone: residentPhone || '+27 82 555 0100',
      coordinates: { lat: -26.1082, lng: 28.0573 },
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    if (!res.success) {
      setFormError(res.message || 'Limit exceeded');
      return;
    }

    setShowAddHouseModal(false);
    setHouseNumber('');
    setStreetAddress('');
    setResidentName('');
    setResidentEmail('');
    setResidentPhone('');
  };

  const handleAddDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseForDevice || !deviceName.trim()) return;
    setFormError('');

    const res = onAddDevice(selectedHouseForDevice.id, {
      deviceName,
      deviceType,
      deviceUid: `DEV-${Date.now().toString().slice(-6)}`,
      registeredAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      batteryPercent: 100,
      status: 'active',
    });

    if (!res.success) {
      setFormError(res.message || 'Device limit exceeded');
      return;
    }

    setSelectedHouseForDevice(null);
    setDeviceName('');
  };

  const handleAddCpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpName.trim()) return;

    const newCode = `AEGIS-CHK-${currentUser.siteId.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`;
    onAddCheckpoint({
      name: cpName,
      zone: cpZone,
      siteId: currentUser.siteId,
      siteName: currentUser.siteName,
      code: newCode,
      coordinates: { lat: -26.1076, lng: 28.0567 },
      requiredTimeWindowMinutes: cpInterval,
    });

    setShowAddCpModal(false);
    setCpName('');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Admin Top Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Security Admin & Multi-Tenant Console
            </h1>
            <p className="text-xs text-slate-500">
              Manage house quotas (50 max), 2-device resident allocations, patrol QR library, and audit trails.
            </p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
          <button
            id="admin-tab-houses"
            onClick={() => setActiveTab('houses_devices')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'houses_devices' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Houses & Devices ({houses.length}/50)
          </button>
          <button
            id="admin-tab-qr"
            onClick={() => setActiveTab('qr_library')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'qr_library' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Stations ({checkpoints.length})
          </button>
          <button
            id="admin-tab-users"
            onClick={() => setActiveTab('users_roles')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'users_roles' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users & Roles
          </button>
          <button
            id="admin-tab-audit"
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'audit_logs' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: HOUSES & DEVICES MANAGEMENT (50 Houses / 2 Devices per house) */}
      {activeTab === 'houses_devices' && (
        <div className="space-y-6">
          {/* Plan Quota Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase">Company House Allocation</span>
                <span className="font-mono font-bold text-slate-900">
                  {planMetrics.totalHouses} / {planMetrics.maxHouses} Max
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    planMetrics.isAtLimit ? 'bg-red-600' : 'bg-red-500'
                  }`}
                  style={{ width: `${planMetrics.houseUsagePercent}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{planMetrics.remainingHouses} slots available</span>
                <strong className={planMetrics.isAtLimit ? 'text-red-600' : 'text-slate-700'}>
                  {planMetrics.isAtLimit ? 'PLAN LIMIT REACHED (50)' : `${planMetrics.houseUsagePercent}% Quota`}
                </strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="text-xs text-slate-500 font-bold uppercase">Device Policy Cap</div>
              <div className="text-xl font-black text-slate-900">Max 2 Devices / House</div>
              <div className="text-[11px] text-slate-500">
                {planMetrics.totalDevices} total active devices connected across registered units.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase">Quick Action</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">Add Residence to Plan</div>
              </div>
              <button
                id="add-house-btn"
                onClick={() => {
                  setFormError('');
                  setShowAddHouseModal(true);
                }}
                disabled={planMetrics.isAtLimit}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add House</span>
              </button>
            </div>
          </div>

          {/* Houses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map((house) => {
              const devCount = house.registeredDevices?.length || 0;
              const isDeviceCapReached = devCount >= MAX_DEVICES_PER_HOUSE;

              return (
                <div
                  key={house.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-red-600" />
                        <span className="font-black text-sm text-slate-900">{house.houseNumber}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {devCount}/{MAX_DEVICES_PER_HOUSE} Devices
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900">{house.residentName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{house.streetAddress}</div>
                      <div className="text-[11px] font-mono text-slate-600 mt-0.5">{house.residentPhone}</div>
                    </div>

                    {/* Registered Devices List for this house */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Connected Devices (Max 2):
                      </span>
                      {house.registeredDevices && house.registeredDevices.length > 0 ? (
                        house.registeredDevices.map((dev) => (
                          <div
                            key={dev.id}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Smartphone className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <div className="truncate">
                                <div className="font-semibold text-slate-800 text-[11px] truncate">{dev.deviceName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{dev.deviceUid} • {dev.batteryPercent}% batt</div>
                              </div>
                            </div>
                            <button
                              onClick={() => onDeleteDevice(house.id, dev.id)}
                              className="text-slate-400 hover:text-red-600 p-1 transition shrink-0"
                              title="Unlink Device"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                          No devices linked yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* House Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setFormError('');
                        setSelectedHouseForDevice(house);
                      }}
                      disabled={isDeviceCapReached}
                      className="flex-1 bg-slate-50 hover:bg-red-50 disabled:opacity-40 text-red-600 font-bold border border-slate-200 hover:border-red-200 py-1.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isDeviceCapReached ? 'Device Cap (2/2)' : 'Add Device'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteHouse(house.id)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                      title="Remove House"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QR CHECKPOINT LIBRARY */}
      {activeTab === 'qr_library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Patrol Station QR Inventory ({checkpoints.length} Stations)
            </h3>
            <button
              id="create-checkpoint-btn"
              onClick={() => setShowAddCpModal(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Checkpoint QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <span className="text-[10px] font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {cp.zone}
                    </span>
                    <span className="text-[10px] text-slate-500">Scan Window: {cp.requiredTimeWindowMinutes}m</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{cp.name}</h4>
                  <div className="text-xs text-slate-600 font-mono mt-1 break-all bg-slate-50 p-2 rounded-xl border border-slate-200">
                    {cp.code}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                  <button
                    id={`preview-qr-${cp.id}`}
                    onClick={() => handleGenerateQR(cp)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:border-red-200 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View & Print QR Code</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USERS & ROLES */}
      {activeTab === 'users_roles' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              <span>Role-Based Access Matrix & Security Company Personnel</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">User / Officer</th>
                  <th className="p-3">Role Tier</th>
                  <th className="p-3">Assigned Site</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Access Capabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Nomsa Dlamini</td>
                  <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold">Community</span></td>
                  <td className="p-3">Sandton Financial Precinct</td>
                  <td className="p-3 font-mono">+27 71 892 4110</td>
                  <td className="p-3 text-slate-500">Panic Beacon, Location Tracing, Emergency Status</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Officer Sipho Khumalo (SEC-8842)</td>
                  <td className="p-3"><span className="bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded">Patrol Guard</span></td>
                  <td className="p-3">Sandton Financial Precinct</td>
                  <td className="p-3 font-mono">+27 76 342 9012</td>
                  <td className="p-3 text-slate-500">Patrol QR Scanner, OB Logging, Equipment Register</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Supervisor Kagiso Sithole (SUP-401)</td>
                  <td className="p-3"><span className="bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">Supervisor</span></td>
                  <td className="p-3">Sandton Financial Precinct</td>
                  <td className="p-3 font-mono">+27 82 555 0192</td>
                  <td className="p-3 text-slate-500">Dispatch Units, Live Incident Map, Sign-off OB Book</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Elena Rostova</td>
                  <td className="p-3"><span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded">Security Admin</span></td>
                  <td className="p-3">Corporate HQ</td>
                  <td className="p-3 font-mono">+27 11 900 3000</td>
                  <td className="p-3 text-slate-500">50-House Quota, Device Provisioning, Audit Trails</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Col. Marcus Vance (OPS-MGR-07)</td>
                  <td className="p-3"><span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded">Security Manager</span></td>
                  <td className="p-3">Regional Ops Center</td>
                  <td className="p-3 font-mono">+27 82 111 9900</td>
                  <td className="p-3 text-slate-500">SLA Analytics, Equipment Audits, Compliance Reports</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-red-600" />
              <span>Immutable System Audit Trail</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Real-time cryptographic logs</span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900">{log.actor}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({log.actorRole})</span>
                  </div>
                  <div className="text-slate-600 mt-1">{log.details}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono shrink-0">{log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD HOUSE MODAL */}
      {showAddHouseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">Add Residence to Security Plan</h3>
            <p className="text-xs text-slate-500">
              Each security company plan permits a maximum of 50 connected houses ({houses.length}/50 registered).
            </p>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddHouseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">House / Unit Number:</label>
                <input
                  type="text"
                  required
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. Unit 34"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address:</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. 34 Oakwood Crescent, Sandton"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resident Full Name:</label>
                <input
                  type="text"
                  required
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  placeholder="e.g. Michael Khanyile"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Resident Email:</label>
                  <input
                    type="email"
                    value={residentEmail}
                    onChange={(e) => setResidentEmail(e.target.value)}
                    placeholder="resident@estate.za"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number:</label>
                  <input
                    type="tel"
                    value={residentPhone}
                    onChange={(e) => setResidentPhone(e.target.value)}
                    placeholder="+27 82 555 1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddHouseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Register House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEVICE MODAL (Max 2 per house) */}
      {selectedHouseForDevice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">
              Link Device to {selectedHouseForDevice.houseNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Each house is capped at 2 registered devices ({selectedHouseForDevice.registeredDevices?.length || 0}/2 current).
            </p>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddDeviceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Device Name / Label:</label>
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Living Room Panic FOB #2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Device Type:</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                >
                  <option value="mobile_app">Resident Mobile App (iPhone/Android)</option>
                  <option value="iot_keyfob">IoT Wireless Panic Keyfob / Remote</option>
                  <option value="guard_terminal">Guard Station Perimeter Terminal</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedHouseForDevice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR PREVIEW & PRINT MODAL */}
      {qrPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-[10px] font-extrabold tracking-widest uppercase text-red-600">
                AEGIS SECURITY PATROL POST
              </div>
              <h3 className="font-black text-lg text-slate-900 mt-1">{qrPreviewModal.checkpoint.name}</h3>
              <div className="text-xs text-slate-600 font-semibold">{qrPreviewModal.checkpoint.zone}</div>
            </div>

            {/* QR Image */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-red-200 rounded-2xl inline-block shadow-inner">
              <img
                src={qrPreviewModal.dataUrl}
                alt="Patrol Station QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-xl break-all">
              {qrPreviewModal.checkpoint.code}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setQrPreviewModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-bold transition"
              >
                Close
              </button>
              <a
                href={qrPreviewModal.dataUrl}
                download={`${qrPreviewModal.checkpoint.name.replace(/\s+/g, '_')}_QR.png`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CHECKPOINT MODAL */}
      {showAddCpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">Generate New Patrol QR Post</h3>
            <form onSubmit={handleAddCpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Checkpoint Station Name:</label>
                <input
                  type="text"
                  required
                  value={cpName}
                  onChange={(e) => setCpName(e.target.value)}
                  placeholder="e.g. West Perimeter Fence Post 14"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Security Zone:</label>
                <input
                  type="text"
                  required
                  value={cpZone}
                  onChange={(e) => setCpZone(e.target.value)}
                  placeholder="e.g. Zone D - Perimeter"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Scan Interval (Minutes):</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={cpInterval}
                  onChange={(e) => setCpInterval(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCpModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Create Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
