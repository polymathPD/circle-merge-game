// Firebase SDK 초기화 설정
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase 설정 (Firebase Console에서 복사한 값으로 교체하세요)
const firebaseConfig = {
  apiKey: "AIzaSyBpaNWInTZ8Y7W4uigMq8_9Qz2BzDOXBGE",
  authDomain: "watermelon-49b6c.firebaseapp.com",
  projectId: "watermelon-49b6c",
  storageBucket: "watermelon-49b6c.firebasestorage.app",
  messagingSenderId: "285043632472",
  appId: "1:285043632472:web:e16a08bca0e87b86319d2d"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
