import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  X,
  Radio,
  Printer,
  FileText,
  Camera,
  Plus,
  ShieldAlert,
  MapPin,
  User,
  Shield,
  FileCheck,
  Building2,
  Check,
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
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  // Evidence Photos State
  const [localPhotos, setLocalPhotos] = useState<
    { id: string; url: string; caption: string; uploadedAt: string; uploadedBy: string }[]
  >(incident.evidencePhotos || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');
  const [showAddPhotoForm, setShowAddPhotoForm] = useState<boolean>(false);

  // Responder Notes State
  const [responderNote, setResponderNote] = useState<string>(
    incident.responderNotes || incident.notes || ''
  );
  const [isSavedNote, setIsSavedNote] = useState<boolean>(false);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.coordinates.lat},${incident.coordinates.lng}`;

  const handlePostTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineNote.trim()) return;
    onAddTimelineEvent(incident.id, 'Officer Radio Update', timelineNote);
    setTimelineNote('');
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    const photoObj = {
      id: 'photo-' + Date.now(),
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Tactical Evidence Capture',
      uploadedAt: new Date().toISOString(),
      uploadedBy: `${currentUser.name} (${currentUser.role})`,
    };

    setLocalPhotos((prev) => [...prev, photoObj]);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setShowAddPhotoForm(false);

    onAddTimelineEvent(
      incident.id,
      'Evidence Photo Attached',
      `Photographic evidence added: ${photoObj.caption}`
    );
  };

  const handleSaveResponderNotes = () => {
    if (!responderNote.trim()) return;
    onAddTimelineEvent(incident.id, 'Responder Notes Updated', responderNote);
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 2500);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const isCommunity = currentUser.role === 'community';
  const dossierCode = incident.legalDossierRef || `DOSSIER-2026-AEGIS-${incident.code.slice(-4)}-A`;

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

            <div className="flex items-center gap-2">
              {/* PRINT TO PDF BUTTON */}
              <button
                id="print-incident-pdf-btn"
                onClick={() => setShowPrintPreview(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print to PDF Report</span>
              </button>

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

        {/* Responder Notes & Assessment Section */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Responder & Situation Notes (Included in Legal PDF)</span>
            </div>
            {isSavedNote && (
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved to Report
              </span>
            )}
          </div>
          <textarea
            rows={2}
            value={responderNote}
            onChange={(e) => setResponderNote(e.target.value)}
            data-gramm="false"
            data-enable-grammarly="false"
            placeholder="Type executive responder notes, initial situation assessment, or legal observations..."
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveResponderNotes}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Update Responder Notes
            </button>
          </div>
        </div>

        {/* Evidence Photos Gallery Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-red-600" />
              <span>Photographic Evidence Gallery ({localPhotos.length})</span>
            </div>
            <button
              onClick={() => setShowAddPhotoForm(!showAddPhotoForm)}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Photo</span>
            </button>
          </div>

          {showAddPhotoForm && (
            <form onSubmit={handleAddPhoto} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
              <div className="text-xs font-bold text-slate-900">Attach Evidence Photo URL</div>
              <input
                type="url"
                required
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="Caption / Location description (e.g. Severed fence section 4B)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoForm(false)}
                  className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm"
                >
                  Attach to Evidence Roll
                </button>
              </div>
            </form>
          )}

          {localPhotos.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
              No evidence photos attached. Click "Attach Photo" to attach body cam or field photos.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {localPhotos.map((photo) => (
                <div key={photo.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden group">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-28 object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="p-2 space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-900 line-clamp-1">{photo.caption}</p>
                    <p className="text-[9px] text-slate-500 font-mono">{photo.uploadedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              data-gramm="false"
              data-enable-grammarly="false"
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

      {/* BRANDED PRINTABLE PDF REPORT PREVIEW MODAL */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col text-slate-900 text-left relative">
            {/* Modal Controls Bar (Hidden in Print) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">Incident PDF Report & Legal Dossier Preview</h3>
                  <p className="text-[11px] text-slate-400">
                    A4 Printable Document | ISO 27001 Security Audit Format
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="modal-trigger-print-btn"
                  onClick={handleTriggerPrint}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE DOCUMENT BODY */}
            <div id="printable-incident-report" className="p-8 sm:p-12 space-y-6 bg-white text-slate-900 font-sans">
              {/* Official Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-red-700 font-black tracking-widest text-xs uppercase">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span>AEGIS TACTICAL SECURITY OPERATIONS</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-950 mt-1 uppercase tracking-tight">
                    Official Security Incident Report
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    CONFIDENTIAL DOSSIER - FOR LEGAL & ADMINISTRATIVE FILING
                  </p>
                </div>

                <div className="text-right border-l-2 border-slate-200 pl-4 py-1 text-xs">
                  <div className="font-mono text-xs font-bold text-slate-900">
                    Dossier Ref: <strong className="text-red-700">{dossierCode}</strong>
                  </div>
                  <div className="text-slate-600 text-[11px] font-mono mt-0.5">
                    Incident Code: <strong>{incident.code}</strong>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">
                    Generated: {new Date().toLocaleString()}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Printing Officer: {currentUser.name} ({currentUser.role.toUpperCase()})
                  </div>
                </div>
              </div>

              {/* Executive Incident Summary Box */}
              <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3 page-break-inside-avoid">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    1. Executive Incident Summary
                  </h3>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      incident.severity === 'critical' || incident.severity === 'high'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    Severity: {incident.severity}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Incident Title</span>
                    <strong className="text-slate-900 font-bold leading-snug">{incident.title}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Category</span>
                    <strong className="text-slate-900">{incident.category}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Status</span>
                    <strong className="text-slate-900 uppercase">{incident.status}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Facility / Site</span>
                    <strong className="text-slate-900">{incident.siteName}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">GPS Coordinate Position</span>
                    <strong className="font-mono text-red-700">
                      {incident.coordinates.lat.toFixed(5)}, {incident.coordinates.lng.toFixed(5)}
                    </strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Physical / Zone Address</span>
                    <span className="text-slate-900 font-medium">
                      {incident.coordinates.address || 'Sandton City Level P2 North Gate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reporting Party & Dispatch */}
              <div className="border border-slate-300 rounded-2xl p-4 space-y-2 text-xs page-break-inside-avoid">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-slate-200 pb-1.5">
                  2. Reporting Party & Dispatch Control
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold">Reporter Name</span>
                    <span className="font-bold text-slate-900">{incident.reporterName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold">Reporter Role / Contact</span>
                    <span className="text-slate-800">{incident.reporterRole} ({incident.reporterPhone})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold">Gate / Unit Number</span>
                    <span className="text-slate-800">{incident.houseNumber || 'Sector Gate 4'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold">Time Reported</span>
                    <span className="font-mono text-slate-900">{new Date(incident.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Responders */}
              <div className="border border-slate-300 rounded-2xl p-4 space-y-2 text-xs page-break-inside-avoid">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-slate-200 pb-1.5">
                  3. Assigned Tactical Response Units ({incident.assignedResponders.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-300">
                        <th className="py-1.5 px-2">Officer Name</th>
                        <th className="py-1.5 px-2">Radio Call-Sign</th>
                        <th className="py-1.5 px-2">Response Status</th>
                        <th className="py-1.5 px-2">Arrival ETA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {incident.assignedResponders.map((resp, i) => (
                        <tr key={i} className="text-slate-900">
                          <td className="py-2 px-2 font-bold">{resp.name}</td>
                          <td className="py-2 px-2 font-mono font-bold text-red-700">{resp.callSign}</td>
                          <td className="py-2 px-2 uppercase font-semibold">{resp.status}</td>
                          <td className="py-2 px-2 font-mono">{resp.etaMinutes} mins</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Responder Briefing & Situation Notes */}
              <div className="border border-slate-300 rounded-2xl p-4 space-y-2 text-xs page-break-inside-avoid">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-slate-200 pb-1.5">
                  4. Executive Situation Briefing & Responder Notes
                </h3>
                <p className="text-slate-900 font-medium whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {responderNote || incident.notes || 'No initial responder notes logged.'}
                </p>
                {incident.resolutionNotes && (
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Resolution & Debrief Summary</span>
                    <p className="text-emerald-900 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 mt-1">
                      {incident.resolutionNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Photographic Evidence Gallery */}
              {localPhotos.length > 0 && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 text-xs page-break-inside-avoid">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-slate-200 pb-1.5">
                    5. Photographic Scene Evidence ({localPhotos.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {localPhotos.map((photo, i) => (
                      <div key={i} className="border border-slate-300 rounded-xl p-2 space-y-1.5 bg-slate-50">
                        <img src={photo.url} alt={photo.caption} className="w-full h-36 object-cover rounded-lg border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-900 text-[11px]">{photo.caption}</div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            Captured by: {photo.uploadedBy} | {new Date(photo.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Tactical Timeline Log Table */}
              <div className="border border-slate-300 rounded-2xl p-4 space-y-3 text-xs page-break-inside-avoid">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-slate-200 pb-1.5">
                  6. Chronological Tactical Event Timeline
                </h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-300">
                      <th className="py-2 px-2 w-12">#</th>
                      <th className="py-2 px-2 w-36">Timestamp</th>
                      <th className="py-2 px-2 w-48">Action / Event</th>
                      <th className="py-2 px-2 w-40">Actor / Officer</th>
                      <th className="py-2 px-2">Detailed Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {incident.timeline.map((ev, index) => (
                      <tr key={ev.id || index} className="text-slate-900">
                        <td className="py-2 px-2 font-mono text-[10px] text-slate-500">{index + 1}</td>
                        <td className="py-2 px-2 font-mono text-[10px] text-slate-700">{ev.timestamp}</td>
                        <td className="py-2 px-2 font-bold text-red-700">{ev.action}</td>
                        <td className="py-2 px-2 text-slate-800 font-semibold">{ev.actor}</td>
                        <td className="py-2 px-2 text-slate-700">{ev.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legal & Administrative Sign-off Section */}
              <div className="border border-slate-400 rounded-2xl p-5 space-y-6 text-xs page-break-inside-avoid bg-slate-50/50 mt-6">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-300 pb-2">
                  7. Legal Verification, Chain of Custody & Administrative Sign-Off
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-6">
                    <div className="border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">
                      [ Signature Line ]
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Lead Responding Officer</div>
                      <div className="text-[10px] text-slate-500">Designation: Tactical Field Responder</div>
                      <div className="text-[10px] text-slate-500 font-mono">Date: ____ / ____ / ________</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">
                      [ Signature Line ]
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Duty Control Room Supervisor</div>
                      <div className="text-[10px] text-slate-500">Designation: Control Room Commander</div>
                      <div className="text-[10px] text-slate-500 font-mono">Date: ____ / ____ / ________</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">
                      [ Signature Line ]
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Security Operations Manager</div>
                      <div className="text-[10px] text-slate-500">Designation: Legal & Audit Compliance</div>
                      <div className="text-[10px] text-slate-500 font-mono">Date: ____ / ____ / ________</div>
                    </div>
                  </div>
                </div>

                {/* Legal Disclaimer Box */}
                <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 space-y-1">
                  <div className="font-bold text-slate-800 uppercase">OFFICIAL LEGAL DISCLAIMER & NOTICE:</div>
                  <p className="leading-relaxed">
                    This document constitutes an official security incident report generated by the Aegis Tactical Operations System. The information, GPS coordinates, timestamps, and photographic evidence contained herein are privileged, strictly confidential, and preserved under cryptographic audit protocol ISO 27001. Unauthorized reproduction or distribution is strictly prohibited.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

