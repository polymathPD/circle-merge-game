import { CONFIG, CIRCLES, SPECIAL_CIRCLE_IMAGE, BACKGROUNDS, VERSION } from './config.js';

export function initVersionBadge() {
    const existing = document.getElementById('version-badge');
    if (existing) existing.remove();

    const badge = document.createElement('div');
    badge.id = 'version-badge';
    badge.textContent = VERSION;

    const container = document.getElementById('game-container');
    if (container) container.appendChild(badge);
}

export function initLegend(container) {
    container.innerHTML = '';

    CIRCLES.forEach((c, index) => {
        const item = document.createElement('div');
        item.className = 'legend-item';

        const circle = document.createElement('div');
        circle.className = 'legend-circle';
        const scale = 0.3;
        const size = Math.min(32, c.radius * 2 * scale + 10);
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.backgroundImage = `url('${c.image}')`;
        circle.style.backgroundSize = 'contain';
        circle.style.backgroundRepeat = 'no-repeat';
        circle.style.backgroundPosition = 'center';

        item.appendChild(circle);

        if (index < CIRCLES.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'legend-arrow';
            arrow.innerHTML = '&#9654;';
            item.appendChild(arrow);
        }

        container.appendChild(item);
    });
}

export function updateHoldDisplay(holdType, holdIndex, hasUsedHold) {
    const preview = document.getElementById('hold-circle-preview');
    const container = document.getElementById('hold-container');
    if (!preview || !container) return;

    if (holdType === 'special') {
        preview.style.backgroundImage = `url('${SPECIAL_CIRCLE_IMAGE}')`;
        preview.style.backgroundSize = 'contain';
        preview.style.backgroundRepeat = 'no-repeat';
        preview.style.backgroundPosition = 'center';
        preview.style.backgroundColor = '';
    } else if (holdType === 'normal' && CIRCLES[holdIndex]) {
        preview.style.backgroundImage = `url('${CIRCLES[holdIndex].image}')`;
        preview.style.backgroundSize = 'contain';
        preview.style.backgroundRepeat = 'no-repeat';
        preview.style.backgroundPosition = 'center';
        preview.style.backgroundColor = '';
    } else {
        preview.style.backgroundImage = '';
        preview.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
    }

    container.classList.toggle('hold--used', hasUsedHold);
}

export function updateNextCirclePreview(nextCircleType, nextCircleIndex) {
    const nextPreview = document.getElementById('next-circle-preview');
    if (!nextPreview) return;

    if (nextCircleType === 'special') {
        nextPreview.style.backgroundImage = `url('${SPECIAL_CIRCLE_IMAGE}')`;
    } else if (CIRCLES[nextCircleIndex]) {
        nextPreview.style.backgroundImage = `url('${CIRCLES[nextCircleIndex].image}')`;
    }

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

    if (currentScore >= CONFIG.SCORE_MILESTONES[CONFIG.SCORE_MILESTONES.length - 1]) {
        currentMilestone = CONFIG.SCORE_MILESTONES[CONFIG.SCORE_MILESTONES.length - 1];
        nextMilestone = currentMilestone * 2;
    }

    const progress = ((currentScore - currentMilestone) / (nextMilestone - currentMilestone)) * 100;
    scoreBarFill.style.width = Math.min(100, progress) + '%';
    scoreBarText.innerText = `${currentScore} / ${nextMilestone}`;
}

// ✨ 배경 오버레이 초기화 (게임 시작 시 1회 호출)
export function initBackground() {
    const container = document.getElementById('game-container');
    if (!container || document.getElementById('bg-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'bg-overlay';
    // 강제로 초기 업데이트가 동작하도록 존재하지 않는 레벨로 초기화
    overlay.dataset.level = '-1';

    // game-container의 첫 번째 자식으로 삽입 → z-index 1로 배경 SVG를 대체
    container.insertBefore(overlay, container.firstChild);

    updateBackground(0);
}

// 현재 적용된 배경 레벨 추적 (모듈 스코프)
let _currentBgMinScore = -1;

// ✨ 점수에 따라 배경 업데이트
// updateUI()에서 매번 호출되지만, 실제 배경이 바뀔 때만 DOM 조작
export function updateBackground(score) {
    const overlay = document.getElementById('bg-overlay');
    if (!overlay) return;

    // 현재 점수에 해당하는 배경 찾기 (역순 탐색)
    let bg = BACKGROUNDS[0];
    for (let i = BACKGROUNDS.length - 1; i >= 0; i--) {
        if (score >= BACKGROUNDS[i].minScore) {
            bg = BACKGROUNDS[i];
            break;
        }
    }

    // 이미 같은 배경이면 아무것도 하지 않음
    if (_currentBgMinScore === bg.minScore) return;
    _currentBgMinScore = bg.minScore;

    // 배경 그라데이션 적용 (CSS transition이 부드럽게 처리)
    overlay.style.background = bg.background;

    // game-container에 테마 attribute 설정 → CSS로 텍스트 색상 자동 전환
    const container = document.getElementById('game-container');
    if (container) {
        container.dataset.theme = bg.textDark ? 'light' : 'dark';
    }

    // 배경 전환 라벨 표시 (초기 배경 제외)
    if (bg.label) {
        _showBackgroundLabel(bg.label);
    }
}

// ✨ 배경 전환 시 잠깐 표시되는 라벨 (내부 함수)
function _showBackgroundLabel(label) {
    const existing = document.getElementById('bg-label');
    if (existing) existing.remove();

    const container = document.getElementById('game-container');
    if (!container) return;

    const el = document.createElement('div');
    el.id = 'bg-label';
    el.textContent = label;
    el.style.cssText = `
        position: absolute;
        bottom: 70px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 150;
        pointer-events: none;
        animation: bgLabelFade 2.5s ease-out forwards;
    `;

    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

export function showGameOver(score, onRestart, isSaved = false) {
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
        ${isSaved ? '<p style="color: #666; margin-bottom: 20px;">점수가 저장되었습니다!</p>' : ''}
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

    document.getElementById('view-scoreboard-btn').onclick = () => {
        const showScoreboardBtn = document.getElementById('show-scoreboard-btn');
        if (showScoreboardBtn) showScoreboardBtn.click();
    };

    document.getElementById('restart-btn').onclick = () => {
        overlay.remove();
        onRestart();
    };
}