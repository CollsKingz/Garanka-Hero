import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Incident, AuditLog } from '../types';

interface AegisDB extends DBSchema {
  incident_queue: {
    key: string;
    value: Incident;
  };
  audit_queue: {
    key: string;
    value: AuditLog;
  };
}

let dbPromise: Promise<IDBPDatabase<AegisDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<AegisDB>('aegis_offline_db', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('incident_queue')) {
        db.createObjectStore('incident_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('audit_queue')) {
        db.createObjectStore('audit_queue', { keyPath: 'id' });
      }
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
  },

  async enqueueAuditLog(log: AuditLog) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.put('audit_queue', log);
  },

  async getQueuedAuditLogs(): Promise<AuditLog[]> {
    if (!dbPromise) return [];
    const db = await dbPromise;
    return db.getAll('audit_queue');
  },

  async removeAuditLog(id: string) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.delete('audit_queue', id);
  }
};
