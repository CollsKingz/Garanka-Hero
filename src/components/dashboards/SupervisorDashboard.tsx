import React, { useState } from 'react';
import {
  AlertOctagon,
  Radio,
  UserCheck,
  CheckCircle2,
  Navigation,
  Clock,
  Phone,
  Layers,
  ChevronRight,
  AlertTriangle,
  FileText,
  MapPin,
  Flame,
} from 'lucide-react';
import { Incident, Checkpoint, PatrolScan, OBEntry, UserProfile } from '../../types';
import { LiveIncidentMap } from '../LiveIncidentMap';
import { soundService } from '../../services/soundService';

interface SupervisorDashboardProps {
  currentUser: UserProfile;
  incidents: Incident[];
  checkpoints: Checkpoint[];
  scans: PatrolScan[];
  obEntries: OBEntry[];
  onAssignResponder: (incidentId: string, guardId: string, guardName: string, callSign: string) => void;
  onUpdateIncidentStatus: (incidentId: string, status: any, notes?: string) => void;
  onSelectIncident: (id: string) => void;
  onOpenVoiceRoom?: (incident: Incident) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  currentUser,
  incidents = [],
  checkpoints = [],
  scans = [],
  obEntries = [],
  onAssignResponder,
  onUpdateIncidentStatus,
  onSelectIncident,
  onOpenVoiceRoom,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    (incidents || []).find((i) => i.status === 'triggered' || i.status === 'responding')?.id || incidents[0]?.id || null
  );

  const [assignModalIncident, setAssignModalIncident] = useState<Incident | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<{ id: string; name: string; callSign: string }>({
    id: 'usr-guard-01',
    name: 'Officer Sipho Khumalo',
    callSign: 'Alpha-1 Response',
  });

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const availableGuards = [
    { id: 'usr-guard-01', name: 'Officer Sipho Khumalo', callSign: 'Alpha-1 Tactical' },
    { id: 'usr-guard-02', name: 'Officer Tendai Moyo', callSign: 'Bravo-2 Mobile' },
    { id: 'usr-guard-03', name: 'Guard Lucas Sithole', callSign: 'Delta-4 Perimeter' },
    { id: 'usr-guard-04', name: 'Willem Coetzee', callSign: 'Medic-1 Marine' },
  ];

  const activeAlarmsCount = incidents.filter((i) => i.status === 'triggered' || i.status === 'responding').length;

  return (
    <div className="space-y-6 text-left">
      {/* Top Supervisor Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Supervisor Tactical Command
              </h1>
              <p className="text-xs text-slate-500">
                Site: <strong className="text-slate-700">{currentUser.siteName}</strong> • Logged in: {currentUser.name} ({currentUser.callSign})
              </p>
            </div>
          </div>
        </div>

        {/* Priority Status Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeAlarmsCount > 0 ? 'bg-red-600 animate-ping' : 'bg-emerald-500'}`}></span>
              <span className="text-xs font-bold text-slate-900 font-mono">{activeAlarmsCount} Active Alarms</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="text-xs font-mono text-slate-700 font-bold">
              {checkpoints.length} Patrol Posts Active
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Top/Left) and Triage Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Incident Map */}
        <div className="lg:col-span-8 space-y-4">
          <LiveIncidentMap
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => {
              setSelectedIncidentId(id);
              onSelectIncident(id);
            }}
            checkpoints={checkpoints}
            heightClass="h-[480px]"
          />

          {/* Selected Incident Live Tracing & Dispatch Deck */}
          {selectedIncident && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    {selectedIncident.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{selectedIncident.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      selectedIncident.status === 'triggered'
                        ? 'bg-red-600 text-white animate-pulse'
                        : selectedIncident.status === 'responding'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Status: {selectedIncident.status}
                  </span>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Reporter Profile</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedIncident.reporterName}</div>
                  <div className="text-slate-500 font-mono mt-0.5">{selectedIncident.reporterPhone}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">GPS Phone Tracing</div>
                  <div className="font-mono text-red-600 font-bold mt-0.5">
                    {selectedIncident.coordinates.lat.toFixed(5)}, {selectedIncident.coordinates.lng.toFixed(5)}
                  </div>
                  <div className="text-slate-600 truncate mt-0.5">
                    {selectedIncident.coordinates.address || 'Estate Perimeter Core'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Assigned Units</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedIncident.assignedResponders.length > 0
                      ? selectedIncident.assignedResponders.map((r) => r.callSign).join(', ')
                      : 'None Assigned'}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    ETA: {selectedIncident.assignedResponders[0]?.etaMinutes || '--'} mins
                  </div>
                </div>
              </div>

              {/* Action Controls for Supervisor */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="supervisor-assign-btn"
                    onClick={() => setAssignModalIncident(selectedIncident)}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Dispatch / Assign Responders</span>
                  </button>

                  {onOpenVoiceRoom && (
                    <button
                      id="supervisor-voice-btn"
                      onClick={() => onOpenVoiceRoom(selectedIncident)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm border border-slate-700 cursor-pointer"
                    >
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Incident Voice Room</span>
                    </button>
                  )}

                  {selectedIncident.status === 'responding' && (
                    <button
                      id="supervisor-onscene-btn"
                      onClick={() => onUpdateIncidentStatus(selectedIncident.id, 'on_scene')}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Mark Unit On-Scene</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedIncident.status !== 'resolved' && (
                    <button
                      id="supervisor-resolve-btn"
                      onClick={() =>
                        onUpdateIncidentStatus(
                          selectedIncident.id,
                          'resolved',
                          'Situation secured by security team. Area normal.'
                        )
                      }
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Resolved / Clear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Incident Feed List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>Active Incidents Deck ({incidents.length})</span>
              </h3>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {incidents.map((inc) => {
                const isSelected = selectedIncidentId === inc.id;
                return (
                  <div
                    key={inc.id}
                    id={`incident-card-${inc.id}`}
                    onClick={() => {
                      setSelectedIncidentId(inc.id);
                      onSelectIncident(inc.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/50 border-red-500 ring-2 ring-red-500/20 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-red-600">{inc.code}</span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          inc.status === 'triggered'
                            ? 'bg-red-600 text-white animate-pulse'
                            : inc.status === 'responding'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{inc.title}</h4>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>👤 {inc.reporterName}</span>
                      <span className="font-mono text-slate-400 text-[10px]">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {inc.assignedResponders.length > 0 && (
                      <div className="mt-2 text-[10px] text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                        <span>Responders: {inc.assignedResponders.map((r) => r.callSign).join(', ')}</span>
                        <span>ETA: {inc.assignedResponders[0]?.etaMinutes}m</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DISPATCH / ASSIGN MODAL */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">Dispatch Responders to Incident</h3>
            <p className="text-xs text-slate-500">
              Assign tactical guard unit to: <strong className="text-slate-800">{assignModalIncident.title}</strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Available Patrol Officer:</label>
              {availableGuards.map((guard) => (
                <button
                  key={guard.id}
                  id={`select-guard-${guard.id}`}
                  onClick={() => setSelectedGuard(guard)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition ${
                    selectedGuard.id === guard.id
                      ? 'bg-red-50 border-red-500 text-slate-900 ring-1 ring-red-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold">{guard.name}</div>
                    <div className="text-[10px] text-red-600 font-mono mt-0.5">{guard.callSign}</div>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Available</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setAssignModalIncident(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                id="confirm-dispatch-btn"
                onClick={() => {
                  soundService.playRadioClick();
                  onAssignResponder(
                    assignModalIncident.id,
                    selectedGuard.id,
                    selectedGuard.name,
                    selectedGuard.callSign
                  );
                  setAssignModalIncident(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                Transmit Dispatch Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
