import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (lazy or if env vars are present)
let adminApp: admin.app.App | null = null;
try {
  // If FIREBASE_SERVICE_ACCOUNT_JSON is provided, use it. Otherwise, use application default or omit.
  // We will initialize it when required.
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountStr) {
    const serviceAccount = JSON.parse(serviceAccountStr);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminApp = admin.initializeApp();
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Backend verifies token and sets custom claims
app.post("/api/admin/set-role", async (req, res) => {
  if (!adminApp) {
    return res.status(500).json({ error: "Firebase Admin not initialized." });
  }
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // In a real app, only admins should be able to set roles for others. 
    // Here we'll do a simple mock allowing the user to set their own role for demo purposes.
    const { role, companyId, targetUid } = req.body;
    
    const uidToModify = targetUid || decodedToken.uid;
    
    await admin.auth().setCustomUserClaims(uidToModify, { role, companyId });
    res.json({ success: true, message: `Claims set for ${uidToModify}` });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/panic/trigger", async (req, res) => {
  if (!adminApp) {
    return res.status(500).json({ error: "Firebase Admin not initialized." });
  }
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Check App Check token (X-Firebase-AppCheck)
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (appCheckToken) {
      try {
        await admin.appCheck().verifyToken(appCheckToken);
      } catch (err) {
        console.warn("App Check verification failed, but continuing for dev mode:", err);
        // In strict prod: return res.status(401).json({ error: "App Check token invalid." });
      }
    } else {
      console.warn("No App Check token provided.");
    }
    
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    const { lat, lng, accuracy, clientTime, deviceInfo, eventId } = req.body;
    
    // Read claims
    const companyId = decodedToken.companyId || "default-company";
    const role = decodedToken.role || "user";
    
    const panicData = {
      eventId: eventId || `ev-${Date.now()}`,
      userId: decodedToken.uid,
      companyId: companyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      location: { lat, lng, accuracy: accuracy || 0 },
      status: "new",
      device: deviceInfo || "unknown"
    };
    
    // Write to Firestore
    await admin.firestore().collection("panicEvents").doc(panicData.eventId).set(panicData);
    
    res.json({ success: true, eventId: panicData.eventId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
