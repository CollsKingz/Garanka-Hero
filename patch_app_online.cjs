const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "const handleOnline = () => setIsOnline(true);",
  "const handleOnline = () => {\n      setIsOnline(true);\n      FirestoreSyncService.syncOfflineQueue();\n    };"
);

// Call it once on mount if online
code = code.replace(
  "window.addEventListener('online', handleOnline);",
  "window.addEventListener('online', handleOnline);\n    if (navigator.onLine) FirestoreSyncService.syncOfflineQueue();"
);

fs.writeFileSync('src/App.tsx', code);
