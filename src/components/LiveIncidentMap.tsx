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
            <div class="text-slate-900 text-xs p-1">
              <strong class="text-sm font-bold text-slate-950">${cp.name}</strong>
              <div class="text-emerald-700 font-semibold mt-0.5">Zone: ${cp.zone}</div>
              <div class="text-slate-600 mt-1">Code: <code class="bg-slate-200 px-1 py-0.5 rounded text-[10px]">${cp.code}</code></div>
              <div class="text-slate-500 text-[10px] mt-1">Last scanned: ${cp.lastScannedBy || 'Never'}</div>
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
      const pulseHtml = !isResolved ? `<div class="absolute -inset-2 rounded-full animate-ping opacity-60" style="background-color: ${pinColor}"></div>` : '';

      const incidentIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10">
            ${pulseHtml}
            <div class="relative z-10 flex items-center justify-center w-9 h-9 rounded-full text-white shadow-2xl ${isSelected ? 'ring-4 ring-white' : ''}" style="background-color: ${pinColor}">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: incidentIcon });
      
      marker.on('click', () => {
        if (onSelectIncident) onSelectIncident(inc.id);
      });

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${inc.coordinates.lat},${inc.coordinates.lng}`;

      marker.bindPopup(`
        <div class="text-slate-900 text-xs min-w-[210px] p-1 font-sans">
          <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-1.5">
            <span class="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">${inc.code}</span>
            <span class="uppercase text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white ${pinColor === '#ef4444' ? 'bg-red-600' : 'bg-amber-600'}">${inc.status}</span>
          </div>
          <div class="font-bold text-slate-900 text-sm leading-snug">${inc.title}</div>
          <div class="text-slate-600 mt-1">👤 Reporter: <strong class="text-slate-800">${inc.reporterName}</strong> (${inc.reporterPhone})</div>
          <div class="text-slate-500 text-[10px] mt-0.5 font-mono">📍 GPS: ${inc.coordinates.lat.toFixed(5)}, ${inc.coordinates.lng.toFixed(5)}</div>
          
          <div class="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between gap-1">
            <a href="${googleMapsUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 px-2 py-1 rounded text-[11px] font-medium transition">
              <span>Google Maps</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      `);

      markersLayer.addLayer(marker);

      // Breadcrumb phone tracing history
      if (inc.tracingHistory && inc.tracingHistory.length > 1) {
        const polylinePoints: [number, number][] = inc.tracingHistory.map((pt) => [pt.lat, pt.lng]);
        polylinePoints.push([inc.coordinates.lat, inc.coordinates.lng]);

        const traceLine = L.polyline(polylinePoints, {
          color: '#f43f5e',
          weight: 3,
          opacity: 0.8,
          dashArray: '6, 6',
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
                <div class="bg-blue-600 text-white font-bold text-[9px] px-1 py-0.5 rounded shadow whitespace-nowrap mb-0.5">
                  ${resp.callSign} (${resp.etaMinutes}m)
                </div>
                <div class="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [60, 48],
            iconAnchor: [30, 48],
          });

          const respMarker = L.marker([resp.currentCoords.lat, resp.currentCoords.lng], { icon: responderIcon })
            .bindPopup(`
              <div class="text-slate-900 text-xs p-1">
                <strong>${resp.name}</strong>
                <div class="text-blue-700 font-mono font-bold">${resp.callSign}</div>
                <div class="text-slate-600 mt-1">Status: ${resp.status === 'en_route' ? 'En Route (ETA: ' + resp.etaMinutes + ' min)' : 'On Scene'}</div>
              </div>
            `);

          markersLayer.addLayer(respMarker);

          // Route Line between Responder and Incident
          const routeLine = L.polyline(
            [
              [resp.currentCoords.lat, resp.currentCoords.lng],
              [inc.coordinates.lat, inc.coordinates.lng],
            ],
            {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.9,
              dashArray: '8, 8',
            }
          );
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
              <div class="relative flex items-center justify-center w-8 h-8">
                ${pulseHtml}
                <div class="relative z-10 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xl text-[10px] font-bold" style="background-color: ${pinColor}">
                  ${u.role === 'guard' ? '🛡️' : '👤'}
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const userMarker = L.marker([u.location.lat, u.location.lng], { icon: userIcon })
            .bindPopup(`
              <div class="text-slate-900 text-xs p-1 font-sans">
                <div class="font-black text-sm">${u.name}</div>
                <div class="text-xs uppercase font-bold text-red-600">${u.role}</div>
                <div class="text-slate-600 mt-1">📞 ${u.phone || u.email}</div>
                <div class="text-[10px] text-slate-500 font-mono mt-1">📍 Lat: ${u.location.lat.toFixed(5)}, Lng: ${u.location.lng.toFixed(5)}</div>
                ${u.location.lastUpdated ? `<div class="text-[9px] text-slate-400 mt-0.5">Updated: ${new Date(u.location.lastUpdated).toLocaleTimeString()}</div>` : ''}
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
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Layer:</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            id="map-style-dark-btn"
            onClick={() => setMapTileStyle('dark')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              mapTileStyle === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Dark
          </button>
          <button
            id="map-style-satellite-btn"
            onClick={() => setMapTileStyle('satellite')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              mapTileStyle === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            id="map-style-street-btn"
            onClick={() => setMapTileStyle('street')}
            className={`px-2 py-0.5 rounded-md font-medium transition ${
              mapTileStyle === 'street' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Street
          </button>
        </div>
      </div>

      {/* Recenter & Legend Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          id="map-recenter-btn"
          onClick={handleCenterOnUser}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg text-xs font-semibold backdrop-blur-md transition active:scale-95"
          title="Recenter Map"
        >
          <Crosshair className="w-3.5 h-3.5 text-rose-400" />
          <span>Target Focus</span>
        </button>
      </div>

      {/* Live Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom Floating Status Tag */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 bg-slate-950/90 border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-md text-[11px] text-slate-300 font-mono backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Live GPS Tracing Active</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Responders En Route</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Patrol QR Posts</span>
        </span>
      </div>
    </div>
  );
};
