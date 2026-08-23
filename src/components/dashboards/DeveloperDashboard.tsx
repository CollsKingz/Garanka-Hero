import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  AlertTriangle,
  Lock,
  Terminal,
  Activity,
  Cpu,
  Database,
  Radio,
} from 'lucide-react';
import { HouseUnit, RegisteredDevice, SecurityCompany, UserProfile } from '../../types';
import { TenantPlanService, MAX_HOUSES_PER_COMPANY, MAX_DEVICES_PER_HOUSE } from '../../services/tenantPlanService';

interface DeveloperDashboardProps {
  currentUser: UserProfile;
  company: SecurityCompany;
  houses: HouseUnit[];
  onAddHouse: (houseData: Omit<HouseUnit, 'id' | 'companyId' | 'registeredDevices'>) => { success: boolean; message?: string };
  onDeleteHouse: (houseId: string) => void;
  onAddDevice: (houseId: string, deviceData: Omit<RegisteredDevice, 'id' | 'houseId'>) => { success: boolean; message?: string };
  onDeleteDevice: (houseId: string, deviceId: string) => void;
  onTriggerTestPanic: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  currentUser,
  company,
  houses = [],
  onAddHouse,
  onDeleteHouse,
  onAddDevice,
  onDeleteDevice,
  onTriggerTestPanic,
}) => {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(false);
  const [sandboxMessage, setSandboxMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick form state for testing 50 house limit
  const [testHouseNumber, setTestHouseNumber] = useState<string>('Unit 51');
  const [testResidentName, setTestResidentName] = useState<string>('David Meyer');
  const [selectedHouseForDevice, setSelectedHouseForDevice] = useState<string>((houses || [])[0]?.id || '');
  const [testDeviceName, setTestDeviceName] = useState<string>('Extra Keyfob 3');

  const slides = [
    {
      id: 1,
      tag: 'ARCHITECTURE & MULTI-TENANCY',
      title: 'Multi-Tenant Security Workspaces',
      subtitle: 'Isolated Tenant Segregation & Strict Workspace RBAC',
      icon: <Building2 className="w-8 h-8 text-red-600" />,
      bullets: [
        'Each Security Company (e.g. Aegis, Vanguard, ShieldCorp) operates as an independent tenant partition.',
        'Zero cross-company data leakage: Incidents, checkpoints, patrol logs, and equipment are tied to companyId.',
        'Users are registered and approved for a specific company workspace, strictly routing them to their assigned role dashboard.',
      ],
      codeSnippet: `// Multi-Tenant Partitioning Model
interface SecurityCompany {
  id: string;
  name: string;
  planLimitHouses: 50; // Strictly enforced max quota
  maxDevicesPerHouse: 2; // Strict resident hardware cap
}
// Middleware ensures request.user.companyId === resource.companyId`,
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
        'Each house is permitted a maximum of 2 connected devices (e.g. Resident Mobile App + Perimeter Panic FOB).',
        'Backend service blocks additions exceeding quota with descriptive error payloads.',
      ],
      codeSnippet: `// Business Logic Constraint Check
static validateAddHouse(companyHouses: HouseUnit[]) {
  if (companyHouses.length >= 50) {
    throw new QuotaLimitError("Plan limit of 50 houses reached.");
  }
}
static validateAddDevice(house: HouseUnit) {
  if (house.registeredDevices.length >= 2) {
    throw new DeviceLimitError("Max 2 devices allowed per house.");
  }
}`,
      metricLabel: 'Connected Houses Quota',
      metricValue: `${houses.length} / ${MAX_HOUSES_PER_COMPANY} Houses`,
    },
    {
      id: 3,
      tag: 'AUTHENTICATION & 2FA',
      title: 'Google OAuth & Email OTP Security Pipeline',
      subtitle: 'Two-Factor Cryptographic Identity Verification',
      icon: <Lock className="w-8 h-8 text-red-600" />,
      bullets: [
        'Step 1: Sign in with Google (OAuth) establishes verified identity and email address.',
        'Step 2: Time-based One-Time Password (OTP) dispatched to email verifies active security company authorization.',
        'If OTP fails or expires, dashboard access is completely blocked with no bypass.',
      ],
      codeSnippet: `// 2FA Verification State Machine
const onGoogleAuth = async (email, companyId) => {
  const otpCode = generateSecureOtp(); // e.g. "749201"
  await sendEmailOtp(email, otpCode);
  setAuthState({ status: 'PENDING_OTP', email, companyId });
};
// Access to dashboard granted ONLY upon successful OTP resolution`,
      metricLabel: 'Auth Standard',
      metricValue: 'Google OAuth + 2FA OTP',
    },
    {
      id: 4,
      tag: 'REAL-TIME DISPATCH ENGINE',
      title: 'Live Phone GPS Tracing & Responder Navigation',
      subtitle: 'High-Frequency Coordinate Telemetry & Web Audio Sirens',
      icon: <Smartphone className="w-8 h-8 text-red-600" />,
      bullets: [
        'Large red panic button initiates immediate high-frequency GPS coordinate broadcast.',
        'Synthesizer Web Audio API generates authentic dual-tone emergency siren frequencies.',
        'Google Maps Leaflet engine renders dynamic responder routing with real-time ETA calculation.',
      ],
      codeSnippet: `// Geolocation & High-Accuracy Watcher
navigator.geolocation.watchPosition(
  (pos) => dispatchCoordinates({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy
  }),
  { enableHighAccuracy: true, timeout: 5000 }
);`,
      metricLabel: 'GPS Update Frequency',
      metricValue: '1 Hz Live Polling',
    },
    {
      id: 5,
      tag: 'SECURITY OPERATIONS SUITE',
      title: 'Patrol QR Scanner, OB Book & Equipment Chain',
      subtitle: 'End-to-End Operational Integrity & Audit Logs',
      icon: <ShieldCheck className="w-8 h-8 text-red-600" />,
      bullets: [
        'Optical QR patrol scanner verifies physical security guard presence at critical checkpoints.',
        'Digital Occurrence Book (OB Book) maintains immutable timestamped records with supervisor digital signatures.',
        'Equipment register manages custody handovers (Radios, Bodycams, Ballistic Vests).',
      ],
      codeSnippet: `// Occurrence Book Digital Signature
interface OBEntry {
  obNumber: "OB 142/08/2026";
  category: "ACCESS_CONTROL";
  supervisorSignature: "Kagiso Sithole (Signed 11:45)";
  status: "approved";
}`,
      metricLabel: 'Audit Readiness',
      metricValue: '100% Digital Chain',
    },
  ];

  // Autoplay slides
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoplay, slides.length]);

  const currentSlide = slides[activeSlide];

  // Test adding a house (to demonstrate 50 house limit enforcement)
  const handleTestAddHouse = () => {
    const res = onAddHouse({
      siteId: 'site-sandton',
      houseNumber: testHouseNumber,
      streetAddress: `${testHouseNumber} Sandton Drive`,
      residentName: testResidentName,
      residentEmail: `${testResidentName.toLowerCase().replace(' ', '.')}@domain.za`,
      residentPhone: '+27 82 555 9090',
      coordinates: { lat: -26.1080, lng: 28.0570 },
      joinedDate: '2026-08-23',
      status: 'active',
    });

    if (res.success) {
      setSandboxMessage({ type: 'success', text: `Success: ${testHouseNumber} registered into company plan.` });
    } else {
      setSandboxMessage({ type: 'error', text: res.message || 'Error: Limit reached' });
    }
  };

  // Test adding bulk houses to hit limit
  const handleFillHousesToLimit = () => {
    let added = 0;
    const needed = MAX_HOUSES_PER_COMPANY - houses.length;
    if (needed <= 0) {
      setSandboxMessage({
        type: 'error',
        text: `Plan is already at the maximum limit of ${MAX_HOUSES_PER_COMPANY} houses.`,
      });
      return;
    }

    for (let i = 1; i <= needed; i++) {
      const num = `Unit ${houses.length + i}`;
      const res = onAddHouse({
        siteId: 'site-sandton',
        houseNumber: num,
        streetAddress: `${num} Security Boulevard`,
        residentName: `Resident ${num}`,
        residentEmail: `resident${houses.length + i}@estate.za`,
        residentPhone: '+27 82 000 1111',
        coordinates: { lat: -26.1080 + (i * 0.0001), lng: 28.0570 + (i * 0.0001) },
        joinedDate: '2026-08-23',
        status: 'active',
      });
      if (res.success) added++;
    }

    setSandboxMessage({
      type: 'success',
      text: `Added ${added} houses. Workspace is now at exact plan capacity (${MAX_HOUSES_PER_COMPANY} / ${MAX_HOUSES_PER_COMPANY}). Next addition will trigger limit rejection.`,
    });
  };

  // Test adding device to house
  const handleTestAddDevice = () => {
    if (!selectedHouseForDevice) return;
    const res = onAddDevice(selectedHouseForDevice, {
      deviceName: testDeviceName,
      deviceType: 'iot_keyfob',
      deviceUid: `TEST-DEV-${Date.now().toString().slice(-4)}`,
      registeredAt: '2026-08-23',
      lastActive: 'Just now',
      batteryPercent: 100,
      status: 'active',
    });

    if (res.success) {
      setSandboxMessage({ type: 'success', text: `Success: Device registered to house.` });
    } else {
      setSandboxMessage({ type: 'error', text: res.message || 'Error: Device limit reached' });
    }
  };

  const planMetrics = TenantPlanService.getCompanyPlanMetrics(company, houses);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white p-2 rounded-xl">
              <Code2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Developer Slides & Architecture Console
              </h1>
              <p className="text-xs text-slate-500">
                Interactive architecture slide deck and live multi-tenant plan constraint sandbox.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Specs */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs font-mono text-slate-700">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-red-600" />
            <span>React 19 + TypeScript</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>50-House / 2-Device Quota Engine</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: INTERACTIVE SLIDE DECK PRESENTATION */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-wider uppercase text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
              SLIDE {activeSlide + 1} OF {slides.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              {currentSlide.tag}
            </span>
          </div>

          {/* Slide Deck Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isAutoplay
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoplay ? 'Pause Auto' : 'Auto Play'}</span>
            </button>

            <button
              onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Slide Left: Explanation */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
                  {currentSlide.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {currentSlide.title}
                  </h2>
                  <p className="text-xs text-red-600 font-semibold">{currentSlide.subtitle}</p>
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-2.5 pt-2">
                {currentSlide.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Key Metric Badge */}
              <div className="pt-3">
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {currentSlide.metricLabel}:
                  </span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {currentSlide.metricValue}
                  </span>
                </div>
              </div>
            </div>

            {/* Slide Right: Interactive Code Architecture Snippet */}
            <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-2xl text-slate-200 font-mono text-xs overflow-x-auto space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] text-slate-400 ml-2">architecture-spec.ts</span>
                </div>
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <pre className="text-[11px] leading-relaxed text-red-300">
                <code>{currentSlide.codeSnippet}</code>
              </pre>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Progress Indicators */}
        <div className="flex justify-center gap-2 pt-4">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                activeSlide === idx ? 'w-10 bg-red-600' : 'w-2.5 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: INTERACTIVE PLAN CONSTRAINT & LIMIT SANDBOX */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Live Plan Enforcement Sandbox (50 Houses / 2 Devices)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Directly verify that the application strictly blocks additions beyond 50 houses per company and 2 devices per house.
            </p>
          </div>

          {/* Fill to Limit Helper */}
          <button
            id="fill-to-limit-btn"
            onClick={handleFillHousesToLimit}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast-Fill Quota to 50 Houses (Test Limit)</span>
          </button>
        </div>

        {/* Real-time Plan Meter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold uppercase">Company Houses Quota</span>
              <span className="font-mono font-bold text-slate-900">
                {planMetrics.totalHouses} / {planMetrics.maxHouses} Max
              </span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  planMetrics.isAtLimit ? 'bg-red-600' : planMetrics.isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${planMetrics.houseUsagePercent}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{planMetrics.remainingHouses} slots remaining</span>
              <strong className={planMetrics.isAtLimit ? 'text-red-600 font-bold' : 'text-slate-700'}>
                {planMetrics.isAtLimit ? 'QUOTA FULL (MAX 50)' : `${planMetrics.houseUsagePercent}% Used`}
              </strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold uppercase">Device Policy</span>
              <span className="font-mono font-bold text-red-600">Strict Cap: 2 / House</span>
            </div>
            <div className="text-xs text-slate-700">
              Total active hardware units: <strong className="text-slate-900 font-mono">{planMetrics.totalDevices} devices</strong>
            </div>
            <div className="text-[11px] text-slate-500">
              Allocated across {houses.length} houses. 3rd device registrations are rejected.
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold uppercase">Emergency Trigger Test</span>
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">LIVE API</span>
            </div>
            <button
              onClick={onTriggerTestPanic}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Simulate Emergency Alarm Trigger</span>
            </button>
          </div>
        </div>

        {/* Sandbox Feedback Message */}
        {sandboxMessage && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-3 border transition-all ${
              sandboxMessage.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            {sandboxMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{sandboxMessage.text}</span>
          </div>
        )}

        {/* Interactive Limit Testing Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Test 1: Add House */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-600" />
                Test House Registration (Max 50)
              </span>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                {houses.length}/50
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">House Number:</label>
                <input
                  type="text"
                  value={testHouseNumber}
                  onChange={(e) => setTestHouseNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">Resident Name:</label>
                <input
                  type="text"
                  value={testResidentName}
                  onChange={(e) => setTestResidentName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <button
              id="test-add-house-btn"
              onClick={handleTestAddHouse}
              className="w-full bg-white hover:bg-slate-100 text-red-600 font-bold border border-red-300 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Attempt Add House to Workspace</span>
            </button>
          </div>

          {/* Test 2: Add Device to House */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-red-600" />
                Test Device Registration (Max 2 per House)
              </span>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                Max 2
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">Select Target House:</label>
                <select
                  value={selectedHouseForDevice}
                  onChange={(e) => setSelectedHouseForDevice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                >
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.houseNumber} ({h.registeredDevices?.length || 0}/2 devices)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold">Device Name:</label>
                <input
                  type="text"
                  value={testDeviceName}
                  onChange={(e) => setTestDeviceName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <button
              id="test-add-device-btn"
              onClick={handleTestAddDevice}
              className="w-full bg-white hover:bg-slate-100 text-red-600 font-bold border border-red-300 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Attempt Add Device to Selected House</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
