importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBPSUWnDCMHaS--mFNW_CdfSlLJ6Jh-9NM",
  authDomain: "number-push-test.firebaseapp.com",
  projectId: "number-push-test",
  storageBucket: "number-push-test.firebasestorage.app",
  messagingSenderId: "111105349250",
  appId: "1:111105349250:web:59a3884d9f2d9228b3869b",
});

const messaging = firebase.messaging();
