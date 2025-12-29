import { Game } from './game.js';
import { ImageLoader } from './imageLoader.js';

// ← 🆕 즉시 실행 로그
console.log('🔵 main.js 모듈 로드됨!');

async function startGame() {
    console.log('🟢 startGame 함수 실행!');

    // 로딩 화면 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;z-index:9999;background:white;padding:20px;border-radius:10px;';
    loadingDiv.textContent = '이미지 로딩 중...';
    document.body.appendChild(loadingDiv);

    // 이미지 프리로드
    console.log('🟡 ImageLoader 생성');
    const imageLoader = new ImageLoader();

    console.log('🟠 preloadAll 호출');
    const success = await imageLoader.preloadAll();
    console.log('🟠 preloadAll 결과:', success);

    if (success) {
        loadingDiv.remove();
        console.log('✅ 게임 시작!');
        const game = new Game(imageLoader);
        game.init();
    } else {
        loadingDiv.textContent = '이미지 로드 실패! 콘솔을 확인하세요.';
        loadingDiv.style.color = 'red';
    }
}

// DOMContentLoaded 또는 이미 로드됨
if (document.readyState === 'loading') {
    console.log('⏳ DOM 로딩 대기 중...');
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    console.log('✅ DOM 이미 로드됨, 즉시 시작');
    startGame();
}