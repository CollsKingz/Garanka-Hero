import { offlineQueue } from './indexedDbQueue';
import { query, where } from 'firebase/firestore';
import { auth } from '../lib/firebase';
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
  UserProfile,
} from '../types';

export class FirestoreSyncService {
  private static isInitialized = false;

  /**
   * Seed initial empty or default tenant data if collections are empty
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
    users: UserProfile[];
  }) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const compSnap = await getDocs(collection(db, 'companies'));
      if (compSnap.empty && initialData.companies.length > 0) {
        for (const item of initialData.companies) {
          await setDoc(doc(db, 'companies', item.id), item);
        }
      }

      const userSnap = await getDocs(collection(db, 'users'));
      if (userSnap.empty && initialData.users.length > 0) {
        for (const item of initialData.users) {
          await setDoc(doc(db, 'users', item.id), item);
        }
      }

      const houseSnap = await getDocs(collection(db, 'houses'));
      if (houseSnap.empty && initialData.houses.length > 0) {
        for (const item of initialData.houses) {
          await setDoc(doc(db, 'houses', item.id), item);
        }
      }

      const incSnap = await getDocs(collection(db, 'incidents'));
      if (incSnap.empty && initialData.incidents.length > 0) {
        for (const item of initialData.incidents) {
          await setDoc(doc(db, 'incidents', item.id), item);
        }
      }
    } catch (err) {
      console.warn('Firestore seeding notice:', err);
    }
  }

  // --- Real-Time Subscriptions ---

  static subscribeCompanies(callback: (companies: SecurityCompany[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'companies'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as SecurityCompany);
        callback(list);
      },
      (err) => console.warn('Companies subscription error:', err)
    );
  }

  static subscribeUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as UserProfile);
        callback(list);
      },
      (err) => console.warn('Users subscription error:', err)
    );
  }

  static subscribeHouses(callback: (houses: HouseUnit[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'houses'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as HouseUnit);
        callback(list);
      },
      (err) => console.warn('Houses subscription error:', err)
    );
  }

  
  static subscribePanicEvents(companyId: string, role: string, callback: (incidents: Incident[]) => void): Unsubscribe {
    let q;
    if (role === 'admin' || role === 'developer' || role === 'manager' || role === 'supervisor') {
       q = query(
        collection(db, 'panicEvents'),
        where('companyId', '==', companyId),
        where('status', 'in', ['new', 'acknowledged'])
      );
    } else {
       q = query(
        collection(db, 'panicEvents'),
        where('userId', '==', auth.currentUser?.uid || 'none')
      );
    }
    
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Incident[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.eventId || d.id,
            code: `PANIC-${d.id.substring(0, 5).toUpperCase()}`,
            title: 'Emergency Beacon Alert',
            category: 'PANIC_GENERAL',
            status: data.status === 'new' ? 'triggered' : data.status === 'acknowledged' ? 'responding' : 'resolved',
            severity: 'critical',
            siteId: 'site-1',
            siteName: 'Main Site',
            companyId: data.companyId,
            reporterId: data.userId,
            reporterName: 'User ' + data.userId.substring(0, 4),
            reporterPhone: '',
            reporterRole: 'community',
            coordinates: {
              lat: data.location?.lat || 0,
              lng: data.location?.lng || 0,
              accuracy: data.location?.accuracy || 0,
            },
            tracingActive: data.status !== 'resolved',
            tracingHistory: data.location ? [data.location] : [],
            assignedResponders: [],
            timeline: [],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Incident;
        });
        
        callback(list);
      },
      (err) => console.warn('Panic events subscription error:', err)
    );
  }

  static subscribeOBEntries(callback: (entries: OBEntry[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'obEntries'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as OBEntry);
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (err) => console.warn('OBEntries subscription error:', err)
    );
  }

  static subscribeEquipment(callback: (items: EquipmentItem[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'equipment'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as EquipmentItem);
        callback(list);
      },
      (err) => console.warn('Equipment subscription error:', err)
    );
  }

  static subscribeScans(callback: (scans: PatrolScan[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'patrolScans'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as PatrolScan);
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (err) => console.warn('Scans subscription error:', err)
    );
  }

  static subscribeAuditLogs(callback: (logs: AuditLog[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'auditLogs'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as AuditLog);
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (err) => console.warn('AuditLogs subscription error:', err)
    );
  }

  // --- CRUD Operations ---

  static async saveCompany(company: SecurityCompany) {
    try {
      await setDoc(doc(db, 'companies', company.id), company, { merge: true });
    } catch (err) {
      console.warn('Error saving company:', err);
    }
  }

  static async deleteCompany(companyId: string) {
    try {
      await deleteDoc(doc(db, 'companies', companyId));
    } catch (err) {
      console.warn('Error deleting company:', err);
    }
  }

  static async saveUser(user: UserProfile) {
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (err) {
      console.warn('Error saving user:', err);
    }
  }

  static async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.warn('Error deleting user:', err);
    }
  }

  static async saveHouse(house: HouseUnit) {
    try {
      await setDoc(doc(db, 'houses', house.id), house, { merge: true });
    } catch (err) {
      console.warn('Error saving house:', err);
    }
  }

  static async deleteHouse(houseId: string) {
    try {
      await deleteDoc(doc(db, 'houses', houseId));
    } catch (err) {
      console.warn('Error deleting house:', err);
    }
  }


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
      console.log(`Syncing ${queued.length} queued incidents to Firestore...`);
      for (const inc of queued) {
        await setDoc(doc(db, 'incidents', inc.id), inc, { merge: true });
        await offlineQueue.removeIncident(inc.id);
      }
      console.log('Offline queue sync complete.');
    } catch (err) {
      console.error('Error syncing offline queue:', err);
    }
  }


  static async deleteIncident(incidentId: string) {
    try {
      await deleteDoc(doc(db, 'incidents', incidentId));
    } catch (err) {
      console.warn('Error deleting incident:', err);
    }
  }

  static async saveOBEntry(entry: OBEntry) {
    try {
      await setDoc(doc(db, 'obEntries', entry.id), entry, { merge: true });
    } catch (err) {
      console.warn('Error saving OB entry:', err);
    }
  }

  static async saveEquipment(item: EquipmentItem) {
    try {
      await setDoc(doc(db, 'equipment', item.id), item, { merge: true });
    } catch (err) {
      console.warn('Error saving equipment:', err);
    }
  }

  static async savePatrolScan(scan: PatrolScan) {
    try {
      await setDoc(doc(db, 'patrolScans', scan.id), scan, { merge: true });
    } catch (err) {
      console.warn('Error saving patrol scan:', err);
    }
  }

  static async saveAuditLog(log: AuditLog) {
    try {
      await setDoc(doc(db, 'auditLogs', log.id), log, { merge: true });
    } catch (err) {
      console.warn('Error saving audit log:', err);
    }
  }
}
