import { CONFIG, CIRCLES, SPECIAL_CIRCLE_IMAGE } from './config.js';

export function initLegend(container) {
    container.innerHTML = '';

    CIRCLES.forEach((c, index) => {
        const item = document.createElement('div');
        item.className = 'legend-item';

        // Circle visual
        const circle = document.createElement('div');
        circle.className = 'legend-circle';
        // Scale down for legend? Say max 32px
        const scale = 0.3;
        const size = Math.min(32, c.radius * 2 * scale + 10); // min size ensures visibility
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.backgroundImage = `url('${c.image}')`;
        circle.style.backgroundSize = 'contain';
        circle.style.backgroundRepeat = 'no-repeat';
        circle.style.backgroundPosition = 'center';

        item.appendChild(circle);

        // Arrow if not last
        if (index < CIRCLES.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'legend-arrow';
            arrow.innerHTML = '&#9654;'; // Triangle arrow
            item.appendChild(arrow);
        }

        container.appendChild(item);
    });
}

export function updateNextCirclePreview(nextCircleType, nextCircleIndex) {
    const nextPreview = document.getElementById('next-circle-preview');
    if (!nextPreview) return;

    if (nextCircleType === 'special') {
        nextPreview.style.backgroundImage = `url('${SPECIAL_CIRCLE_IMAGE}')`;
    } else if (CIRCLES[nextCircleIndex]) {
        nextPreview.style.backgroundImage = `url('${CIRCLES[nextCircleIndex].image}')`;
    }

    // 공통 설정
    nextPreview.style.backgroundSize = 'contain';
    nextPreview.style.backgroundRepeat = 'no-repeat';
    nextPreview.style.backgroundPosition = 'center';
}

export function updateScoreDisplay(currentScore) {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.innerText = currentScore;
}

export function updateScoreBar(currentScore) {
    const scoreBarFill = document.getElementById('score-bar-fill');
    const scoreBarText = document.getElementById('score-bar-text');

    if (!scoreBarFill || !scoreBarText) return;

    // 현재 마일스톤 찾기
    let currentMilestone = 0;
    let nextMilestone = CONFIG.SCORE_MILESTONES[1];

    for (let i = 0; i < CONFIG.SCORE_MILESTONES.length - 1; i++) {
        if (currentScore >= CONFIG.SCORE_MILESTONES[i] &&
            currentScore < CONFIG.SCORE_MILESTONES[i + 1]) {
            currentMilestone = CONFIG.SCORE_MILESTONES[i];
            nextMilestone = CONFIG.SCORE_MILESTONES[i + 1];
            break;
        }
    }

    // 마지막 마일스톤 넘은 경우
    if (currentScore >= CONFIG.SCORE_MILESTONES[CONFIG.SCORE_MILESTONES.length - 1]) {
        currentMilestone = CONFIG.SCORE_MILESTONES[CONFIG.SCORE_MILESTONES.length - 1];
        nextMilestone = currentMilestone * 2;
    }

    // 진행률 계산
    const progress = ((currentScore - currentMilestone) / (nextMilestone - currentMilestone)) * 100;
    scoreBarFill.style.width = Math.min(100, progress) + '%';

    // 텍스트 업데이트
    scoreBarText.innerText = `${currentScore} / ${nextMilestone}`;
}

export function showGameOver(score, onRestart) {
    // 게임 오버 시 화면을 어둡게 처리
    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 500;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const gameOverBox = document.createElement('div');
    gameOverBox.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
    `;

    gameOverBox.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #333; font-size: 28px;">게임 오버!</h2>
        <div style="font-size: 48px; font-weight: bold; color: #4CAF50; margin: 20px 0;">
            ${score.toLocaleString()}
        </div>
        <p style="color: #666; margin-bottom: 20px;">점수가 저장되었습니다!</p>
        <button id="view-scoreboard-btn" style="
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 10px;
        ">🏆 랭킹 보기</button>
        <button id="restart-btn" style="
            width: 100%;
            padding: 15px;
            background: #f0f0f0;
            color: #333;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        ">🔄 다시 시작</button>
    `;

    overlay.appendChild(gameOverBox);
    document.body.appendChild(overlay);

    // 랭킹 보기 버튼
    document.getElementById('view-scoreboard-btn').onclick = () => {
        const showScoreboardBtn = document.getElementById('show-scoreboard-btn');
        if (showScoreboardBtn) {
            showScoreboardBtn.click();
        }
    };

    // 재시작 버튼
    document.getElementById('restart-btn').onclick = () => {
        overlay.remove();
        onRestart();
    };
}