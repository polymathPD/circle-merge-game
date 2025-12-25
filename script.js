const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

// Game Configuration
const CONFIG = {
    WALL_THICKNESS: 50,
    PHYSICS: {
        gravity: 1.5,
        restitution: 0.6 // Bouncy!
    },
    DEADLINE_Y: 150,
    LEGEND_HEIGHT: 60 // Must match CSS
};

// Circle Definitions
const CIRCLES = [
    { radius: 15, color: '#FFD700', score: 10 },
    { radius: 25, color: '#FF6347', score: 20 },
    { radius: 35, color: '#9370DB', score: 40 },
    { radius: 45, color: '#1E90FF', score: 80 },
    { radius: 60, color: '#32CD32', score: 160 },
    { radius: 75, color: '#FF4500', score: 320 },
    { radius: 90, color: '#FFD700', score: 640 },
    { radius: 110, color: '#C71585', score: 1280 },
    { radius: 130, color: '#8A2BE2', score: 2560 },
    { radius: 150, color: '#00FA9A', score: 5120 }
];

// State
let engine, render, runner;
let currentScore = 0;
let nextCircleIndex = 0;
let nextCircleType = 'normal'; // 'normal' | 'special'
let isInteracting = false;
let currentCircleBody = null;
let gameOver = false;
let resizeTimeout = null;

function init() {
    const container = document.getElementById('game-container');
    const legend = document.getElementById('evolution-legend');

    // Populate legend first
    initLegend(legend);

    // Robust height calculation for mobile
    // Use window.innerHeight to avoid any container scaling issues
    const totalHeight = window.innerHeight;
    const legendHeight = legend.offsetHeight || CONFIG.LEGEND_HEIGHT;

    const width = container.clientWidth;
    // Force physics world to fit exactly inside (Viewport - Legend)
    const height = totalHeight - legendHeight;

    // 1. Setup Matter
    engine = Engine.create();
    engine.world.gravity.y = CONFIG.PHYSICS.gravity;

    render = Render.create({
        element: container,
        engine: engine,
        canvas: document.getElementById('game-canvas'),
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio
        }
    });

    // 2. Create Boundaries
    const floor = Bodies.rectangle(width / 2, height + CONFIG.WALL_THICKNESS / 2 - 10, width, CONFIG.WALL_THICKNESS, {
        isStatic: true,
        render: { fillStyle: '#333' },
        label: 'floor'
    });
    const leftWall = Bodies.rectangle(0 - CONFIG.WALL_THICKNESS / 2, height / 2, CONFIG.WALL_THICKNESS, height * 2, {
        isStatic: true,
        render: { fillStyle: '#333' },
        label: 'wall'
    });
    const rightWall = Bodies.rectangle(width + CONFIG.WALL_THICKNESS / 2, height / 2, CONFIG.WALL_THICKNESS, height * 2, {
        isStatic: true,
        render: { fillStyle: '#333' },
        label: 'wall'
    });

    World.add(engine.world, [floor, leftWall, rightWall]);

    // 3. Collision Logic
    Events.on(engine, 'collisionStart', handleCollisions);

    // 4. Game Over Logic
    Events.on(engine, 'afterUpdate', checkGameOver);

    // 5. Custom Rendering (Deadline)
    Events.on(render, 'afterRender', function () {
        if (!render.context) return;
        const ctx = render.context;
        const width = render.canvas.width;

        ctx.beginPath();
        ctx.moveTo(0, CONFIG.DEADLINE_Y);
        ctx.lineTo(width, CONFIG.DEADLINE_Y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = '12px Arial';
        ctx.fillText('DEADLINE', 5, CONFIG.DEADLINE_Y - 5);
    });

    // 6. Run
    Runner.run(engine);
    Render.run(render);

    // 7. Inputs & Game Loop
    setupInputs(container);
    prepareNextTurn();

    const handleResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            cleanup();
            location.reload();
        }, 300); // 300ms 디바운스
    };

    window.addEventListener('resize', handleResize);
}

