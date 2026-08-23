import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  PhoneOff,
  Users,
  Shield,
  ShieldAlert,
  UserPlus,
  Minimize2,
  Bell,
  Sparkles,
  Signal,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Incident, UserProfile, UserRole } from '../../types';
import { voiceRoomService, VoiceRoomState } from '../../services/voiceRoomService';

interface IncidentVoiceRoomModalProps {
  incident: Incident;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onAddRosterMember?: (incidentId: string, member: { name: string; role: UserRole; email: string; callSign: string }) => void;
}

export const IncidentVoiceRoomModal: React.FC<IncidentVoiceRoomModalProps> = ({
  incident,
  currentUser,
  isOpen,
  onClose,
  onMinimize,
  onAddRosterMember,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceRoomState>(voiceRoomService.getState());
  const [showAddStaff, setShowAddStaff] = useState<boolean>(false);
  const [staffRole, setStaffRole] = useState<UserRole>('guard');
  const [staffName, setStaffName] = useState<string>('Officer Thabo Molefe');
  const [staffCallSign, setStaffCallSign] = useState<string>('Bravo-2');

  useEffect(() => {
    const unsubscribe = voiceRoomService.subscribe((state) => {
      setVoiceState(state);
    });
    return () => unsubscribe();
  }, []);

  // Keyboard spacebar listener for Push-To-Talk
  useEffect(() => {
    if (!isOpen || !voiceState.isConnected || !voiceState.isPttMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target as HTMLElement)?.matches('input, textarea')) {
        e.preventDefault();
        voiceRoomService.setPttPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target as HTMLElement)?.matches('input, textarea')) {
        e.preventDefault();
        voiceRoomService.setPttPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, voiceState.isConnected, voiceState.isPttMode]);

  if (!isOpen) return null;

  // Role Permissions Check:
  // Community member is NOT authorized to join tactical voice room
  const isCommunity = currentUser.role === 'community';
  const isHeadOffice = currentUser.role === 'headoffice';
  const isSupervisor = currentUser.role === 'supervisor';
  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';

  const canManageRoster = isSupervisor || isAdmin || isHeadOffice;

  const handleToggleConnect = async () => {
    if (voiceState.isConnected) {
      voiceRoomService.leaveIncidentVoiceRoom();
    } else {
      await voiceRoomService.joinIncidentVoiceRoom(
        incident.id,
        incident.code,
        currentUser,
        incident.assignedResponders || []
      );
    }
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName) return;

    voiceRoomService.addParticipantToRoster({
      userId: 'staff-' + Date.now(),
      name: staffName,
      role: staffRole,
      callSign: staffCallSign,
    });

    if (onAddRosterMember) {
      onAddRosterMember(incident.id, {
        name: staffName,
        role: staffRole,
        email: `${staffName.toLowerCase().replace(/\s+/g, '.')}@aegissec.co.za`,
        callSign: staffCallSign,
      });
    }

    setShowAddStaff(false);
  };

  return (
    <div
      id="incident-voice-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-red-600 text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/30">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Tactical Voice Room
                </span>
                <span className="text-red-100 text-xs font-mono font-bold">
                  Code: {incident.code}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {incident.title}
              </h2>
              <p className="text-red-100 text-xs mt-0.5 flex items-center gap-2">
                <span>Site: {incident.siteName}</span>
                <span>•</span>
                <span>Room: One Encrypted Channel per Incident</span>
              </p>
            </div>

            {/* Action Header Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="voice-modal-minimize-btn"
                onClick={onMinimize}
                title="Dock Voice Room to Bottom Bar"
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition text-xs flex items-center gap-1 border border-white/20 cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Dock Comms</span>
              </button>

              <button
                id="voice-modal-close-btn"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Authorization & RBAC Status Banner */}
          {isCommunity ? (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-amber-950">
                  Tactical Staff Intercom Restricted
                </strong>
                <span>
                  Voice channel is reserved strictly for security response personnel, supervisors, and head office command.
                  Your emergency beacon is actively tracked by the control room.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold text-slate-900">
                  {isHeadOffice
                    ? '★ Head Office Command Override (Authorized on all incidents)'
                    : isSupervisor
                    ? '🎯 Security Supervisor (Roster & Dispatch Controller)'
                    : isManager
                    ? '📊 Security Manager (Tactical Command Oversight)'
                    : isAdmin
                    ? '⚙️ Security Admin (System Monitor & Audit)'
                    : '🛡️ Incident Responder (Assigned Field Roster)'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <Signal className="w-3.5 h-3.5 text-emerald-600" />
                <span>{voiceState.latencyMs}ms Latency • {voiceState.audioQuality}</span>
              </div>
            </div>
          )}

          {/* Connection Status & Live Audio Spectrum Visualizer */}
          {!isCommunity && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Channel Audio State
                  </div>
                  <div className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>
                      {voiceState.isConnected
                        ? voiceState.isSpeaking
                          ? '🎙️ Broadcasting (Microphone Active)'
                          : voiceState.isMuted
                          ? '🔇 Microphone Muted (Listening)'
                          : '👂 Connected & Listening'
                        : 'Channel Disconnected'}
                    </span>
                  </div>
                </div>

                {/* Primary Connect / Leave Toggle Button */}
                <button
                  id="toggle-voice-connection-btn"
                  onClick={handleToggleConnect}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                    voiceState.isConnected
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {voiceState.isConnected ? (
                    <>
                      <PhoneOff className="w-4 h-4" />
                      <span>Leave Voice Room</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      <span>Join Voice Channel</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic 18-Bar Live Waveform Visualizer */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-center gap-1.5 h-20">
                {Array.from({ length: 24 }).map((_, idx) => {
                  // If user is speaking or someone is speaking, animate bars
                  const isActive = voiceState.isConnected && (voiceState.isSpeaking || voiceState.participants.some(p => p.isSpeaking));
                  const baseHeight = isActive ? Math.max(12, Math.sin(idx * 0.4 + Date.now() * 0.005) * 45 + voiceState.localVolume * 0.5) : 6;
                  
                  return (
                    <motion.div
                      key={idx}
                      animate={{ height: `${baseHeight}px` }}
                      transition={{ duration: 0.08 }}
                      className={`w-1.5 rounded-full transition-colors ${
                        voiceState.isSpeaking
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                          : isActive
                          ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                          : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Voice Input Mode (Hands-Free vs Push-to-Talk) */}
              {voiceState.isConnected && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Mode:</span>
                    <button
                      id="toggle-ptt-mode-btn"
                      onClick={() => voiceRoomService.togglePttMode()}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                        voiceState.isPttMode
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {voiceState.isPttMode ? '⚡ Push-To-Talk (Hold Space)' : '🎙️ Hands-Free Voice'}
                    </button>
                  </div>

                  {/* Priority Alert Tone Button (for Supervisor / Head Office) */}
                  {canManageRoster && (
                    <button
                      id="priority-chime-btn"
                      onClick={() => voiceRoomService.playPriorityChime()}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-red-950/50 hover:bg-red-900/50 border border-red-800 px-3 py-1 rounded-lg transition"
                    >
                      <Bell className="w-3.5 h-3.5 text-red-400" />
                      <span>Sound Priority Alert Chime</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active Participants & Incident Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Incident Roster & Voice Participants ({voiceState.participants.length})
                </h3>
              </div>

              {canManageRoster && !isCommunity && (
                <button
                  id="add-roster-member-btn"
                  onClick={() => setShowAddStaff(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Staff to Roster</span>
                </button>
              )}
            </div>

            {/* Modal to add staff to roster */}
            <AnimatePresence>
              {showAddStaff && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddStaffSubmit}
                  className="bg-red-50/70 border border-red-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="font-bold text-xs text-red-900 flex items-center justify-between">
                    <span>Dispatch Additional Staff Member to Voice Channel</span>
                    <button
                      type="button"
                      onClick={() => setShowAddStaff(false)}
                      className="text-red-600 hover:text-red-900"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Staff Full Name"
                      className="bg-white border border-red-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      required
                    />

                    <input
                      type="text"
                      value={staffCallSign}
                      onChange={(e) => setStaffCallSign(e.target.value)}
                      placeholder="Call Sign (e.g. Bravo-2)"
                      className="bg-white border border-red-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                      required
                    />

                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as UserRole)}
                      className="bg-white border border-red-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
                    >
                      <option value="guard">Patrol Guard</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="manager">Security Manager</option>
                      <option value="admin">Security Admin</option>
                      <option value="headoffice">Head Office Executive</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStaff(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                    >
                      Add & Notify Staff
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Participants Roster List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {voiceState.participants.map((participant) => {
                const isMe = participant.userId === currentUser.id;
                return (
                  <div
                    key={participant.userId}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      participant.isSpeaking
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : participant.isMuted
                        ? 'border-slate-200 bg-slate-50/70'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar with speaking ring */}
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                            participant.role === 'headoffice'
                              ? 'bg-amber-600 text-white'
                              : participant.role === 'supervisor'
                              ? 'bg-red-600 text-white'
                              : participant.role === 'manager'
                              ? 'bg-indigo-600 text-white'
                              : participant.role === 'admin'
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          {participant.role === 'headoffice'
                            ? '🏛️'
                            : participant.role === 'supervisor'
                            ? '🎯'
                            : participant.role === 'manager'
                            ? '📊'
                            : participant.role === 'admin'
                            ? '⚙️'
                            : '🛡️'}
                        </div>

                        {/* Speaking Pulse Indicator */}
                        {participant.isSpeaking && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{participant.name}</span>
                          {isMe && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-slate-700">{participant.callSign || 'STAFF'}</span>
                          <span>•</span>
                          <span>{participant.joinedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Audio Status Icon */}
                    <div className="flex items-center gap-1.5">
                      {participant.isSpeaking ? (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Volume2 className="w-3 h-3 animate-bounce" />
                          Speaking
                        </span>
                      ) : participant.isMuted ? (
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MicOff className="w-3 h-3 text-slate-500" />
                          Muted
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Mic className="w-3 h-3 text-emerald-600" />
                          Listening
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Controls */}
        {!isCommunity && voiceState.isConnected && (
          <div className="bg-slate-100 border-t border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left Microphone Mute / Unmute & Deafen */}
            <div className="flex items-center gap-2">
              <button
                id="voice-mute-toggle-btn"
                onClick={() => voiceRoomService.toggleMute()}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer ${
                  voiceState.isMuted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                }`}
              >
                {voiceState.isMuted ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Unmute Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>Mute Mic</span>
                  </>
                )}
              </button>

              <button
                id="voice-deafen-toggle-btn"
                onClick={() => voiceRoomService.toggleDeafen()}
                className={`p-2.5 rounded-2xl text-xs font-bold border transition ${
                  voiceState.isDeafened
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Deafen Room Audio"
              >
                {voiceState.isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Center: Push-To-Talk Action Button (if PTT active) */}
            {voiceState.isPttMode && (
              <button
                id="voice-ptt-button"
                onMouseDown={() => voiceRoomService.setPttPressed(true)}
                onMouseUp={() => voiceRoomService.setPttPressed(false)}
                onTouchStart={() => voiceRoomService.setPttPressed(true)}
                onTouchEnd={() => voiceRoomService.setPttPressed(false)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all select-none shadow-md ${
                  voiceState.isPttPressed
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 scale-95'
                    : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                }`}
              >
                {voiceState.isPttPressed ? '📡 Transmitting Audio...' : 'Hold to Speak (PTT)'}
              </button>
            )}

            {/* Right: Dock & Done */}
            <div className="flex items-center gap-2">
              <button
                id="voice-dock-btn"
                onClick={onMinimize}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-sm transition"
              >
                Dock & Keep Audio Connected
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
