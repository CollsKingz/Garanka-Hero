import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  PhoneOff,
  Maximize2,
  Users,
  Signal,
  ShieldAlert,
} from 'lucide-react';
import { voiceRoomService, VoiceRoomState } from '../../services/voiceRoomService';
import { UserProfile } from '../../types';

interface TacticalVoiceDockProps {
  currentUser: UserProfile;
  onExpandVoiceRoom: () => void;
}

export const TacticalVoiceDock: React.FC<TacticalVoiceDockProps> = ({
  currentUser,
  onExpandVoiceRoom,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceRoomState>(voiceRoomService.getState());

  useEffect(() => {
    const unsubscribe = voiceRoomService.subscribe((state) => {
      setVoiceState(state);
    });
    return () => unsubscribe();
  }, []);

  if (!voiceState.isConnected || !voiceState.incidentId) {
    return null;
  }

  const activeSpeaker = voiceState.participants.find((p) => p.isSpeaking);

  return (
    <div
      id="tactical-voice-dock"
      className="fixed bottom-4 right-4 z-40 max-w-md w-[calc(100%-2rem)] sm:w-auto"
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        className="bg-slate-900/95 backdrop-blur-md text-white border-2 border-red-600 rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-red-900/30 flex items-center justify-between gap-3"
      >
        {/* Left Channel Indicator & Speaking Pulse */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                activeSpeaker ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <Radio className={`w-4 h-4 ${activeSpeaker ? 'animate-pulse' : ''}`} />
            </div>
            {activeSpeaker && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping"></span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-800">
                {voiceState.incidentCode}
              </span>
              <span className="text-xs font-bold text-white truncate">Tactical Intercom</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate mt-0.5 flex items-center gap-1.5">
              {activeSpeaker ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold text-emerald-400 truncate">
                    {activeSpeaker.name} ({activeSpeaker.callSign || 'STAFF'}) speaking...
                  </span>
                </>
              ) : (
                <span className="text-slate-400">
                  {voiceState.participants.length} Active Staff Connected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center & Right Quick Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Mic Mute Toggle */}
          <button
            id="dock-mic-toggle-btn"
            onClick={() => voiceRoomService.toggleMute()}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center ${
              voiceState.isMuted
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
            }`}
            title={voiceState.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {voiceState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Quick Expand Modal Button */}
          <button
            id="dock-expand-btn"
            onClick={onExpandVoiceRoom}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Expand Voice Room Interface"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Quick Leave Button */}
          <button
            id="dock-disconnect-btn"
            onClick={() => voiceRoomService.leaveIncidentVoiceRoom()}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition"
            title="Disconnect from Voice Channel"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
