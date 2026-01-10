// js/scoreboard.js
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 점수 저장
export async function saveScore(userId, nickname, score) {
  try {
    await addDoc(collection(db, 'scores'), {
      userId: userId,
      nickname: nickname,
      score: score,
      date: new Date()
    });
    return true;
  } catch (error) {
    console.error('점수 저장 오류:', error);
    throw error;
  }
}

// 전체 랭킹 조회 (TOP N)
export async function getTopScores(topN = 10) {
  try {
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(topN)
    );

    const querySnapshot = await getDocs(q);
    const scores = [];

    querySnapshot.forEach((doc) => {
      scores.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return scores;
  } catch (error) {
    console.error('랭킹 조회 오류:', error);
    throw error;
  }
}

// 특정 사용자의 최고 점수 조회
export async function getUserBestScore(userId) {
  try {
    const q = query(
      collection(db, 'scores'),
      where('userId', '==', userId),
      orderBy('score', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }

    return null;
  } catch (error) {
    console.error('최고 점수 조회 오류:', error);
    throw error;
  }
}

// 사용자의 모든 점수 조회
export async function getUserScores(userId, limitCount = 10) {
  try {
    const q = query(
      collection(db, 'scores'),
      where('userId', '==', userId),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scores = [];

    querySnapshot.forEach((doc) => {
      scores.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return scores;
  } catch (error) {
    console.error('사용자 점수 조회 오류:', error);
    throw error;
  }
}