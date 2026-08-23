import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Lock,
  Building2,
  Users,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Radio,
  ArrowRight,
  KeyRound,
  FileCode2,
} from 'lucide-react';
import { SecurityCompany, UserRole } from '../../types';

interface LoginScreenProps {
  companies: SecurityCompany[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onStartGoogleAuth: (email: string, role: UserRole, companyId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  onStartGoogleAuth,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('community');
  const [customEmail, setCustomEmail] = useState<string>('madihlabatc77@gmail.com');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  const rolePresets: { role: UserRole; title: string; name: string; email: string; badge: string; desc: string }[] = [
    {
      role: 'community',
      title: 'Community Member',
      name: 'Nomsa Dlamini',
      email: 'madihlabatc77@gmail.com',
      badge: 'Unit 14 Resident',
      desc: 'Instant red panic button, real-time GPS beacon, house unit linking',
    },
    {
      role: 'guard',
      title: 'Patrol Guard',
      name: 'Officer Sipho Khumalo',
      email: 's.khumalo@aegissec.co.za',
      badge: 'Alpha-1 Tactical',
      desc: 'Optical QR patrol scanner, camera checkpoint verification, OB book logging',
    },
    {
      role: 'supervisor',
      title: 'Security Supervisor',
      name: 'Kagiso Sithole',
      email: 'k.sithole@aegissec.co.za',
      badge: 'Control Command',
      desc: 'Live map dispatch, responder route navigation, OB digital sign-off',
    },
    {
      role: 'admin',
      title: 'Security Admin',
      name: 'Elena Rostova',
      email: 'elena.rostova@aegissec.co.za',
      badge: 'System Admin',
      desc: 'House & device quota control (50/2 enforcement), QR checkpoint generator',
    },
    {
      role: 'manager',
      title: 'Security Manager',
      name: 'Col. Marcus Vance',
      email: 'marcus.vance@aegissec.co.za',
      badge: 'Regional Ops',
      desc: 'Capacity intelligence, SLA response analytics, equipment registers',
    },
    {
      role: 'headoffice',
      title: 'Head Office Executive',
      name: 'Dr. Sarah Ndlovu',
      email: 's.ndlovu@aegissec-group.com',
      badge: 'Executive Command',
      desc: 'Multi-branch national command, DEFCON alert broadcasts, enterprise oversight',
    },
    {
      role: 'developer',
      title: 'Lead Systems Engineer',
      name: 'Dev Platform Architect',
      email: 'engineer@aegissec.dev',
      badge: 'Developer Slides & Sandbox',
      desc: 'Interactive slide deck presentation, 50-house/2-device quota tester, engine sandbox',
    },
  ];

  const handleRoleSelect = (preset: (typeof rolePresets)[0]) => {
    setSelectedRole(preset.role);
    setCustomEmail(preset.email);
  };

  const handleGoogleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customEmail) return;
    setIsSigningIn(true);
    setTimeout(() => {
      onStartGoogleAuth(customEmail, selectedRole, activeCompany.id);
      setIsSigningIn(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents (Red and White palette) */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-80 pointer-events-none"></div>

      <div className="w-full max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2.5 bg-red-600 text-white px-5 py-2 rounded-2xl shadow-lg shadow-red-500/20">
            <Shield className="w-6 h-6 fill-white text-white" />
            <span className="font-black tracking-wider text-base uppercase">GARANKA HERO</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Emergency Panic & Operations Workspace
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Multi-tenant security platform with real-time GPS tracing, patrol verification, and Firebase Firestore cloud synchronization.
          </p>
        </div>

        {/* Main Authentication Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Security Company Tenant Selector & Google Sign-In */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Active Security Company Tenant
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Users authenticate into their specific security provider workspace.
              </p>

              {/* Company Selector Dropdown */}
              <div className="space-y-2">
                {companies.map((comp) => {
                  const isSelected = comp.id === selectedCompanyId;
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => onSelectCompany(comp.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-red-600 bg-red-50/70 text-slate-900 shadow-sm ring-1 ring-red-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          {comp.logo}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900">{comp.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {comp.region} • <strong className="text-red-700">Max {comp.planLimitHouses} Houses</strong>
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google OAuth Action Button */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  2. Sign In with Google (OAuth)
                </span>
                <p className="text-xs text-slate-500">
                  After Google verification, a 2-factor OTP code will be sent to your email for identity confirmation.
                </p>
              </div>

              {/* Google Button */}
              <motion.button
                id="google-signin-btn"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleGoogleSubmit()}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold border-2 border-slate-200 hover:border-red-400 py-3.5 px-4 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                {/* Authentic Google "G" Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.24 21.28 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.24 2.72 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="text-sm">
                  {isSigningIn ? 'Connecting to Google...' : 'Continue with Google Account'}
                </span>
              </motion.button>

              {/* Email Override input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">
                  Target Account Email for OTP Delivery:
                </label>
                <div className="flex gap-2">
                  <input
                    id="login-email-input"
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="user@domain.com"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-red-500 focus:bg-white"
                  />
                  <button
                    id="submit-auth-btn"
                    onClick={() => handleGoogleSubmit()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Role Picker & Strict RBAC Description */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  3. Select Profile & Role Access
                </span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Strict RBAC
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Users are strictly routed to their assigned dashboard. Select a persona below to authenticate:
              </p>

              {/* Role Cards List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {rolePresets.map((preset) => {
                  const isSelected = selectedRole === preset.role;
                  return (
                    <div
                      key={preset.role}
                      id={`role-card-${preset.role}`}
                      onClick={() => handleRoleSelect(preset)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-50/80 shadow-sm ring-1 ring-red-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {preset.role === 'community' && '🏠'}
                            {preset.role === 'guard' && '🛡️'}
                            {preset.role === 'supervisor' && '🎯'}
                            {preset.role === 'admin' && '⚙️'}
                            {preset.role === 'manager' && '📊'}
                            {preset.role === 'headoffice' && '🏛️'}
                            {preset.role === 'developer' && '💻'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <span>{preset.title}</span>
                              <span className="text-[10px] font-mono font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {preset.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              {preset.desc}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 ml-2" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Security Architecture Badge */}
            <div className="bg-red-50 border border-red-200/80 rounded-2xl p-4 flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-xs text-slate-700">
                <strong>Multi-Tenant Quota Enforced:</strong> 50 houses per company limit and 2 devices per house limit
                are actively monitored.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
