import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Loader2,
  AlertTriangle,
  Hospital,
  Siren,
  Search,
} from 'lucide-react';
import { geolocationService } from '../services/geolocationService';
import { GoogleMapsAttribution, GroundingChunk } from './GoogleMapsAttribution';

export const AIEmergencyAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (overridePrompt?: string) => {
    const queryToUse = overridePrompt || prompt || 'Find nearest open police stations, 24/7 hospitals, and emergency trauma centers near me.';
    setLoading(true);
    setErrorMessage(null);

    const coords = geolocationService.getCurrentCoords();

    try {
      const res = await fetch('/api/ai/nearby-emergency-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          prompt: queryToUse,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch AI emergency location recommendations');
      }

      const data = await res.json();
      setAiResponse(data.text);
      setGroundingChunks(data.groundingChunks || []);
    } catch (err: any) {
      console.error('AI Emergency Assistant error:', err);
      setErrorMessage(err.message || 'An error occurred while contacting AI services.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Google Maps Grounded AI Emergency Helper
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                Gemini 3.7
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Locates real-world 24/7 emergency services, police, and hospitals using live geospatial data.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick Action Buttons */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Quick Geospatial Searches:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setPrompt('Where is the nearest open 24-hour police station and SAPS station?');
              handleSearch('Where is the nearest open 24-hour police station and SAPS station?');
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            <Siren className="w-3.5 h-3.5 text-blue-600" />
            Nearest Police Station
          </button>

          <button
            onClick={() => {
              setPrompt('Where is the nearest 24/7 emergency hospital or trauma center?');
              handleSearch('Where is the nearest 24/7 emergency hospital or trauma center?');
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            <Hospital className="w-3.5 h-3.5 text-red-600" />
            Nearest Hospital / ER
          </button>

          <button
            onClick={() => {
              setPrompt('Find nearest fire stations and emergency rescue hubs.');
              handleSearch('Find nearest fire stations and emergency rescue hubs.');
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            Fire & Rescue Hubs
          </button>
        </div>
      </div>

      {/* Custom Query Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Find 24h pharmacy or nearest armed security response office..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Query AI</span>
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* AI Response Box */}
      {aiResponse && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-normal">
            {aiResponse}
          </div>

          {/* Reusable Google Maps Attribution & Grounding Sources */}
          <GoogleMapsAttribution groundingChunks={groundingChunks} />
        </div>
      )}
    </div>
  );
};
