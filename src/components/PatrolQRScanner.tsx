import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  History,
} from 'lucide-react';
import { Checkpoint, PatrolScan, UserProfile, Coordinates } from '../types';
import { soundService } from '../services/soundService';
import { geolocationService } from '../services/geolocationService';

interface PatrolQRScannerProps {
  currentUser: UserProfile;
  checkpoints: Checkpoint[];
  scans: PatrolScan[];
  onNewScan: (scan: Omit<PatrolScan, 'id' | 'timestamp'>) => void;
}

export const PatrolQRScanner: React.FC<PatrolQRScannerProps> = ({
  currentUser,
  checkpoints = [],
  scans = [],
  onNewScan,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentScanResult, setRecentScanResult] = useState<PatrolScan | null>(null);
  const [scanNotes, setScanNotes] = useState<string>('');
  const [currentCoords, setCurrentCoords] = useState<Coordinates>(geolocationService.getCurrentCoords());

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const unsub = geolocationService.subscribe((coords) => {
      setCurrentCoords(coords);
    });
    return () => unsub();
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    soundService.playScanSuccess();

    // Match with checkpoint database
    const matchedCp = checkpoints.find(
      (cp) => cp.code === decodedText || decodedText.includes(cp.code)
    ) || {
      id: 'chk-custom-' + Date.now(),
      name: `Ad-hoc Checkpoint (${decodedText.slice(0, 18)})`,
      zone: 'General Perimeter',
      siteId: currentUser.siteId,
      siteName: currentUser.siteName,
      code: decodedText,
      coordinates: currentCoords,
    };

    const newScan: Omit<PatrolScan, 'id' | 'timestamp'> = {
      checkpointId: matchedCp.id,
      checkpointName: matchedCp.name,
      zone: matchedCp.zone,
      siteId: currentUser.siteId,
      companyId: currentUser.companyId,
      guardId: currentUser.id,
      guardName: currentUser.name,
      coordinates: currentCoords,
      notes: scanNotes || 'Patrol post secure and clear. No anomalies detected.',
      status: 'verified',
    };

    onNewScan(newScan);

    const fullScan: PatrolScan = {
      ...newScan,
      id: 'scan-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setRecentScanResult(fullScan);
    setScanNotes('');

    // Stop camera after successful scan
    if (scannerRef.current && isCameraActive) {
      scannerRef.current.stop().then(() => {
        setIsCameraActive(false);
      }).catch(console.error);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-container');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setCameraError(
        'Camera access was restricted or not available on this device. You can use the instant checkpoint simulators below!'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
        } catch {}
      }
    };
  }, []);

  const handleSimulateScan = (cp: Checkpoint) => {
    handleScanSuccess(cp.code);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Patrol Checkpoint QR Scanner
              </h1>
              <p className="text-xs text-slate-500">
                Logged in as <strong className="text-slate-800">{currentUser.name}</strong> • {currentUser.badgeNumber || 'Officer'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>GPS: {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewport / Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-red-600" />
                <span>Live Optical Viewfinder</span>
              </h3>
              {isCameraActive ? (
                <button
                  id="stop-camera-btn"
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-red-600 text-xs px-3 py-1.5 rounded-xl font-bold border border-slate-200 transition"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              ) : (
                <button
                  id="start-camera-btn"
                  onClick={startCamera}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Activate Camera Scanner</span>
                </button>
              )}
            </div>

            {/* Video Container */}
            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 flex flex-col items-center justify-center p-2">
              <div id="qr-reader-container" className="w-full h-full"></div>

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                    <QrCode className="w-8 h-8 text-red-600 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Camera Viewfinder Idle</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Click &apos;Activate Camera Scanner&apos; to scan real printed QR codes, or use one-tap checkpoint simulators below.
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Open Camera Feed
                  </button>
                </div>
              )}

              {/* Scanning Crosshair Overlay when camera is on */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-red-500 rounded-2xl relative animate-pulse">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-red-500"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-red-500"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-red-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-red-500"></div>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Optional Observation Notes for scan */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Attach Note to Checkpoint Scan (Optional):
              </label>
              <input
                id="checkpoint-notes-input"
                type="text"
                value={scanNotes}
                onChange={(e) => setScanNotes(e.target.value)}
                placeholder="e.g. All perimeter gates locked, zero suspicious activity detected..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Quick Simulation / One-Tap Checkpoint Scans */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-red-600" />
                <span>Quick Checkpoint Simulator (Test Scans)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Tap to log scan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {checkpoints.map((cp) => (
                <button
                  key={cp.id}
                  id={`simulate-scan-${cp.id}`}
                  onClick={() => handleSimulateScan(cp)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-red-50/70 border border-slate-200 hover:border-red-200 text-left transition group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-red-700 truncate">
                      {cp.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{cp.zone}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-red-600 shrink-0 group-hover:bg-red-600 group-hover:text-white transition">
                    <QrCode className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scan History & Recent Verification */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recent Scan Confirmation Banner */}
          {recentScanResult && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-5 shadow-md text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    Checkpoint Verified
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-bold">
                  {new Date(recentScanResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-base font-bold text-slate-900">{recentScanResult.checkpointName}</div>
              <div className="text-xs text-emerald-800">
                Zone: <strong className="text-slate-900">{recentScanResult.zone}</strong>
              </div>
              <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-emerald-200">
                &ldquo;{recentScanResult.notes}&rdquo;
              </div>
            </div>
          )}

          {/* Today's Patrol Checkpoint Checklist */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Patrol Route Coverage</span>
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {checkpoints.length} Target Posts
              </span>
            </div>

            <div className="space-y-2.5">
              {checkpoints.map((cp) => {
                const lastScan = scans.find((s) => s.checkpointId === cp.id);
                return (
                  <div
                    key={cp.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{cp.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{cp.zone}</span>
                        <span>•</span>
                        <span>Window: {cp.requiredTimeWindowMinutes || 30}m</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {lastScan ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Scanned</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Patrol Log Feed */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-red-600" />
              <span>Recent Activity Feed ({scans.length})</span>
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scans.slice(0, 6).map((scan) => (
                <div
                  key={scan.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="font-bold">{scan.checkpointName}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Officer: {scan.guardName}</span>
                    <span className="text-emerald-600 font-semibold">{scan.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
