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
        nextPreview.style.backgroundSize = 'contain';
    } else {
        // Safety check
        if (CIRCLES[nextCircleIndex]) {
            nextPreview.style.backgroundImage = `url('${CIRCLES[nextCircleIndex].image}')`;
            nextPreview.style.backgroundSize = 'contain';
        }
    }
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
    const scoreBoard = document.getElementById('score-board');
    scoreBoard.innerHTML = `GAME OVER! Score: ${score}<br><span style="font-size:16px; color: red;">Click to Restart</span>`;
    scoreBoard.style.backgroundColor = 'rgba(255,255,255,0.9)';
    scoreBoard.style.padding = '10px';
    scoreBoard.style.borderRadius = '10px';

    const container = document.getElementById('game-container');
    container.onclick = (e) => {
        // Prevent click from propagating if needed, but here we just want reload/restart
        onRestart();
    };
}
