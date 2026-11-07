import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

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
