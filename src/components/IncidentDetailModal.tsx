import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  X,
  Radio,
  Volume2,
} from 'lucide-react';
import { Incident, UserProfile } from '../types';

interface IncidentDetailModalProps {
  incident: Incident;
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateStatus: (incidentId: string, status: any, notes?: string) => void;
  onAddTimelineEvent: (incidentId: string, action: string, notes: string) => void;
  onOpenVoiceRoom?: (incident: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  currentUser,
  onClose,
  onUpdateStatus,
  onAddTimelineEvent,
  onOpenVoiceRoom,
}) => {
  const [timelineNote, setTimelineNote] = useState<string>('');

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.coordinates.lat},${incident.coordinates.lng}`;

  const handlePostTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineNote.trim()) return;
    onAddTimelineEvent(incident.id, 'Officer Radio Update', timelineNote);
    setTimelineNote('');
  };

  const isCommunity = currentUser.role === 'community';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 text-left relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                {incident.code}
              </span>
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                  incident.status === 'triggered'
                    ? 'bg-red-600 text-white animate-pulse'
                    : incident.status === 'responding'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {incident.status}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Severity: <strong className="uppercase text-red-600">{incident.severity}</strong>
              </span>
            </div>

            {/* Tactical Staff Voice Channel CTA (if not community) */}
            {!isCommunity && onOpenVoiceRoom && (
              <button
                id="modal-open-voice-btn"
                onClick={() => onOpenVoiceRoom(incident)}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-500/20 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Join Tactical Voice Room</span>
              </button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-tight">
            {incident.title}
          </h2>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Site: <strong className="text-slate-800">{incident.siteName}</strong></span>
            <span>•</span>
            <span>Created: {new Date(incident.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Reporter & Location Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reporter Profile</div>
            <div className="text-base font-bold text-slate-900">{incident.reporterName}</div>
            <div className="text-slate-600">Role: <strong className="text-slate-800">{incident.reporterRole}</strong></div>
            <div className="text-slate-600 font-mono">Phone: {incident.reporterPhone}</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GPS Phone Tracing</div>
            <div className="font-mono text-red-600 font-bold text-sm">
              {incident.coordinates.lat.toFixed(5)}, {incident.coordinates.lng.toFixed(5)}
            </div>
            <div className="text-slate-700 truncate">
              {incident.coordinates.address || 'Sandton City Level P2'}
            </div>
            <div className="pt-1">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-bold"
              >
                <span>Navigate via Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Assigned Responders */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-red-600" />
              <span>Assigned Security Responders ({incident.assignedResponders.length})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incident.assignedResponders.map((resp, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                <div>
                  <div className="font-bold text-slate-900">{resp.name}</div>
                  <div className="text-[10px] text-red-600 font-mono font-bold">{resp.callSign}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">ETA</div>
                  <div className="text-xs font-bold text-emerald-700">{resp.etaMinutes} mins</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Log */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <span>Incident Tactical Timeline</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {incident.timeline.map((event) => (
              <div key={event.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-bold text-slate-900">{event.action}</span>
                  <span className="font-mono text-[10px] text-slate-400">{event.timestamp}</span>
                </div>
                <div className="text-[11px] text-red-600 font-semibold">Actor: {event.actor}</div>
                {event.notes && <div className="text-slate-700 text-[11px] mt-0.5">{event.notes}</div>}
              </div>
            ))}
          </div>

          {/* Quick Add Timeline Note Form */}
          <form onSubmit={handlePostTimeline} className="flex gap-2 pt-2">
            <input
              type="text"
              value={timelineNote}
              onChange={(e) => setTimelineNote(e.target.value)}
              placeholder="Log radio status update or situation note..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Post Update
            </button>
          </form>
        </div>

        {/* Resolution Actions */}
        {incident.status !== 'resolved' && (
          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {incident.status === 'responding' && (
                <button
                  onClick={() => onUpdateStatus(incident.id, 'on_scene')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Confirm Unit Arrived On Scene
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateStatus(
                    incident.id,
                    'resolved',
                    'Resolved by Commander. Incident debrief completed.'
                  )
                }
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Incident Resolved & Closed</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
