import { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, arrayUnion } from "firebase/firestore";
import { auth, db, messaging } from "./firebase";
import "./App.css";

function App() {
  // ユーザー名
  const [username, setUsername] = useState("");

  // 月額料金
  const [monthlyFee, setMonthlyFee] = useState("");

  // 通知時間
  const [notificationTime, setNotificationTime] = useState("20:00");

  // 通知ON/OFF
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // 利用日
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [visitDate, setVisitDate] = useState(todayString);

  // 利用した日
  const [visitDates, setVisitDates] = useState([]);

  // 現在選択している月の利用回数
  const [visitCount, setVisitCount] = useState(0);

  const [fcmToken, setFcmToken] = useState("");

  // 通知のkey
  const VAPID_KEY =
    "BARsixprIuweEwsLPECDCJNtgoGocIYvBtW2axjqbdgLHEdcIbX5xQxhFZ0cne2BlHenJDYxFz38H4RYQ7YGD-s";

  //! 通知を許可する関数
  const handleNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.log("通知が許可されませんでした");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      setFcmToken(token);
      console.log("FCMトークン:", token);
    } catch (error) {
      console.error("通知設定エラー:", error);
    }
  };

  //! 開いた時のuseEffect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const userCredential = await signInAnonymously(auth);
          user = userCredential.user;
        }

        console.log("uid:", user.uid);

        // Firestoreからユーザーデータを取得
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const dates = data.visitDates || [];

          setVisitDates(dates);

          const currentMonth = `${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1,
          ).padStart(2, "0")}`;

          const count = dates.filter((date) =>
            date.startsWith(currentMonth),
          ).length;

          setVisitCount(count);

          setUsername(data.username || "");
          setMonthlyFee(data.monthlyFee?.toString() || "");
          setNotificationTime(data.notificationTime || "20:00");
          setNotificationEnabled(data.notificationEnabled ?? true);

          console.log("ユーザーデータを読み込みました");
        } else {
          console.log("初回アクセスです");
        }
      } catch (error) {
        console.error("ログイン・データ取得エラー:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  //! 利用日を登録
  const handleVisitRegister = async () => {
    if (!visitDate) return;

    const user = auth.currentUser;

    if (!user) {
      console.error("ユーザーが認証されていません");
      return;
    }

    if (visitDates.includes(visitDate)) {
      alert("この日はすでに登録されています");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);

      await setDoc(
        userRef,
        {
          visitDates: arrayUnion(visitDate),
        },
        { merge: true },
      );

      const newVisitDates = [...visitDates, visitDate];

      setVisitDates(newVisitDates);

      const currentMonth = new Date().toISOString().slice(0, 7);

      const count = newVisitDates.filter((date) =>
        date.startsWith(currentMonth),
      ).length;

      setVisitCount(count);

      alert("利用日を登録しました");
    } catch (error) {
      console.error("利用日の登録に失敗しました:", error);
    }
  };

  //! 初期設定の関数
  const handleSaveSettings = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.error("ユーザーが認証されていません");
        return;
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          username: username,
          monthlyFee: Number(monthlyFee),
          notificationTime: notificationTime,
          notificationEnabled: notificationEnabled,
        },
        { merge: true },
      );

      console.log("設定を保存しました");
    } catch (error) {
      console.error("設定の保存に失敗しました:", error);
    }
  };

  return (
    <>
      <main className="adminContainer">
        <h1 className="pageTitle">ジム料金コスパ通知</h1>
        <div>
          <p>FCMトークン</p>
          <textarea
            value={fcmToken}
            readOnly
            rows={5}
            style={{ width: "100%", wordBreak: "break-all" }}
          />
        </div>
        <h2>{username ? `こんにちは${username}さん` : ""}</h2>

        <section className="visitSection">
          <h2 className="sectionTitle">ジム利用日</h2>

          <div className="calendarArea">
            <input
              type="date"
              id="visitDate"
              className="dateInput"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />

            <button className="visitButton" onClick={handleVisitRegister}>
              この日に行きました
            </button>
          </div>

          <p className="visitStatus">
            {new Date().getFullYear()}年{new Date().getMonth() + 1}
            月の利用回数：
            <strong>{visitCount}回</strong>
          </p>
        </section>

        <section className="resultSection">
          <h2 className="sectionTitle">現在の料金</h2>

          <div className="priceResult">
            <span className="priceLabel">1回あたり</span>

            <span className="priceValue">
              {visitCount > 0
                ? Math.floor(Number(monthlyFee) / visitCount).toLocaleString()
                : 0}
            </span>

            <span className="priceUnit">円</span>
          </div>
        </section>

        <section className="settingsSection">
          <h2 className="sectionTitle">基本設定</h2>

          <div className="formGroup">
            <label htmlFor="username">ユーザー名</label>

            <input
              type="text"
              id="username"
              className="textInput"
              placeholder="ユーザー名を入力"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="monthlyFee">月額料金</label>

            <div className="inputWithUnit">
              <input
                type="number"
                id="monthlyFee"
                className="numberInput"
                placeholder="4000"
                min="0"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
              />

              <span>円</span>
            </div>
          </div>

          <div className="formGroup">
            <label htmlFor="notificationTime">通知時間</label>

            <input
              type="time"
              id="notificationTime"
              className="timeInput"
              value={notificationTime}
              step="600"
              onChange={(e) => setNotificationTime(e.target.value)}
            />
          </div>

          <div className="formGroup notificationSetting">
            <label htmlFor="notificationEnabled">通知</label>

            <label className="switch">
              <input
                type="checkbox"
                id="notificationEnabled"
                checked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
              />

              <span className="switchSlider"></span>
            </label>
          </div>

          <button className="saveButton" onClick={handleSaveSettings}>
            設定を保存
          </button>
          <button
            className="permissionButton"
            onClick={handleNotificationPermission}
          >
            通知を許可する
          </button>
        </section>
      </main>
    </>
  );
}

export default App;
