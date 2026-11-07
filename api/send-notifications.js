import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection("users").get();

    res.status(200).json({
      success: true,
      userCount: snapshot.size,
      message: "Firebase connection successful!",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Firebase connection failed",
    });
  }
}
