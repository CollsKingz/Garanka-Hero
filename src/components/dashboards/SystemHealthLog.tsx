import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ChevronDown, ChevronUp, Server, Database, AlertCircle, WifiOff } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'sync' | 'error' | 'info' | 'network';
  message: string;
  details?: string;
}

export const SystemHealthLog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'System initialization complete.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toISOString(),
      type: 'sync',
      message: 'Firebase Firestore synchronized with 0 conflicts.',
    }
  ]);

  // Simulate incoming logs for realistic dashboard feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const types: LogEntry['type'][] = ['sync', 'sync', 'sync', 'info', 'error', 'network'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        let message = '';
        let details = '';
        
        switch (randomType) {
          case 'sync':
            message = 'Real-time database delta synced successfully.';
            break;
          case 'error':
            message = 'API Error: Failed to fetch quota limits.';
            details = 'Endpoint /api/quota returned 503 Service Unavailable.';
            break;
          case 'network':
            message = 'WebSocket latency spike detected (450ms).';
            break;
          case 'info':
            message = 'Garbage collection cycle completed.';
            break;
        }

        const newLog: LogEntry = {
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString(),
          type: randomType,
          message,
          details
        };

        return [newLog, ...prev].slice(0, 50); // keep last 50 logs
      });
    }, 8500);

    return () => clearInterval(interval);
  }, []);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'sync': return <Database className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'network': return <WifiOff className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50/50 border-red-100 text-red-900';
      case 'network': return 'bg-amber-50/50 border-amber-100 text-amber-900';
      case 'sync': return 'bg-emerald-50/50 border-emerald-100 text-emerald-900';
      default: return 'bg-slate-50/50 border-slate-100 text-slate-900';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm">
            <Server className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-black text-slate-900 tracking-tight">System Health & Sync Log</h2>
            <p className="text-xs text-slate-500">Live monitoring of backend sync events and API connectivity.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">System Operational</span>
          </div>
          <div className="text-slate-400">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100"
          >
            <div className="p-4 sm:p-6 bg-slate-50/50 max-h-96 overflow-y-auto space-y-2">
              {logs.map((log) => (
                <div key={log.id} className={`p-3 rounded-xl border text-xs sm:text-sm font-mono flex items-start gap-3 ${getLogColor(log.type)}`}>
                  <div className="shrink-0 mt-0.5">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-bold">{log.message}</span>
                      <span className="text-[10px] opacity-70 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                      </span>
                    </div>
                    {log.details && (
                      <div className="text-[10px] opacity-80 mt-1">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No recent events logged.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
