import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Firebaseの初期化
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const messaging = getMessaging();

// 日本時間の日付・時刻を取得
function getJapanDateTime() {
  const now = new Date();

  const date = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(now);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);

  return { date, time };
}

export default async function handler(req, res) {
  // 合言葉の確認
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const { date: today, time: currentTime } = getJapanDateTime();

    const currentMonth = today.slice(0, 7);

    // 全ユーザーを取得
    const snapshot = await db.collection("users").get();

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userDoc of snapshot.docs) {
      const user = userDoc.data();

      // 通知設定がOFFならスキップ
      if (user.notificationEnabled !== true) {
        skippedCount++;
        continue;
      }

      // 通知時刻が一致しなければスキップ
      if (user.notificationTime !== currentTime) {
        skippedCount++;
        continue;
      }

      // 今日すでに通知済みならスキップ
      if (user.lastNotifiedDate === today) {
        skippedCount++;
        continue;
      }

      // 通知先トークンがなければスキップ
      if (!user.fcmToken) {
        skippedCount++;
        continue;
      }

      // 今月のジム利用回数を計算
      const visitDates = Array.isArray(user.visitDates) ? user.visitDates : [];

      const visitCount = visitDates.filter(
        (date) => typeof date === "string" && date.startsWith(currentMonth),
      ).length;

      //   一回あたりの料金  一度も行っていないなら月額料金(無ければ0)。一度でも行っていれば割った額
      const pricePerVisit =
        visitCount === 0
          ? Number(user.monthlyFee || 0)
          : Math.floor(Number(user.monthlyFee || 0) / visitCount);

      try {
        // FCMに通知を依頼（重要）
        await messaging.send({
          token: user.fcmToken,
          notification: {
            title: "number-push-test",
            body: `今日のジム料金：${pricePerVisit.toLocaleString()}円`,
          },
        });

        // 通知済みの日付を保存(再度送らないようにするため)
        await userDoc.ref.update({
          lastNotifiedDate: today,
        });

        sentCount++;
      } catch (error) {
        console.error(`Notification error (${userDoc.id}):`, error.message);

        errorCount++;
      }
    }

    return res.status(200).json({
      success: true,
      currentTime,
      totalUsers: snapshot.size,
      sentCount,
      skippedCount,
      errorCount,
      message: "Notification check completed",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Notification process failed",
    });
  }
}
