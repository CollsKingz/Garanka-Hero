import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Navigation, Shield, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onAllow,
  onDismiss,
}) => {
  const [requesting, setRequesting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = () => {
    setRequesting(true);
    setErrorMsg(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRequesting(false);
          onAllow();
        },
        (err) => {
          setRequesting(false);
          setErrorMsg(`Location permission denied or unavailable: ${err.message}. You can still use the app, but live GPS tracking will use simulated precinct coordinates.`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setRequesting(false);
      setErrorMsg('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <Navigation className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 mb-1">
              GPS TELEMETRY PERMISSION
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Enable Real-Time Location Tracking
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>Garanka Hero</strong> requires high-accuracy GPS access to stream your live coordinates (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">latitude</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">longitude</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">heading</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">lastUpdated</code>) directly to Firebase for emergency responder dispatch and command map plotting.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Shield className="w-4 h-4 text-red-600" />
              <span>Emergency Panic Integration</span>
            </div>
            <p className="text-slate-500">
              When a panic alert is triggered, high-frequency GPS telemetry streams instantly to the tactical command dashboard.
            </p>
          </div>
          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={requesting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>{requesting ? 'Requesting GPS...' : 'Enable Location Access'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
