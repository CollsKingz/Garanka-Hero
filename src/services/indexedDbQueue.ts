import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Incident } from '../types';

interface AegisDB extends DBSchema {
  incident_queue: {
    key: string;
    value: Incident;
  };
}

let dbPromise: Promise<IDBPDatabase<AegisDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<AegisDB>('aegis_offline_db', 1, {
    upgrade(db) {
      db.createObjectStore('incident_queue', { keyPath: 'id' });
    },
  });
}

export const offlineQueue = {
  async enqueueIncident(incident: Incident) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.put('incident_queue', incident);
  },

  async getQueuedIncidents(): Promise<Incident[]> {
    if (!dbPromise) return [];
    const db = await dbPromise;
    return db.getAll('incident_queue');
  },

  async removeIncident(id: string) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.delete('incident_queue', id);
  }
};
