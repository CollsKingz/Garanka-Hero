const fs = require('fs');
let code = fs.readFileSync('src/services/firestoreSyncService.ts', 'utf-8');

const queryImports = "import { query, where, orderBy, onSnapshot, collection } from 'firebase/firestore';";

const newSubscribe = `
  static subscribePanicEvents(companyId: string, role: string, callback: (incidents: Incident[]) => void): Unsubscribe {
    let q;
    if (role === 'admin' || role === 'developer') {
       q = query(
        collection(db, 'panicEvents'),
        where('companyId', '==', companyId),
        where('status', 'in', ['new', 'acknowledged'])
      );
    } else {
       // if just regular user, maybe they only see their own or nothing, but the dashboard needs this.
       q = query(
        collection(db, 'panicEvents'),
        where('companyId', '==', companyId)
      );
    }
    
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Incident[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.eventId || d.id,
            code: \`PANIC-\${d.id.substring(0, 5).toUpperCase()}\`,
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
`;

code = code.replace(/static subscribeIncidents\([\s\S]*?\}\n/, newSubscribe);
fs.writeFileSync('src/services/firestoreSyncService.ts', code);
