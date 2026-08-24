import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  AlertOctagon,
  ShieldAlert,
  Radio,
  MapPin,
  CheckCircle2,
  Volume2,
  VolumeX,
  PhoneCall,
  Flame,
  HeartPulse,
  UserX,
  AlertTriangle,
  Send,
  EyeOff,
  Navigation2,
  Clock,
  Wifi,
  WifiOff,
  Home,
  Smartphone,
} from 'lucide-react';
import { Incident, IncidentCategory, UserProfile, Coordinates, HouseUnit } from '../types';
import { soundService } from '../services/soundService';
import { geolocationService } from '../services/geolocationService';
import { AIEmergencyAssistant } from './AIEmergencyAssistant';

interface PanicScreenProps {
  currentUser: UserProfile;
  activeIncident: Incident | null;
  onTriggerPanic: (category: IncidentCategory, notes?: string, isSilent?: boolean) => void;
  onCancelPanic: (incidentId: string, reason: string) => void;
  isOnline: boolean;
  assignedHouse?: HouseUnit;
}

export const PanicScreen: React.FC<PanicScreenProps> = ({
  currentUser,
  activeIncident,
  onTriggerPanic,
  onCancelPanic,
  isOnline,
  assignedHouse,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory>('PANIC_GENERAL');
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [requireHold, setRequireHold] = useState<boolean>(true);
  const [isSilent, setIsSilent] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<Coordinates>(geolocationService.getCurrentCoords());
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Accidental trigger / All clear');
  const [isStealthMode, setIsStealthMode] = useState<boolean>(false);

  const holdTimerRef = useRef<any>(null);

  // Subscribe to live GPS coordinates
  useEffect(() => {
    const unsubscribe = geolocationService.subscribe((coords) => {
      setCurrentLocation(coords);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTrigger = useCallback(() => {
    if (!isSilent) {
      soundService.playPanicTrigger();
      soundService.startSiren();
    }
    onTriggerPanic(selectedCategory, userNotes, isSilent);
  }, [isSilent, onTriggerPanic, selectedCategory, userNotes]);

  // Handle hold-to-confirm timer
  useEffect(() => {
    if (isHolding && requireHold && !activeIncident) {
      const startTime = Date.now();
      const duration = 1800; // 1.8 seconds hold

      holdTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        setHoldProgress(progress);

        if (progress >= 100) {
          clearInterval(holdTimerRef.current);
          setIsHolding(false);
          setHoldProgress(0);
          handleTrigger();
        }
      }, 30);
    } else {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
      setHoldProgress(0);
    }

    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [isHolding, requireHold, activeIncident, handleTrigger]);


  const handleImmediateClick = () => {
    if (!requireHold && !activeIncident) {
      handleTrigger();
    }
  };

  const categories: { id: IncidentCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: 'PANIC_GENERAL',
      label: 'General Emergency',
      icon: <ShieldAlert className="w-5 h-5" />,
    },
    {
      id: 'ARMED_ROBBERY',
      label: 'Armed Intrusion / Threat',
      icon: <AlertOctagon className="w-5 h-5" />,
    },
    {
      id: 'MEDICAL_EMERGENCY',
      label: 'Medical Distress',
      icon: <HeartPulse className="w-5 h-5" />,
    },
    {
      id: 'FIRE_HAZARD',
      label: 'Fire / Smoke Hazard',
      icon: <Flame className="w-5 h-5" />,
    },
    {
      id: 'ASSAULT',
      label: 'Assault / GBV Help',
      icon: <UserX className="w-5 h-5" />,
    },
    {
      id: 'SUSPICIOUS_PERSON',
      label: 'Suspicious Activity',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  if (isStealthMode && activeIncident) {
    return (
      <div
        id="stealth-mode-overlay"
        onClick={() => setIsStealthMode(false)}
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 cursor-pointer select-none text-slate-800"
      >
        <div className="text-[11px] font-mono">08:42 | Battery 89%</div>
        <div className="text-center">
          <div className="w-2.5 h-2.5 rounded-full bg-red-900 animate-pulse mx-auto mb-2"></div>
          <div className="text-xs text-slate-700 font-semibold">Stealth Emergency Tracing Active (Tap to return)</div>
        </div>
        <div className="text-[10px] text-slate-800 font-mono">AegisSec Background Tracking</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Network Status Banner */}
      {!isOnline && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-300 px-4 py-3 rounded-2xl text-amber-900 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-amber-600 animate-pulse" />
            <div>
              <span className="font-bold">Offline Emergency Mode:</span> Alarms will dispatch via SMS/Cellular fallback and sync immediately.
            </div>
          </div>
          <span className="bg-amber-200 text-amber-900 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
            QUEUED
          </span>
        </div>
      )}

      {/* Main Red & White Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden">
        {/* Background ambient glow if active */}
        {activeIncident && (
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-100 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        )}

        {/* Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-red-600 ring-4 ring-red-100"></span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Emergency Panic Trigger
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Direct high-priority alert to {currentUser.siteName} Tactical Command Center
            </p>
          </div>

          {/* GPS Live Pill */}
          <div className="flex items-center gap-3 bg-red-50/70 border border-red-200 px-3.5 py-2 rounded-2xl">
            <div className="relative">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 block absolute inset-0 animate-ping"></span>
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Live GPS Tracing</div>
              <div className="text-xs font-mono text-slate-900 font-bold">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)} (±{currentLocation.accuracy || 5}m)
              </div>
            </div>
          </div>
        </div>

        {/* Resident House & Device Status Card */}
        {assignedHouse && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-red-600" />
              <div>
                <span className="font-bold text-slate-900">Assigned Residence: </span>
                <span className="text-slate-700">{assignedHouse.houseNumber} ({assignedHouse.streetAddress})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-slate-600">
                {assignedHouse.registeredDevices?.length || 1} / 2 Devices Registered
              </span>
            </div>
          </div>
        )}

        {/* IF AN INCIDENT IS ACTIVE */}
        {activeIncident ? (
          <div className="py-6 space-y-6">
            <div className="bg-red-600 text-white rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl shadow-red-600/30">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white font-extrabold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-4 border border-white/30 animate-pulse">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>EMERGENCY DISPATCH IN PROGRESS • CODE {activeIncident.code}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeIncident.title}
              </h2>
              <p className="text-red-100 max-w-lg mx-auto text-xs sm:text-sm mt-2">
                Your coordinates and phone tracking have been locked onto by the Sandton Operations Control Room. Responders have been mobilized.
              </p>

              {/* Responder Status Cards */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                {activeIncident.assignedResponders.length > 0 ? (
                  activeIncident.assignedResponders.map((resp, idx) => (
                    <div
                      key={idx}
                      className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-4 flex items-center gap-3.5 text-white"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Navigation2 className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm truncate">{resp.name}</span>
                          <span className="bg-white/20 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                            {resp.callSign}
                          </span>
                        </div>
                        <div className="text-xs text-red-100 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-white" />
                          <span>Estimated ETA: <strong className="text-white font-bold">{resp.etaMinutes} mins</strong></span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 bg-white/15 border border-white/20 rounded-2xl p-4 text-center text-white text-xs">
                    <AlertTriangle className="w-5 h-5 text-white mx-auto mb-1 animate-bounce" />
                    <span>Control room acknowledged. Assigning nearest patrol guard right now...</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  id="stealth-mode-btn"
                  onClick={() => setIsStealthMode(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Blackout / Stealth Screen</span>
                </button>

                <button
                  id="toggle-siren-btn"
                  onClick={() => soundService.toggleMute()}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition"
                >
                  {soundService.getMuted() ? (
                    <>
                      <VolumeX className="w-4 h-4 text-red-200" />
                      <span>Siren Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-white" />
                      <span>Siren Active</span>
                    </>
                  )}
                </button>

                <button
                  id="cancel-panic-btn"
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-2 bg-white hover:bg-slate-100 text-red-600 font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I am Safe / Cancel Alarm</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* REGULAR TRIGGER MODE */
          <div className="py-6 space-y-8">
            {/* Category Selector Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                1. Select Emergency Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      id={`cat-select-${cat.id}`}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-50/80 text-red-950 shadow-sm ring-1 ring-red-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl border shrink-0 ${
                          isSelected ? 'bg-red-600 text-white border-red-600' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {cat.icon}
                      </div>
                      <div className="text-xs font-bold leading-snug">{cat.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VERY LARGE RED PRIMARY PANIC BUTTON */}
            <div className="flex flex-col items-center justify-center py-6 select-none">
              <div className="relative flex items-center justify-center">
                {/* Pulsing Ripple Rings */}
                <div className="absolute w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-red-500/15 animate-ping pointer-events-none"></div>
                <div className="absolute w-64 h-64 sm:w-76 sm:h-76 rounded-full bg-red-500/20 blur-xl pointer-events-none"></div>

                {/* SVG Radial Progress Ring if Hold Mode is Active */}
                {requireHold && (
                  <svg className="absolute w-64 h-64 sm:w-76 sm:h-76 -rotate-90 pointer-events-none z-20">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="126"
                      className="stroke-red-100"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="126"
                      className="stroke-red-600 transition-all"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={791}
                      strokeDashoffset={791 - (791 * holdProgress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* The Big Red Button */}
                <motion.button
                  id="main-panic-trigger-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseDown={() => requireHold && setIsHolding(true)}
                  onMouseUp={() => requireHold && setIsHolding(false)}
                  onMouseLeave={() => requireHold && setIsHolding(false)}
                  onTouchStart={() => requireHold && setIsHolding(true)}
                  onTouchEnd={() => requireHold && setIsHolding(false)}
                  onClick={handleImmediateClick}
                  className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white shadow-2xl shadow-red-600/50 border-4 border-white flex flex-col items-center justify-center p-4 cursor-pointer transition-all focus:outline-none ring-4 ring-red-600/30"
                >
                  <AlertOctagon className="w-16 h-16 sm:w-20 sm:h-20 text-white drop-shadow mb-2 animate-bounce" />
                  <span className="text-2xl sm:text-3xl font-black tracking-wider uppercase drop-shadow">
                    PANIC
                  </span>
                  <span className="text-[11px] font-bold text-red-100 uppercase tracking-widest mt-1">
                    {requireHold ? (isHolding ? `HOLDING (${Math.round(holdProgress)}%)` : 'HOLD TO CONFIRM') : 'TAP TO TRIGGER'}
                  </span>
                </motion.button>
              </div>

              {/* Safety trigger settings switches */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    id="require-hold-checkbox"
                    checked={requireHold}
                    onChange={(e) => setRequireHold(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <span>Hold to confirm (Prevents accidental triggers)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    id="silent-alarm-checkbox"
                    checked={isSilent}
                    onChange={(e) => setIsSilent(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <span className="text-red-700 font-semibold">Silent Alarm Mode (No loud siren)</span>
                </label>
              </div>
            </div>

            {/* Quick Emergency Note Input */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Situation Details (Optional, e.g., floor number or suspect details):
              </label>
              <input
                id="panic-notes-input"
                type="text"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g. Unit 14 backyard patio, suspect wearing black jacket..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        )}

        {/* Speed-Dial Emergency Numbers */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Direct Emergency Numbers
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href="tel:10111"
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 p-3 rounded-2xl text-xs font-semibold text-slate-800 transition"
            >
              <PhoneCall className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Police / SAPS</div>
                <div className="font-mono text-slate-900 font-bold">10111</div>
              </div>
            </a>
            <a
              href="tel:10177"
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 p-3 rounded-2xl text-xs font-semibold text-slate-800 transition"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Ambulance</div>
                <div className="font-mono text-slate-900 font-bold">10177</div>
              </div>
            </a>
            <a
              href="tel:112"
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 p-3 rounded-2xl text-xs font-semibold text-slate-800 transition"
            >
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Emergency 112</div>
                <div className="font-mono text-slate-900 font-bold">112</div>
              </div>
            </a>
            <a
              href="tel:+27119003000"
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 p-3 rounded-2xl text-xs font-semibold text-slate-800 transition"
            >
              <PhoneCall className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Control Room</div>
                <div className="font-mono text-slate-900 font-bold">011 900 3000</div>
              </div>
            </a>
          </div>
        </div>

        {/* Google Maps Grounded AI Emergency Location Assistant */}
        <div className="mt-8">
          <AIEmergencyAssistant />
        </div>
      </div>

      {/* Cancel Panic Modal */}
      {showCancelModal && activeIncident && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Cancel Emergency Alarm</h3>
            </div>
            <p className="text-xs text-slate-600">
              Please specify the reason for cancelling incident <strong>{activeIncident.code}</strong>. The security command center will record this for safety audit trails.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Cancellation:</label>
              <select
                id="cancel-reason-select"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="Accidental trigger / User error">Accidental trigger / User error</option>
                <option value="Situation resolved peacefully">Situation resolved peacefully</option>
                <option value="Assistance arrived / False alarm">Assistance arrived / False alarm</option>
                <option value="Test trigger by authorized personnel">Test trigger by authorized personnel</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
              >
                Keep Alarm Active
              </button>
              <button
                id="confirm-cancel-panic-btn"
                onClick={() => {
                  soundService.stopSiren();
                  onCancelPanic(activeIncident.id, cancelReason);
                  setShowCancelModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