// 정리 함수 추가
function cleanup() {
    if (engine) {
        Events.off(engine, 'collisionStart');
        Events.off(engine, 'afterUpdate');
        Engine.clear(engine);
    }
    if (render) {
        Events.off(render, 'afterRender');
        Render.stop(render);
        render.canvas.remove();
        render.canvas = null;
        render.context = null;
    }
    if (runner) {
        Runner.stop(runner);
    }
}

let dangerTimer = 0;
function checkGameOver() {
    if (gameOver) return;

    const bodies = Composite.allBodies(engine.world);
    const deadLine = CONFIG.DEADLINE_Y;

    let underThreat = false;
    for (const body of bodies) {
        // Ignore walls, static aiming body
        if (!body.isStatic && body !== currentCircleBody) {
            // Only count as 'danger' if it's near the top AND moving slowly (stuck)
            if (body.position.y - CIRCLES[body.circleIndex]?.radius < deadLine && body.speed < 0.5) {
                underThreat = true;
                break;
            }
        }
    }

    if (underThreat) {
        dangerTimer += 16.6;
        if (dangerTimer > 2000) {
            endGame();
        }
    } else {
        dangerTimer = 0;
    }
}

// 게임오버 시에도 cleanup 호출
function endGame() {
    gameOver = true;
    cleanup(); // 이벤트 리스너 정리

    const scoreBoard = document.getElementById('score-board');
    scoreBoard.innerHTML = `GAME OVER! Score: ${currentScore}<br><span style="font-size:16px; color: red;">Click to Restart</span>`;
    scoreBoard.style.backgroundColor = 'rgba(255,255,255,0.9)';
    scoreBoard.style.padding = '10px';
    scoreBoard.style.borderRadius = '10px';

    document.getElementById('game-container').onclick = () => location.reload();
}

