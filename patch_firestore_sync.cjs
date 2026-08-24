const fs = require('fs');
let code = fs.readFileSync('src/services/firestoreSyncService.ts', 'utf-8');

code = "import { offlineQueue } from './indexedDbQueue';\n" + code;

const oldSave = `  static async saveIncident(incident: Incident) {\n    try {\n      await setDoc(doc(db, 'incidents', incident.id), incident, { merge: true });\n    } catch (err) {\n      console.warn('Error saving incident:', err);\n    }\n  }`;

const newSave = `
  static async saveIncident(incident: Incident) {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.log('User offline. Queueing incident in IndexedDB...');
      await offlineQueue.enqueueIncident(incident);
      return;
    }
    try {
      await setDoc(doc(db, 'incidents', incident.id), incident, { merge: true });
    } catch (err) {
      console.warn('Error saving incident to Firestore. Queueing locally:', err);
      await offlineQueue.enqueueIncident(incident);
    }
  }

  static async syncOfflineQueue() {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    try {
      const queued = await offlineQueue.getQueuedIncidents();
      if (queued.length === 0) return;
      console.log(\`Syncing \${queued.length} queued incidents to Firestore...\`);
      for (const inc of queued) {
        await setDoc(doc(db, 'incidents', inc.id), inc, { merge: true });
        await offlineQueue.removeIncident(inc.id);
      }
      console.log('Offline queue sync complete.');
    } catch (err) {
      console.error('Error syncing offline queue:', err);
    }
  }
`;

code = code.replace(oldSave, newSave);

fs.writeFileSync('src/services/firestoreSyncService.ts', code);
