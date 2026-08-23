import { Coordinates } from '../types';

export class GeolocationService {
  private watchId: number | null = null;
  private currentCoords: Coordinates = {
    lat: -26.1082,
    lng: 28.0573,
    accuracy: 5,
    timestamp: Date.now(),
    address: 'Sandton City, Rivonia Rd, Sandton',
  };
  private listeners: ((coords: Coordinates) => void)[] = [];
  private simulationInterval: any = null;

  public subscribe(callback: (coords: Coordinates) => void) {
    this.listeners.push(callback);
    callback(this.currentCoords);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.currentCoords }));
  }

  public getCurrentCoords(): Coordinates {
    return { ...this.currentCoords };
  }

  public startLiveTracing(isLiveMovementSimulation: boolean = true) {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.currentCoords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 8,
              heading: pos.coords.heading || 0,
              speed: pos.coords.speed || 0,
              timestamp: pos.timestamp || Date.now(),
            };
            this.notify();
          },
          (err) => {
            console.warn('Geolocation access fallback to simulated coordinate:', err.message);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );

        this.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            this.currentCoords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 6,
              heading: pos.coords.heading || 0,
              speed: pos.coords.speed || 0,
              timestamp: pos.timestamp || Date.now(),
            };
            this.notify();
          },
          (err) => {
            console.warn('WatchPosition fallback:', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 2000 }
        );
      } catch (e) {
        console.warn('Geolocation API error:', e);
      }
    }

    if (isLiveMovementSimulation && !this.simulationInterval) {
      // Simulate slight dynamic phone movement/drift during live tracing (e.g. victim walking / moving)
      this.simulationInterval = setInterval(() => {
        const dLat = (Math.random() - 0.48) * 0.00015;
        const dLng = (Math.random() - 0.48) * 0.00015;
        this.currentCoords = {
          ...this.currentCoords,
          lat: Number((this.currentCoords.lat + dLat).toFixed(6)),
          lng: Number((this.currentCoords.lng + dLng).toFixed(6)),
          accuracy: Math.floor(4 + Math.random() * 4),
          timestamp: Date.now(),
        };
        this.notify();
      }, 3000);
    }
  }

  public stopLiveTracing() {
    if (this.watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // Calculate distance between two coordinates in meters (Haversine formula)
  public static calculateDistanceMeters(c1: Coordinates, c2: Coordinates): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (c1.lat * Math.PI) / 180;
    const φ2 = (c2.lat * Math.PI) / 180;
    const Δφ = ((c2.lat - c1.lat) * Math.PI) / 180;
    const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  public static calculateEtaMinutes(distanceMeters: number, averageSpeedKmh: number = 35): number {
    const hours = (distanceMeters / 1000) / averageSpeedKmh;
    const minutes = Math.ceil(hours * 60);
    return Math.max(1, minutes);
  }
}

export const geolocationService = new GeolocationService();
