import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const fbAdmin = admin as any;

let adminApp: any = null;
try {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountStr) {
    const serviceAccount = JSON.parse(serviceAccountStr);
    adminApp = fbAdmin.initializeApp({
      credential: fbAdmin.credential.cert(serviceAccount)
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminApp = fbAdmin.initializeApp();
  }
} catch (error) {
  // Already initialized or log warning
}

const app = express();
app.use(cors());
app.use(express.json());

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
    const decodedToken = await fbAdmin.auth().verifyIdToken(idToken);
    
    const { role, companyId, targetUid } = req.body;
    const uidToModify = targetUid || decodedToken.uid;
    
    await fbAdmin.auth().setCustomUserClaims(uidToModify, { role, companyId });
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
    
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (appCheckToken) {
      try {
        await fbAdmin.appCheck().verifyToken(appCheckToken);
      } catch (err) {
        console.warn("App Check verification failed:", err);
      }
    }
    
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await fbAdmin.auth().verifyIdToken(idToken);
    
    const { lat, lng, accuracy, clientTime, deviceInfo, eventId } = req.body;
    const companyId = decodedToken.companyId || "default-company";
    
    const panicData = {
      eventId: eventId || `ev-${Date.now()}`,
      userId: decodedToken.uid,
      companyId: companyId,
      createdAt: fbAdmin.firestore.FieldValue.serverTimestamp(),
      location: { lat, lng, accuracy: accuracy || 0 },
      status: "new",
      device: deviceInfo || "unknown"
    };
    
    await fbAdmin.firestore().collection("panicEvents").doc(panicData.eventId).set(panicData);
    
    res.json({ success: true, eventId: panicData.eventId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default app;
