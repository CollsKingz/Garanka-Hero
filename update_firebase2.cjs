const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

code = code.replace("initializeAppCheck(app, {", "export const appCheck = initializeAppCheck(app, {");
code = code.replace("import { initializeAppCheck", "import { initializeAppCheck, AppCheck }");
code = code.replace("export let analytics:", "export let appCheck: AppCheck | null = null;\nexport let analytics:");

// Now replace the inside try block to assign to the exported variable
code = code.replace(
  "export const appCheck = initializeAppCheck(app, {",
  "appCheck = initializeAppCheck(app, {"
);

fs.writeFileSync('src/lib/firebase.ts', code);
