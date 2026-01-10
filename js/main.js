import { Game } from './game.js';
import { ImageLoader } from './imageLoader.js';
import { signInWithGoogle, setNickname, logout, onUserStateChange, getCurrentUser } from './auth.js';
import { getTopScores, getUserScores } from './scoreboard.js';

console.log('🔵 main.js 모듈 로드됨!');

let game = null;
let currentUser = null;

// UI 요소들
const loginModal = document.getElementById('login-modal');
const nicknameModal = document.getElementById('nickname-modal');
const scoreboardModal = document.getElementById('scoreboard-modal');
const googleLoginBtn = document.getElementById('google-login-btn');
const nicknameInput = document.getElementById('nickname-input');
const nicknameSubmitBtn = document.getElementById('nickname-submit-btn');
const nicknameError = document.getElementById('nickname-error');
const userNicknameSpan = document.getElementById('user-nickname');
const logoutBtn = document.getElementById('logout-btn');
const showScoreboardBtn = document.getElementById('show-scoreboard-btn');
const closeScoreboardBtn = document.getElementById('close-scoreboard');
const scoreboardList = document.getElementById('scoreboard-list');
const tabBtns = document.querySelectorAll('.tab-btn');

// 로그인 버튼 클릭
googleLoginBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithGoogle();

        if (result.needsNickname) {
            // 최초 로그인 - 닉네임 설정 필요
            loginModal.style.display = 'none';
            nicknameModal.style.display = 'flex';
        } else {
            // 기존 사용자
            loginModal.style.display = 'none';
            currentUser = result.user;
            updateUserUI(currentUser);
            await startGame();
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        alert('로그인에 실패했습니다: ' + error.message);
    }
});

// 닉네임 제출
nicknameSubmitBtn.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();

    if (nickname.length < 2 || nickname.length > 10) {
        nicknameError.textContent = '닉네임은 2-10자여야 합니다.';
        return;
    }

    try {
        nicknameSubmitBtn.disabled = true;
        const user = getCurrentUser();
        await setNickname(user.uid, nickname);

        nicknameModal.style.display = 'none';
        currentUser = { ...user, nickname };
        updateUserUI(currentUser);
        await startGame();
    } catch (error) {
        console.error('닉네임 설정 오류:', error);
        nicknameError.textContent = '닉네임 설정에 실패했습니다.';
        nicknameSubmitBtn.disabled = false;
    }
});

// 로그아웃
logoutBtn.addEventListener('click', async () => {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
        if (game) {
            game.cleanup();
            game = null;
        }
        await logout();
        isGameStarted = false;  // ← 이게 핵심!

        // UI 초기화
        loginModal.style.display = 'flex';
        nicknameModal.style.display = 'none';
        scoreboardModal.style.display = 'none';
    }
});

// 스코어보드 열기
showScoreboardBtn.addEventListener('click', () => {
    scoreboardModal.style.display = 'flex';
    loadScoreboard('global');
});

// 스코어보드 닫기
closeScoreboardBtn.addEventListener('click', () => {
    scoreboardModal.style.display = 'none';
});

// 스코어보드 탭 전환
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        loadScoreboard(tab);
    });
});

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
    if (e.target === scoreboardModal) {
        scoreboardModal.style.display = 'none';
    }
});

// 사용자 UI 업데이트
function updateUserUI(user) {
    if (user && user.nickname) {
        userNicknameSpan.textContent = user.nickname;
        logoutBtn.style.display = 'inline-block';
    } else {
        userNicknameSpan.textContent = 'Guest';
        logoutBtn.style.display = 'none';
    }
}

// 스코어보드 로드
async function loadScoreboard(tab) {
    scoreboardList.innerHTML = '<div class="empty-message">로딩 중...</div>';

    try {
        let scores = [];

        if (tab === 'global') {
            scores = await getTopScores(50);
        } else {
            if (!currentUser) {
                scoreboardList.innerHTML = '<div class="empty-message">로그인이 필요합니다.</div>';
                return;
            }
            scores = await getUserScores(currentUser.uid, 20);
        }

        if (scores.length === 0) {
            scoreboardList.innerHTML = '<div class="empty-message">아직 기록이 없습니다.</div>';
            return;
        }

        scoreboardList.innerHTML = scores.map((score, index) => {
            const rank = index + 1;
            const isCurrentUser = currentUser && score.userId === currentUser.uid;
            const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
            const date = score.date?.toDate ? score.date.toDate() : new Date(score.date);
            const dateStr = date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="score-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="score-rank ${rankClass}">${rank}</div>
                    <div class="score-info">
                        <div class="score-nickname">${score.nickname}</div>
                        <div class="score-date">${dateStr}</div>
                    </div>
                    <div class="score-value">${score.score.toLocaleString()}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('스코어보드 로드 오류:', error);
        scoreboardList.innerHTML = '<div class="empty-message">스코어를 불러오지 못했습니다.</div>';
    }
}

// 게임 시작
async function startGame() {
    // 로딩 화면 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;z-index:9999;background:white;padding:20px;border-radius:10px;';
    loadingDiv.textContent = '이미지 로딩 중...';
    document.body.appendChild(loadingDiv);

    // 이미지 프리로드
    const imageLoader = new ImageLoader();

    const success = await imageLoader.preloadAll();

    if (success) {
        loadingDiv.remove();
        console.log('✅ 게임 시작!');
        game = new Game(imageLoader);
        game.init();
    } else {
        loadingDiv.textContent = '이미지 로드 실패! 콘솔을 확인하세요.';
        loadingDiv.style.color = 'red';
    }
}

let isGameStarted = false;

onUserStateChange(async (user) => {
    currentUser = user;
    updateUserUI(user);

    // 로그인된 사용자가 있고 아직 게임이 시작되지 않았다면
    if (user && user.nickname && !isGameStarted) {
        isGameStarted = true;
        loginModal.style.display = 'none';
        nicknameModal.style.display = 'none';
        await startGame();
    } else if (!user && !isGameStarted) {
        // 로그인 안 된 경우 로그인 모달 표시
        loginModal.style.display = 'flex';
    }
});

// 초기 로드
if (document.readyState === 'loading') {
    console.log('⏳ DOM 로딩 대기 중...');
    document.addEventListener('DOMContentLoaded', () => {
    });
} else {
}

// game 인스턴스를 외부에서 접근 가능하도록 export
export { game, currentUser };