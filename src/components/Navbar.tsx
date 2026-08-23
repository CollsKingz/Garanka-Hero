import React from 'react';
import {
  ShieldAlert,
  Radio,
  QrCode,
  BookOpen,
  Shield,
  BarChart3,
  Building2,
  Volume2,
  VolumeX,
  User,
  AlertOctagon,
  Layers,
  LogOut,
  SlidersHorizontal,
  Home,
  Smartphone,
  Calendar,
  Filter,
  Code2,
} from 'lucide-react';
import { UserRole, UserProfile, Incident, SecurityCompany, SiteBranch, HouseUnit, GlobalFilterState } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: UserProfile;
  company: SecurityCompany;
  branches: SiteBranch[];
  houses: HouseUnit[];
  activeIncidents: Incident[];
  isOnline: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  activeNavTab: string;
  onNavTabChange: (tab: string) => void;
  onSignOut: () => void;
  filters: GlobalFilterState;
  onFilterChange: (newFilters: Partial<GlobalFilterState>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  company,
  branches = [],
  houses = [],
  activeIncidents = [],
  isOnline,
  isMuted,
  onToggleMute,
  activeNavTab,
  onNavTabChange,
  onSignOut,
  filters,
  onFilterChange,
}) => {
  const triggeredCount = (activeIncidents || []).filter((i) => i.status === 'triggered' || i.status === 'responding').length;

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'community', label: 'Community Member', icon: '🏠' },
    { role: 'guard', label: 'Patrol / Guard', icon: '🛡️' },
    { role: 'supervisor', label: 'Supervisor', icon: '🎯' },
    { role: 'admin', label: 'Security Admin', icon: '⚙️' },
    { role: 'manager', label: 'Security Manager', icon: '📊' },
    { role: 'headoffice', label: 'Head Office', icon: '🏛️' },
    { role: 'developer', label: 'Developer & Slides', icon: '💻' },
  ];

  // Get active house for device dropdown filtering
  const activeHouse = houses.find((h) => h.id === filters.houseId);
  const houseDevices = activeHouse?.registeredDevices || [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Emergency Broadcast Alert Bar (if alarms active) */}
      {triggeredCount > 0 && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span>
                CRITICAL ACTIVE ALARM: {triggeredCount} Emergency Beacon{triggeredCount > 1 ? 's' : ''} Triggered
              </span>
            </div>
            <span className="text-[11px] font-mono opacity-90 hidden sm:inline">
              Control Room Live Tracing Active
            </span>
          </div>
        </div>
      )}

      {/* Main Top Header Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Active Company Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-slate-900">GARANKA HERO</span>
              <span className="text-[10px] font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {company.shortCode}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>{company.name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">{houses.length}/50 Houses</span>
            </div>
          </div>
        </div>

        {/* Dynamic Nav View Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
          <button
            id="nav-panic-btn"
            onClick={() => onNavTabChange('panic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeNavTab === 'panic'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Panic Button</span>
          </button>

          <button
            id="nav-map-btn"
            onClick={() => onNavTabChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeNavTab === 'map'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Map</span>
          </button>

          <button
            id="nav-qr-btn"
            onClick={() => onNavTabChange('patrol')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeNavTab === 'patrol'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Patrol QR</span>
          </button>

          <button
            id="nav-ob-btn"
            onClick={() => onNavTabChange('obbook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeNavTab === 'obbook'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>OB Book</span>
          </button>

          <button
            id="nav-eq-btn"
            onClick={() => onNavTabChange('equipment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeNavTab === 'equipment'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Equipment</span>
          </button>

          {/* Role console tab */}
          <button
            id="nav-role-dashboard-btn"
            onClick={() => onNavTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeNavTab === 'dashboard'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Role Dashboard</span>
          </button>
        </div>

        {/* User Status, Role Switcher, Mute Toggle & Sign Out Button */}
        <div className="flex items-center gap-2.5">
          {/* Sound Siren Toggle */}
          <button
            id="global-audio-toggle"
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            title={isMuted ? 'Unmute Audio & Sirens' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Quick Role Tester Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <span className="text-xs">👤</span>
            <select
              id="role-switcher-select"
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role} className="bg-white text-slate-900">
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prominent Sign Out Button */}
          <button
            id="global-signout-btn"
            onClick={onSignOut}
            className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-bold border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-xl text-xs transition shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* GLOBAL DROPDOWN FILTERS BAR (Site, House, Device, Time, Status) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
            <span>Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* 1. Site / Branch Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <select
                id="filter-site-select"
                value={filters.siteId}
                onChange={(e) => onFilterChange({ siteId: e.target.value })}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Sites & Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. House Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Home className="w-3 h-3 text-slate-400" />
              <select
                id="filter-house-select"
                value={filters.houseId}
                onChange={(e) => onFilterChange({ houseId: e.target.value, deviceId: 'all' })}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Houses ({houses.length}/50)</option>
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.houseNumber} - {h.residentName}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Device Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Smartphone className="w-3 h-3 text-slate-400" />
              <select
                id="filter-device-select"
                value={filters.deviceId}
                onChange={(e) => onFilterChange({ deviceId: e.target.value })}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Connected Devices</option>
                {houseDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deviceName} ({d.deviceType})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Time Range Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <select
                id="filter-timerange-select"
                value={filters.timeRange}
                onChange={(e) => onFilterChange({ timeRange: e.target.value as any })}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="today">Today (Active 24h)</option>
                <option value="shift">Current Active Shift</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>

            {/* 5. Incident Status Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                id="filter-status-select"
                value={filters.incidentStatus}
                onChange={(e) => onFilterChange({ incidentStatus: e.target.value as any })}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Incident Statuses</option>
                <option value="new">Triggered / New Alarms</option>
                <option value="responding">Responding & On Scene</option>
                <option value="resolved">Resolved & Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
