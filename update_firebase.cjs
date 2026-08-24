const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const importStr = "import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';\n";
code = importStr + code;

const initStr = `
if (typeof window !== 'undefined') {
  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch(e) { console.warn("App Check failed to initialize", e); }
}
`;
code = code.replace('export const auth: Auth = getAuth(app);', 'export const auth: Auth = getAuth(app);\n' + initStr);
fs.writeFileSync('src/lib/firebase.ts', code);