function handleCollisions(event) {
    if (gameOver) return;

    const pairs = event.pairs;
    const processed = new Set(); // ID 대신 처리된 쌍을 추적

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // 이미 world에 없는 body는 스킵
        const worldBodies = Composite.allBodies(engine.world);
        if (!worldBodies.includes(bodyA) || !worldBodies.includes(bodyB)) continue;

        // Skip if already processed
        const pairKey = `${Math.min(bodyA.id, bodyB.id)}-${Math.max(bodyA.id, bodyB.id)}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        // Check if both are circles
        if (bodyA.circleIndex !== undefined && bodyB.circleIndex !== undefined) {
            attemptMerge(bodyA, bodyB);
        }
    }
}

function attemptMerge(bodyA, bodyB) {
    let shouldMerge = false;
    let newIndex = -1;

    // 1. Same Type Merge (Normal + Normal)
    if (bodyA.circleType === 'normal' && bodyB.circleType === 'normal') {
        if (bodyA.circleIndex === bodyB.circleIndex) {
            shouldMerge = true;
            newIndex = bodyA.circleIndex + 1;
        }
    }
    // 2. Special Interaction (Wildcard)
    else if (bodyA.circleType === 'special' || bodyB.circleType === 'special') {
        shouldMerge = true;
        // Two specials -> Random but LIMITED
        if (bodyA.circleType === 'special' && bodyB.circleType === 'special') {
            newIndex = Math.floor(Math.random() * 3) + 2; // 2~4 인덱스로 제한 (원래는 4~6)
        }
            // Special + Normal -> Normal + 1 (상한 체크)
        else if (bodyA.circleType === 'special') {
            newIndex = Math.min(CIRCLES.length - 1, bodyB.circleIndex + 1);
        } else {
            newIndex = Math.min(CIRCLES.length - 1, bodyA.circleIndex + 1);
        }
    }

    // 최종 안전장치: newIndex가 배열 범위를 벗어나지 않도록
    if (shouldMerge && newIndex >= 0 && newIndex < CIRCLES.length) {
        World.remove(engine.world, [bodyA, bodyB]);

        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;

        currentScore += CIRCLES[newIndex].score;
        updateUI();

        const newBody = createCircle(midX, midY, newIndex, false);
        World.add(engine.world, newBody);
    }
}

function createCircle(x, y, index, isStatic) {
    const config = CIRCLES[index] || CIRCLES[CIRCLES.length - 1];

    const density = 0.001 + (index * 0.0005);

    const body = Bodies.circle(x, y, config.radius, {
        isStatic: isStatic,
        render: {
            fillStyle: config.color,
            strokeStyle: '#222',
            lineWidth: 1
        },
        restitution: CONFIG.PHYSICS.restitution,
        friction: 0.1,
        density: density
    });

    body.circleIndex = index;
    body.circleType = 'normal';
    body.circleRadius = config.radius; // ✅ 추가

    return body;
}

function createSpecialCircle(x, y, isStatic) {
    // Special is small, like index 0 size
    const radius = CIRCLES[0].radius;

    const body = Bodies.circle(x, y, radius, {
        isStatic: isStatic,
        render: {
            fillStyle: '#000', // Distinct look
            strokeStyle: '#FFF',
            lineWidth: 3
        },
        restitution: Math.min(1.0, CONFIG.PHYSICS.restitution + 0.2)
    });

    body.circleIndex = 0; // Dummy index
    body.circleType = 'special';
    body.circleRadius = radius; // ✅ body 생성 후 속성 추가

    return body;
}

function prepareNextTurn() {
    if (gameOver) return;

    // 10% Chance for Special
    if (Math.random() < 0.1) {
        nextCircleType = 'special';
        nextCircleIndex = 0;
    } else {
        nextCircleType = 'normal';
        nextCircleIndex = Math.floor(Math.random() * 3); // 0, 1, or 2
    }

    updateUI();
    isInteracting = false;
    currentCircleBody = null;

    const container = document.getElementById('game-container');
    spawnCurrentCircle(container.clientWidth / 2);
}

function spawnCurrentCircle(x) {
    if (currentCircleBody || gameOver) return;

    let body;
    if (nextCircleType === 'special') {
        body = createSpecialCircle(x, 50, true);
    } else {
        body = createCircle(x, 50, nextCircleIndex, true);
    }

    currentCircleBody = body;
    World.add(engine.world, currentCircleBody);
}

function updateUI() {
    const nextPreview = document.getElementById('next-circle-preview');
    if (nextCircleType === 'special') {
        nextPreview.style.background = 'radial-gradient(circle at 30% 30%, #555, #000)';
    } else {
        nextPreview.style.background = CIRCLES[nextCircleIndex].color;
    }
    document.getElementById('score').innerText = currentScore;
}

function setupInputs(container) {
    let isTouching = false; // 터치 진행 중인지 추적

    const updatePos = (x) => {
        if (!currentCircleBody || !currentCircleBody.isStatic) return;

        const radius = currentCircleBody.circleRadius || CIRCLES[nextCircleIndex]?.radius || 15;
        const maxX = container.clientWidth - radius;
        const minX = radius;
        x = Math.max(minX, Math.min(x, maxX));

        Body.setPosition(currentCircleBody, { x: x, y: 50 });
    };

    const drop = () => {
        if (currentCircleBody && currentCircleBody.isStatic) {
            Body.setStatic(currentCircleBody, false);
            const droppedBody = currentCircleBody;
            currentCircleBody = null;

            setTimeout(() => {
                if (!gameOver) prepareNextTurn();
            }, 800);
        }
    };

    // Mouse (터치 중일 때는 무시)
    container.addEventListener('mousemove', e => {
        if (isTouching) return; // 터치 중이면 무시
        if (e.buttons === 1) updatePos(e.offsetX);
    });

    container.addEventListener('mousedown', e => {
        if (isTouching) return;
        updatePos(e.offsetX);
    });

    window.addEventListener('mouseup', e => {
        if (isTouching) return;
        drop();
    });

    // Touch
    container.addEventListener('touchstart', e => {
        e.preventDefault();
        isTouching = true;
        const rect = container.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        updatePos(x);
    }, { passive: false });

    container.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!isTouching) return;
        const rect = container.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        updatePos(x);
    }, { passive: false });

    window.addEventListener('touchend', e => {
        if (!isTouching) return;
        drop();
        // 터치 종료 후 약간의 지연을 두고 플래그 해제 (마우스 이벤트 방지)
        setTimeout(() => {
            isTouching = false;
        }, 300);
    });
}

function initLegend(container) {
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
        circle.style.backgroundColor = c.color;

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

// Init
init();
