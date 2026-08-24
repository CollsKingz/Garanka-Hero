const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldSub = /const unsubIncidents = FirestoreSyncService\.subscribeIncidents\(\(cloudIncidents\) => \{\n\s*if \(cloudIncidents && cloudIncidents\.length > 0\) \{\n\s*setIncidents\(cloudIncidents\);\n\s*\}\n\s*\}\);/;

const newSub = `
    const unsubIncidents = FirestoreSyncService.subscribePanicEvents(activeCompany?.id || 'comp-aegis', currentRole, (cloudIncidents) => {
      setIncidents(cloudIncidents);
    });
`;

code = code.replace(oldSub, newSub);
fs.writeFileSync('src/App.tsx', code);
