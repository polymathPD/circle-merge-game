// js/auth.js
import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;

// 구글 로그인
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // 사용자 정보 확인
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // 최초 로그인 - 닉네임 설정 필요
      return { user, needsNickname: true };
    } else {
      // 기존 사용자
      currentUser = { ...user, nickname: userDoc.data().nickname };
      return { user: currentUser, needsNickname: false };
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
}

// 닉네임 설정
export async function setNickname(userId, nickname) {
  try {
    await setDoc(doc(db, 'users', userId), {
      nickname: nickname,
      createdAt: new Date()
    });

    const user = auth.currentUser;
    currentUser = { ...user, nickname };
    return true;
  } catch (error) {
    console.error('닉네임 설정 오류:', error);
    throw error;
  }
}

// 로그아웃
export async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
}

// 현재 사용자 가져오기
export function getCurrentUser() {
  return currentUser || auth.currentUser;
}

// 사용자 상태 변경 감지
export function onUserStateChange(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        currentUser = { ...user, nickname: userDoc.data().nickname };
        callback(currentUser);
      } else {
        callback(user);
      }
    } else {
      currentUser = null;
      callback(null);
    }
  });
}