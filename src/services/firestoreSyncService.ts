import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from '../lib/firebase';
import {
  Incident,
  HouseUnit,
  SecurityCompany,
  Checkpoint,
  PatrolScan,
  OBEntry,
  EquipmentItem,
  AuditLog,
} from '../types';

export class FirestoreSyncService {
  private static isInitialized = false;

  /**
   * Seed initial database collections if empty in Firestore
   */
  static async seedInitialDataIfEmpty(initialData: {
    companies: SecurityCompany[];
    houses: HouseUnit[];
    incidents: Incident[];
    checkpoints: Checkpoint[];
    scans: PatrolScan[];
    obEntries: OBEntry[];
    equipment: EquipmentItem[];
    auditLogs: AuditLog[];
  }) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Check companies
      const compSnap = await getDocs(collection(db, 'companies'));
      if (compSnap.empty) {
        for (const item of initialData.companies) {
          await setDoc(doc(db, 'companies', item.id), item);
        }
      }

      // Check houses
      const houseSnap = await getDocs(collection(db, 'houses'));
      if (houseSnap.empty) {
        for (const item of initialData.houses) {
          await setDoc(doc(db, 'houses', item.id), item);
        }
      }

      // Check checkpoints
      const cpSnap = await getDocs(collection(db, 'checkpoints'));
      if (cpSnap.empty) {
        for (const item of initialData.checkpoints) {
          await setDoc(doc(db, 'checkpoints', item.id), item);
        }
      }

      // Check incidents
      const incSnap = await getDocs(collection(db, 'incidents'));
      if (incSnap.empty) {
        for (const item of initialData.incidents) {
          await setDoc(doc(db, 'incidents', item.id), item);
        }
      }

      // Check equipment
      const eqSnap = await getDocs(collection(db, 'equipment'));
      if (eqSnap.empty) {
        for (const item of initialData.equipment) {
          await setDoc(doc(db, 'equipment', item.id), item);
        }
      }

      // Check OB entries
      const obSnap = await getDocs(collection(db, 'obEntries'));
      if (obSnap.empty) {
        for (const item of initialData.obEntries) {
          await setDoc(doc(db, 'obEntries', item.id), item);
        }
      }
    } catch (err) {
      console.warn('Firestore seeding notice (using local fallback if offline):', err);
    }
  }

  // --- Real-Time Listeners ---

  static subscribeIncidents(callback: (incidents: Incident[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'incidents'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Incident);
          // Sort latest created first
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(list);
        }
      },
      (err) => console.warn('Firestore incidents subscription notice:', err)
    );
  }

  static subscribeHouses(callback: (houses: HouseUnit[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'houses'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as HouseUnit);
          callback(list);
        }
      },
      (err) => console.warn('Firestore houses subscription notice:', err)
    );
  }

  static subscribeOBEntries(callback: (entries: OBEntry[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'obEntries'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as OBEntry);
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          callback(list);
        }
      },
      (err) => console.warn('Firestore obEntries subscription notice:', err)
    );
  }

  static subscribeEquipment(callback: (items: EquipmentItem[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'equipment'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as EquipmentItem);
          callback(list);
        }
      },
      (err) => console.warn('Firestore equipment subscription notice:', err)
    );
  }

  static subscribeScans(callback: (scans: PatrolScan[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'patrolScans'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as PatrolScan);
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          callback(list);
        }
      },
      (err) => console.warn('Firestore patrolScans subscription notice:', err)
    );
  }

  static subscribeAuditLogs(callback: (logs: AuditLog[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'auditLogs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as AuditLog);
          callback(list);
        }
      },
      (err) => console.warn('Firestore auditLogs subscription notice:', err)
    );
  }

  // --- Document Sync Operations ---

  static async saveIncident(incident: Incident) {
    try {
      await setDoc(doc(db, 'incidents', incident.id), incident, { merge: true });
    } catch (err) {
      console.warn('Error saving incident to Firestore:', err);
    }
  }

  static async saveHouse(house: HouseUnit) {
    try {
      await setDoc(doc(db, 'houses', house.id), house, { merge: true });
    } catch (err) {
      console.warn('Error saving house to Firestore:', err);
    }
  }

  static async deleteHouse(houseId: string) {
    try {
      await deleteDoc(doc(db, 'houses', houseId));
    } catch (err) {
      console.warn('Error deleting house from Firestore:', err);
    }
  }

  static async saveOBEntry(entry: OBEntry) {
    try {
      await setDoc(doc(db, 'obEntries', entry.id), entry, { merge: true });
    } catch (err) {
      console.warn('Error saving OB entry to Firestore:', err);
    }
  }

  static async saveEquipment(item: EquipmentItem) {
    try {
      await setDoc(doc(db, 'equipment', item.id), item, { merge: true });
    } catch (err) {
      console.warn('Error saving equipment to Firestore:', err);
    }
  }

  static async savePatrolScan(scan: PatrolScan) {
    try {
      await setDoc(doc(db, 'patrolScans', scan.id), scan, { merge: true });
    } catch (err) {
      console.warn('Error saving scan to Firestore:', err);
    }
  }

  static async saveAuditLog(log: AuditLog) {
    try {
      await setDoc(doc(db, 'auditLogs', log.id), log, { merge: true });
    } catch (err) {
      console.warn('Error saving audit log to Firestore:', err);
    }
  }
}
