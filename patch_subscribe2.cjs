const fs = require('fs');
let code = fs.readFileSync('src/services/firestoreSyncService.ts', 'utf-8');

code = code.replace(
  "if (role === 'admin' || role === 'developer') {",
  "if (role === 'admin' || role === 'developer' || role === 'manager' || role === 'supervisor') {"
);

code = code.replace(
  "// if just regular user, maybe they only see their own or nothing, but the dashboard needs this.\n       q = query(\n        collection(db, 'panicEvents'),\n        where('companyId', '==', companyId)\n      );",
  "q = query(\n        collection(db, 'panicEvents'),\n        where('userId', '==', auth.currentUser?.uid || 'none')\n      );"
);

code = "import { auth } from '../lib/firebase';\n" + code;
fs.writeFileSync('src/services/firestoreSyncService.ts', code);
