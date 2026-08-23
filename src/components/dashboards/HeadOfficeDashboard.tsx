import React, { useState } from 'react';
import {
  Building2,
  Globe2,
  AlertOctagon,
  Shield,
  Radio,
  Send,
  Users,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import { SiteBranch, Incident, UserProfile } from '../../types';

interface HeadOfficeDashboardProps {
  currentUser: UserProfile;
  branches: SiteBranch[];
  incidents: Incident[];
  onBroadcastMessage?: (message: string) => void;
  onOpenVoiceRoom?: (incident: Incident) => void;
}

export const HeadOfficeDashboard: React.FC<HeadOfficeDashboardProps> = ({
  currentUser,
  branches = [],
  incidents = [],
  onBroadcastMessage,
  onOpenVoiceRoom,
}) => {
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [broadcastSuccess, setBroadcastSuccess] = useState<boolean>(false);

  const totalGuardsAcrossSites = (branches || []).reduce((acc, b) => acc + (b?.activeGuardsCount || 0), 0);
  const totalOpenIncidents = (incidents || []).filter((i) => i.status !== 'resolved').length;

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    if (onBroadcastMessage) onBroadcastMessage(broadcastText);
    setBroadcastSuccess(true);
    setBroadcastText('');
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Executive Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Head Office Executive Command Center
            </h1>
            <p className="text-xs text-slate-500">
              Multi-site enterprise surveillance, national branch escalations, and crisis coordination
            </p>
          </div>
        </div>

        {/* Threat Level Indicator */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Enterprise Condition</div>
            <div className="text-xs font-black text-red-600">DEFCON 3 • ELEVATED WATCH</div>
          </div>
          <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
        </div>
      </div>

      {/* High-Level Multi-Site KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Monitored Facilities</div>
          <div className="text-3xl font-black text-slate-900 font-mono">{branches.length} Sites</div>
          <div className="text-[11px] text-slate-500">Johannesburg, Cape Town, Durban</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Active Deployed Guard Force</div>
          <div className="text-3xl font-black text-emerald-600 font-mono">{totalGuardsAcrossSites} Officers</div>
          <div className="text-[11px] text-emerald-600 font-semibold">100% Shifts Manning Status</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Active Regional Incidents</div>
          <div className="text-3xl font-black text-red-600 font-mono">{totalOpenIncidents} Unresolved</div>
          <div className="text-[11px] text-red-600 font-semibold">Real-time GPS Tracking Active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Corporate Security SLA</div>
          <div className="text-3xl font-black text-slate-800 font-mono">99.4%</div>
          <div className="text-[11px] text-slate-500">Response & Patrol Compliance</div>
        </div>
      </div>

      {/* Branches Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Branch Directory */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe2 className="w-4 h-4 text-red-600" />
              <span>Multi-Site Branch Operational Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branches.map((branch) => {
                const branchIncidents = incidents.filter(
                  (i) => i.siteId === branch.id && i.status !== 'resolved'
                );
                return (
                  <div
                    key={branch.id}
                    className="p-5 rounded-3xl bg-slate-50 border border-slate-200 hover:border-red-200 space-y-3 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{branch.name}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-600" />
                          <span>{branch.region}</span>
                        </div>
                      </div>

                      {branchIncidents.length > 0 ? (
                        <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                          {branchIncidents.length} Alert
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Normal
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-2xl border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">On-Duty Force</div>
                        <div className="font-bold text-slate-800 mt-0.5">{branch.activeGuardsCount} Guards</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Supervisor</div>
                        <div className="font-bold text-slate-800 mt-0.5 truncate">{branch.supervisorName}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 font-mono">
                      📞 Control: {branch.supervisorPhone}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Broadcast Alert Dispatcher */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Radio className="w-4 h-4 text-red-600" />
              <span>Corporate Broadcast Command</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Transmit urgent security directives or crisis bulletins simultaneously to all {branches.length} branch control rooms and field officer devices.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <textarea
                id="head-office-broadcast-textarea"
                rows={4}
                required
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Type high-priority corporate directive or security alert..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
              ></textarea>

              <button
                type="submit"
                id="submit-broadcast-btn"
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast to All Sites</span>
              </button>
            </form>

            {broadcastSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Executive directive dispatched across all branch channels.</span>
              </div>
            )}
          </div>

          {/* Active Voice Intercoms for Head Office */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Live Tactical Voice Channels</span>
              </h3>
              <span className="text-[10px] bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 rounded-full font-bold">
                HEAD OFFICE OVERRIDE
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              As Head Office Command, you have master authorization to monitor and speak into any branch voice channel.
            </p>

            <div className="space-y-2 pt-1">
              {incidents.slice(0, 3).map((inc) => (
                <div
                  key={inc.id}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                        {inc.code}
                      </span>
                      <span className="text-xs font-bold text-white truncate">{inc.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Site: {inc.siteName} • {inc.assignedResponders.length} Responders
                    </div>
                  </div>

                  {onOpenVoiceRoom && (
                    <button
                      id={`ho-join-voice-${inc.id}`}
                      onClick={() => onOpenVoiceRoom(inc)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Join Intercom</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
