import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  QrCode,
  Users,
  Building2,
  Plus,
  Edit2,
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
import { Checkpoint, AuditLog, UserProfile, SiteBranch, HouseUnit, RegisteredDevice, SecurityCompany, UserRole } from '../../types';
import { TenantPlanService, MAX_HOUSES_PER_COMPANY, MAX_DEVICES_PER_HOUSE } from '../../services/tenantPlanService';

interface SecurityAdminDashboardProps {
  currentUser: UserProfile;
  company: SecurityCompany;
  houses: HouseUnit[];
  users: UserProfile[];
  checkpoints: Checkpoint[];
  auditLogs: AuditLog[];
  branches: SiteBranch[];
  onAddCheckpoint: (cp: Omit<Checkpoint, 'id' | 'companyId'>) => void;
  onAddHouse: (houseData: Omit<HouseUnit, 'id' | 'companyId' | 'registeredDevices'>) => { success: boolean; message?: string };
  onDeleteHouse: (houseId: string) => void;
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onAddDevice: (houseId: string, deviceData: Omit<RegisteredDevice, 'id' | 'houseId'>) => { success: boolean; message?: string };
  onDeleteDevice: (houseId: string, deviceId: string) => void;
}

export const SecurityAdminDashboard: React.FC<SecurityAdminDashboardProps> = ({
  currentUser,
  company,
  houses = [],
  users = [],
  checkpoints = [],
  auditLogs = [],
  branches = [],
  onAddCheckpoint,
  onAddHouse,
  onDeleteHouse,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddDevice,
  onDeleteDevice,
}) => {
  const [activeTab, setActiveTab] = useState<'houses_devices' | 'qr_library' | 'users_roles' | 'audit_logs'>('houses_devices');
  const [showAddHouseModal, setShowAddHouseModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showAddCpModal, setShowAddCpModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedHouseForDevice, setSelectedHouseForDevice] = useState<HouseUnit | null>(null);
  const [qrPreviewModal, setQrPreviewModal] = useState<{ checkpoint: Checkpoint; dataUrl: string } | null>(null);
  const [formError, setFormError] = useState<string>('');

  // House Form
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [residentName, setResidentName] = useState<string>('');
  const [residentEmail, setResidentEmail] = useState<string>('');
  const [residentPhone, setResidentPhone] = useState<string>('');

  // User / Member Form
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('guard');
  const [userBadge, setUserBadge] = useState<string>('');
  const [userCallSign, setUserCallSign] = useState<string>('');

  // Checkpoint Form
  const [cpName, setCpName] = useState<string>('');
  const [cpZone, setCpZone] = useState<string>('Zone A - Ground Level');
  const [cpInterval, setCpInterval] = useState<number>(30);

  const planMetrics = TenantPlanService.getCompanyPlanMetrics(company, houses);

  // Filter users by companyId
  const companyUsers = users.filter((u) => u.companyId === company.id);

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

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUserRole('guard');
    setUserBadge('');
    setUserCallSign('');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPhone(u.phone);
    setUserRole(u.role);
    setUserBadge(u.badgeNumber || '');
    setUserCallSign(u.callSign || '');
    setShowUserModal(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        badgeNumber: userBadge,
        callSign: userCallSign,
      });
    } else {
      const newUser: UserProfile = {
        id: 'usr-' + Date.now(),
        name: userName,
        email: userEmail,
        phone: userPhone || '+27 82 000 0000',
        role: userRole,
        badgeNumber: userBadge || 'SEC-' + Math.floor(1000 + Math.random() * 9000),
        callSign: userCallSign || 'Unit Tactical',
        siteId: currentUser.siteId,
        siteName: currentUser.siteName,
        companyId: company.id,
        companyName: company.name,
      };
      onAddUser(newUser);
    }

    setShowUserModal(false);
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
              Company Admin & Personnel Console
            </h1>
            <p className="text-xs text-slate-500">
              Manage members at /users/{'{userId}'}, panic rooms / houses at /houses/{'{houseId}'}, and quotas for {company.name}.
            </p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('houses_devices')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'houses_devices' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Panic Rooms & Houses ({houses.length}/50)
          </button>
          <button
            onClick={() => setActiveTab('qr_library')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'qr_library' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Stations ({checkpoints.length})
          </button>
          <button
            onClick={() => setActiveTab('users_roles')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'users_roles' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Members ({companyUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'audit_logs' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: HOUSES & DEVICES */}
      {activeTab === 'houses_devices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase">Panic Rooms / Houses</span>
                <span className="font-mono font-bold text-slate-900">
                  {houses.length} / 50 Max
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all"
                  style={{ width: `${(houses.length / 50) * 100}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{50 - houses.length} slots remaining</span>
                <strong>{Math.round((houses.length / 50) * 100)}% Used</strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="text-xs text-slate-500 font-bold uppercase">Device Cap</div>
              <div className="text-xl font-black text-slate-900">Max 2 Devices / House</div>
              <div className="text-[11px] text-slate-500">Strict hardware allocation per unit.</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase">Quick Action</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">Add Panic Room / House</div>
              </div>
              <button
                onClick={() => {
                  setFormError('');
                  setShowAddHouseModal(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add House</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map((house) => (
              <div key={house.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-red-600" />
                      <span className="font-black text-sm text-slate-900">{house.houseNumber}</span>
                    </div>
                    <button
                      onClick={() => onDeleteHouse(house.id)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Resident: <strong className="text-slate-900">{house.residentName}</strong></div>
                    <div>Address: <strong className="text-slate-900">{house.streetAddress}</strong></div>
                    <div>Phone: <strong className="text-slate-900 font-mono">{house.residentPhone}</strong></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: QR STATIONS */}
      {activeTab === 'qr_library' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-red-600" />
              <span>Patrol Checkpoints & QR Stations</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkpoints.map((cp) => (
              <div key={cp.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    {cp.zone}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{cp.name}</h4>
                <div className="text-xs text-slate-600 font-mono bg-white p-2 rounded-xl border border-slate-200">
                  {cp.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERS & USERS */}
      {activeTab === 'users_roles' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                <span>Security Company Members & RBAC Personnel ({companyUsers.length})</span>
              </h3>
              <p className="text-xs text-slate-500">Stored at /users/{'{userId}'} with live Firebase real-time synchronization.</p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Member Name</th>
                  <th className="p-3">Role Tier</th>
                  <th className="p-3">Email & Phone</th>
                  <th className="p-3">Badge / CallSign</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companyUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3">
                      <span className="bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded uppercase text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <div>{u.email}</div>
                      <div className="text-slate-400">{u.phone}</div>
                    </td>
                    <td className="p-3">
                      <div>{u.badgeNumber || '—'}</div>
                      <div className="text-[10px] text-slate-400">{u.callSign || ''}</div>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {companyUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No members registered in this company yet. Click "Add Member" to create one.
                    </td>
                  </tr>
                )}
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
          </div>
          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[11px]">{log.action}</span>
                    <span className="font-bold text-slate-900">{log.actor}</span>
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
            <h3 className="text-base font-black text-slate-900">Add Panic Room / Residence</h3>
            <form onSubmit={handleAddHouseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Number:</label>
                <input
                  type="text"
                  required
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. Unit 14"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address:</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="14 Maple Ridge, Sandton"
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
                  placeholder="Nomsa Dlamini"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={residentEmail}
                    onChange={(e) => setResidentEmail(e.target.value)}
                    placeholder="resident@estate.za"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone:</label>
                  <input
                    type="tel"
                    value={residentPhone}
                    onChange={(e) => setResidentPhone(e.target.value)}
                    placeholder="+27 71 000 0000"
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
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Save House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER / USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">
              {editingUser ? 'Edit Member Profile' : 'Add New Member'}
            </h3>
            <form onSubmit={handleSaveUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Officer Sipho Khumalo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="officer@company.za"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone:</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+27 76 000 0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Tier:</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                >
                  <option value="community">Community Member (Panic Button)</option>
                  <option value="guard">Patrol Guard</option>
                  <option value="supervisor">Security Supervisor</option>
                  <option value="admin">Security Admin</option>
                  <option value="manager">Security Manager</option>
                  <option value="headoffice">Head Office Executive</option>
                  <option value="developer">Developer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Number:</label>
                  <input
                    type="text"
                    value={userBadge}
                    onChange={(e) => setUserBadge(e.target.value)}
                    placeholder="SEC-8842"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Call Sign:</label>
                  <input
                    type="text"
                    value={userCallSign}
                    onChange={(e) => setUserCallSign(e.target.value)}
                    placeholder="Alpha-1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingUser ? 'Save Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
