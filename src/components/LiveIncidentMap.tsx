import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident, Coordinates, Checkpoint, UserProfile } from '../types';
import { Shield, Navigation, AlertTriangle, Layers, Crosshair, Radio, ExternalLink } from 'lucide-react';

interface LiveIncidentMapProps {
  incidents: Incident[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
  checkpoints?: Checkpoint[];
  currentGuardCoords?: Coordinates;
  heightClass?: string;
  showAllCheckpoints?: boolean;
  users?: UserProfile[];
  activePanic?: { panic: boolean; room: string; timestamp?: number; reporter?: string } | null;
}

export const LiveIncidentMap: React.FC<LiveIncidentMapProps> = ({
  incidents = [],
  selectedIncidentId,
  onSelectIncident,
  checkpoints = [],
  currentGuardCoords,
  heightClass = 'h-[500px]',
  showAllCheckpoints = true,
  users = [],
  activePanic = null,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapTileStyle, setMapTileStyle] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [tileLayer, setTileLayer] = useState<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center (Sandton / selected incident)
    const initialLat = -26.1076;
    const initialLng = 28.0567;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20,
      }
    ).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setTileLayer(initialLayer);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayer) return;

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO';

    if (mapTileStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye';
    } else if (mapTileStyle === 'street') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    tileLayer.setUrl(url);
  }, [mapTileStyle, tileLayer]);

  // Update Markers & Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;

    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    // 1. Render Checkpoints
    if (showAllCheckpoints && checkpoints) {
      checkpoints.forEach((cp) => {
        const cpIcon = L.divIcon({
          className: 'custom-cp-marker',
          html: `
            <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 border-2 border-emerald-500 text-emerald-400 shadow-lg text-[10px] font-bold">
              QR
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], { icon: cpIcon })
          .bindPopup(`
            <div class="text-slate-900 font-sans min-w-[180px] ">
              <div class="p-3 bg-slate-50 border-b border-slate-100 rounded-t-lg">
                <strong class="text-sm font-black text-slate-900 block">${cp.name}</strong>
                <div class="text-emerald-600 font-bold text-[10px] uppercase tracking-wide mt-0.5">Zone: ${cp.zone}</div>
              </div>
              <div class="p-3 space-y-1.5">
                <div class="text-xs text-slate-600 flex items-center gap-2">
                  <span class="font-bold">Code:</span> 
                  <code class="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700 shadow-sm">${cp.code}</code>
                </div>
                <div class="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${cp.lastScannedBy ? `Scanned by <strong class="text-slate-700">${cp.lastScannedBy}</strong>` : 'Never scanned'}
                </div>
              </div>
            </div>
          `);
        markersLayer.addLayer(marker);
      });
    }

    // 2. Render Incidents
    incidents.forEach((inc) => {
      const isSelected = selectedIncidentId === inc.id;
      const isCritical = inc.severity === 'critical' || inc.status === 'triggered';
      const isResolved = inc.status === 'resolved';

      bounds.push([inc.coordinates.lat, inc.coordinates.lng]);

      const pinColor = isResolved ? '#10b981' : isCritical ? '#ef4444' : '#f59e0b';
      const pulseHtml = !isResolved ? `<div class="absolute -inset-3 rounded-full animate-ping opacity-40" style="background-color: ${pinColor}"></div><div class="absolute -inset-1 rounded-full animate-pulse opacity-60" style="background-color: ${pinColor}"></div>` : '';

      const incidentIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            ${pulseHtml}
            <div class="relative z-10 flex items-center justify-center w-9 h-9 rounded-full text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isSelected ? 'ring-4 ring-white scale-110' : 'border-2 border-white/80'} transition-transform duration-300" style="background-color: ${pinColor}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: incidentIcon });
      
      marker.on('click', () => {
        if (onSelectIncident) onSelectIncident(inc.id);
      });

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${inc.coordinates.lat},${inc.coordinates.lng}`;

      marker.bindPopup(`
        <div class="text-slate-900 font-sans min-w-[240px] ">
          <div class="p-3 bg-slate-50 border-b border-slate-100 rounded-t-lg flex items-center justify-between gap-3">
            <span class="font-mono text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">${inc.code}</span>
            <span class="uppercase text-[9px] font-black px-2 py-0.5 rounded-md text-white tracking-wider shadow-sm ${pinColor === '#ef4444' ? 'bg-red-500' : 'bg-amber-500'}">${inc.status}</span>
          </div>
          <div class="p-3 space-y-2">
            <div class="font-black text-slate-900 text-sm leading-tight">${inc.title}</div>
            <div class="text-xs text-slate-600 flex items-start gap-1.5">
              <span class="opacity-70 mt-0.5">👤</span>
              <div>
                <strong class="text-slate-800 block">${inc.reporterName}</strong>
                <span class="text-[10px] text-slate-500">${inc.reporterPhone}</span>
              </div>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-2">
              <span class="text-rose-500">📍</span> ${inc.coordinates.lat.toFixed(5)}, ${inc.coordinates.lng.toFixed(5)}
            </div>
            <div class="pt-2">
              <a href="${googleMapsUrl}" target="_blank" rel="noreferrer" class="flex items-center justify-center gap-1.5 w-full bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95">
                <span>Open in Maps</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        </div>
      `);

      markersLayer.addLayer(marker);

      // Breadcrumb phone tracing history
      if (inc.tracingHistory && inc.tracingHistory.length > 1) {
        const polylinePoints: [number, number][] = inc.tracingHistory.map((pt) => [pt.lat, pt.lng]);
        polylinePoints.push([inc.coordinates.lat, inc.coordinates.lng]);

        const traceGlow = L.polyline(polylinePoints, {
          color: '#f43f5e',
          weight: 6,
          opacity: 0.2,
        });
        routeLayer.addLayer(traceGlow);

        const traceLine = L.polyline(polylinePoints, {
          color: '#f43f5e',
          weight: 2,
          opacity: 1,
          dashArray: '4, 6',
        });
        routeLayer.addLayer(traceLine);

        // Accuracy Circle
        if (inc.coordinates.accuracy) {
          const accCircle = L.circle([inc.coordinates.lat, inc.coordinates.lng], {
            radius: Math.max(inc.coordinates.accuracy, 15),
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.15,
            weight: 1,
          });
          routeLayer.addLayer(accCircle);
        }
      }

      // Render Responders & Navigation Vector lines
      if (inc.assignedResponders && inc.assignedResponders.length > 0) {
        inc.assignedResponders.forEach((resp) => {
          bounds.push([resp.currentCoords.lat, resp.currentCoords.lng]);

          const responderIcon = L.divIcon({
            className: 'custom-responder-marker',
            html: `
              <div class="flex flex-col items-center">
                <div class="bg-slate-900 border border-slate-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-lg shadow-lg whitespace-nowrap mb-1">
                  ${resp.callSign} <span class="text-blue-400 ml-1">${resp.etaMinutes}m</span>
                </div>
                <div class="relative w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] border-2 border-white/90">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [80, 56],
            iconAnchor: [40, 56],
          });

          const respMarker = L.marker([resp.currentCoords.lat, resp.currentCoords.lng], { icon: responderIcon })
            .bindPopup(`
              <div class="text-slate-900 font-sans min-w-[200px] ">
                <div class="p-3 bg-slate-50 border-b border-slate-100 rounded-t-lg">
                  <strong class="text-sm font-black text-slate-900">${resp.name}</strong>
                  <div class="text-blue-600 font-mono font-bold text-[10px] mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">${resp.callSign}</div>
                </div>
                <div class="p-3 space-y-1.5">
                  <div class="text-xs font-bold flex items-center gap-1.5 ${resp.status === 'en_route' ? 'text-amber-600' : 'text-emerald-600'}">
                    <span class="relative flex h-2 w-2">
                      ${resp.status === 'en_route' ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>' : ''}
                      <span class="relative inline-flex rounded-full h-2 w-2 ${resp.status === 'en_route' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                    </span>
                    ${resp.status === 'en_route' ? 'En Route (ETA: ' + resp.etaMinutes + ' min)' : 'On Scene'}
                  </div>
                </div>
              </div>
            `);

          markersLayer.addLayer(respMarker);

          // Route Line between Responder and Incident
          const routePoints = [
            [resp.currentCoords.lat, resp.currentCoords.lng],
            [inc.coordinates.lat, inc.coordinates.lng],
          ] as [number, number][];

          const routeGlow = L.polyline(routePoints, {
            color: '#3b82f6',
            weight: 6,
            opacity: 0.2,
          });
          routeLayer.addLayer(routeGlow);

          const routeLine = L.polyline(routePoints, {
            color: '#3b82f6',
            weight: 2,
            opacity: 1,
            dashArray: '4, 6',
          });
          routeLayer.addLayer(routeLine);
        });
      }
    });

    // 3. Render Active Members and Guards with Live Firebase Coordinates
    if (users && users.length > 0) {
      users.forEach((u) => {
        if (u.location && u.location.lat && u.location.lng) {
          bounds.push([u.location.lat, u.location.lng]);

          const isPanic = activePanic?.panic && (activePanic.reporter === u.name || activePanic.reporter === u.email);
          const pinColor = isPanic ? '#ef4444' : u.role === 'guard' ? '#3b82f6' : '#10b981';
          const pulseHtml = isPanic ? `<div class="absolute -inset-2 rounded-full animate-ping bg-red-500 opacity-75"></div>` : '';

          const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: `
              <div class="relative flex items-center justify-center w-10 h-10">
                ${pulseHtml}
                <div class="relative z-10 w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xl text-xs font-bold" style="background-color: ${pinColor}">
                  ${u.role === 'guard' ? '🛡️' : '👤'}
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          const userMarker = L.marker([u.location.lat, u.location.lng], { icon: userIcon })
            .bindPopup(`
              <div class="text-slate-900 font-sans min-w-[200px] ">
                <div class="p-3 bg-slate-50 border-b border-slate-100 rounded-t-lg">
                  <div class="font-black text-sm text-slate-900">${u.name}</div>
                  <div class="text-[10px] uppercase font-bold tracking-wider mt-0.5 ${u.role === 'guard' ? 'text-blue-600' : 'text-emerald-600'}">${u.role}</div>
                </div>
                <div class="p-3 space-y-1.5">
                  <div class="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <span class="opacity-70">📞</span> ${u.phone || u.email}
                  </div>
                  <div class="text-[10px] text-slate-500 font-mono mt-1">
                    <span class="text-rose-500">📍</span> ${u.location.lat.toFixed(5)}, ${u.location.lng.toFixed(5)}
                  </div>
                  ${u.location.lastUpdated ? `<div class="text-[9px] text-slate-400 font-medium mt-1">Updated: ${new Date(u.location.lastUpdated).toLocaleTimeString()}</div>` : ''}
                </div>
              </div>
            `);

          markersLayer.addLayer(userMarker);

          if (isPanic && mapInstanceRef.current) {
            mapInstanceRef.current.setView([u.location.lat, u.location.lng], 18, { animate: true });
          }
        }
      });
    }

    // 4. Render Current Guard's Location if present
    if (currentGuardCoords) {
      bounds.push([currentGuardCoords.lat, currentGuardCoords.lng]);
      const guardIcon = L.divIcon({
        className: 'custom-guard-marker',
        html: `
          <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xl ring-4 ring-emerald-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const guardMarker = L.marker([currentGuardCoords.lat, currentGuardCoords.lng], { icon: guardIcon })
        .bindPopup('<div class="text-slate-900 text-xs font-bold p-1">📍 You (Patrol Guard Live Position)</div>');
      markersLayer.addLayer(guardMarker);
    }

    // Auto-fit bounds if we have points and an incident is selected or there are active alarms
    if (selectedIncidentId) {
      const selected = incidents.find((i) => i.id === selectedIncidentId);
      if (selected) {
        map.setView([selected.coordinates.lat, selected.coordinates.lng], 17, { animate: true });
      }
    } else if (activePanic?.panic) {
      // Find reporter or center on default
    } else if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    }
  }, [incidents, selectedIncidentId, checkpoints, currentGuardCoords, showAllCheckpoints, onSelectIncident, users, activePanic]);

  const handleCenterOnUser = () => {
    if (!mapInstanceRef.current) return;
    if (currentGuardCoords) {
      mapInstanceRef.current.setView([currentGuardCoords.lat, currentGuardCoords.lng], 18, { animate: true });
    } else if (incidents.length > 0) {
      const active = incidents.find((i) => i.status === 'triggered' || i.status === 'responding') || incidents[0];
      mapInstanceRef.current.setView([active.coordinates.lat, active.coordinates.lng], 18, { animate: true });
    }
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950`}>
      {/* Top Map Controls Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-1.5 rounded-2xl shadow-2xl">
        <div className="pl-2 pr-1 flex items-center text-slate-400">
          <Layers className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold">
          <button
            id="map-style-dark-btn"
            onClick={() => setMapTileStyle('dark')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-300 ${
              mapTileStyle === 'dark' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tactical
          </button>
          <button
            id="map-style-satellite-btn"
            onClick={() => setMapTileStyle('satellite')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-300 ${
              mapTileStyle === 'satellite' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Satellite
          </button>
          <button
            id="map-style-street-btn"
            onClick={() => setMapTileStyle('street')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-300 ${
              mapTileStyle === 'street' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Street
          </button>
        </div>
      </div>

      {/* Recenter & Legend Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        <button
          id="map-recenter-btn"
          onClick={handleCenterOnUser}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 text-white border border-slate-700/50 px-4 py-2 rounded-2xl shadow-2xl text-xs font-bold backdrop-blur-xl transition-all duration-300 active:scale-95"
          title="Recenter Map"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>Locate Target</span>
        </button>
      </div>

      {/* Live Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom Floating Status Tag */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 px-5 py-2.5 rounded-full shadow-2xl text-[11px] font-bold text-slate-300 whitespace-nowrap">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="tracking-wide text-white">LIVE GPS TRACING</span>
        </span>
        <span className="w-px h-3 bg-slate-700"></span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
          <span className="tracking-wide">RESPONDERS</span>
        </span>
        <span className="w-px h-3 bg-slate-700"></span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span className="tracking-wide">PATROL POSTS</span>
        </span>
      </div>
    </div>
  );
};
