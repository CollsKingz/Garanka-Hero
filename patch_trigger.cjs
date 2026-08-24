const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importToken = "import { getIdToken } from 'firebase/auth';\nimport { getToken } from 'firebase/app-check';\nimport { appCheck } from './lib/firebase';\n";
code = code.replace("import { auth } from './lib/firebase';", "import { auth } from './lib/firebase';\n" + importToken);

const handleTriggerReg = /const handleTriggerPanic = \([\s\S]*?setIncidents\(\(prev\) => \[newIncident, \.\.\.prev\]\);\n  \};\n/;

const newHandleTrigger = `
  const handleTriggerPanic = async (category: IncidentCategory, notes?: string, isSilent?: boolean) => {
    if (!auth.currentUser) {
      console.error("Must be logged in to trigger panic.");
      return;
    }
    const currentCoords = geolocationService.getCurrentCoords();
    geolocationService.startLiveTracing();
    const newIncidentId = 'inc-' + Date.now();
    const newCode = \`INC-2026-\${Math.floor(1000 + Math.random() * 9000)}\`;
    
    const newIncident: Incident = {
      id: newIncidentId,
      code: newCode,
      title: \`\${category.replace(/_/g, ' ')} - Emergency Beacon Alert\`,
      category,
      status: 'triggered',
      severity: category === 'ARMED_ROBBERY' || category === 'ASSAULT' ? 'critical' : 'high',
      siteId: currentUser?.siteId || '',
      siteName: currentUser?.siteName || '',
      companyId: activeCompany?.id || 'comp-aegis',
      houseId: currentUser?.assignedHouseId || '',
      houseNumber: 'Unit 14',
      deviceId: currentUser?.assignedDeviceId || '',
      reporterId: currentUser?.id || auth.currentUser.uid,
      reporterName: currentUser?.name || auth.currentUser.email || 'Unknown',
      reporterPhone: currentUser?.phone || '',
      reporterRole: currentUser?.role || 'community',
      coordinates: {
        ...currentCoords,
        address: 'Sandton City Precinct - Level P2 Core',
      },
      tracingActive: true,
      tracingHistory: [currentCoords],
      assignedResponders: [],
      timeline: [
        {
          id: 'tl-' + Date.now(),
          timestamp: new Date().toISOString(),
          actor: currentUser?.name || 'Unknown',
          actorRole: currentUser?.role || 'community',
          action: 'PANIC_TRIGGERED',
          details: \`\${isSilent ? 'Silent ' : ''}Panic signal activated from mobile device. Coordinates: \${currentCoords.lat}, \${currentCoords.lng}\`,
          location: currentCoords,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes,
    };

    setIncidents((prev) => [newIncident, ...prev]);

    try {
      const idToken = await getIdToken(auth.currentUser);
      let appCheckToken = '';
      if (appCheck) {
        try {
          const appCheckTokenResponse = await getToken(appCheck, false);
          appCheckToken = appCheckTokenResponse.token;
        } catch (err) {
          console.warn("Could not get App Check token:", err);
        }
      }

      await fetch('/api/panic/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${idToken}\`,
          'X-Firebase-AppCheck': appCheckToken,
        },
        body: JSON.stringify({
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          accuracy: currentCoords.accuracy || 0,
          clientTime: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          eventId: newIncidentId,
        })
      });
    } catch (e) {
      console.error("Failed to send panic to backend:", e);
    }
  };
`;

code = code.replace(handleTriggerReg, newHandleTrigger);

fs.writeFileSync('src/App.tsx', code);
