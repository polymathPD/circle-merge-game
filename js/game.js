import { CONFIG, CIRCLES, SPECIAL_CIRCLE_IMAGE } from './config.js';
import { createCircle, createSpecialCircle } from './entities.js';
import * as UI from './ui.js';
import { InputHandler } from './input.js';
import { getParticleSystem, destroyParticleSystem } from './effects.js';

const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = window.Matter;

export class Game {
    constructor(imageLoader) {
        this.imageLoader = imageLoader;
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.currentScore = 0;
        this.nextCircleIndex = 0;
        this.nextCircleType = 'normal';
        this.currentCircleIndex = 0;
        this.currentCircleType = 'normal';
        this.currentCircleBody = null;
        this.gameOver = false;
        this.dangerTimer = 0;
        this.collisionHandler = (e) => this.handleCollisions(e);
        this.gameOverHandler = () => this.checkGameOver();
        this.deadlineHandler = () => this.drawDeadline();
        this.isDropping = false;
        this.lastCheckTime = Date.now();
        this.lastDropTime = 0;
        this.particleSystem = getParticleSystem();

        // ✨ Special circle 관리 변수
        this.maxReachedIndex = 0;
        this.turnsSinceLastSpecial = 0;
        this.totalTurns = 0;

        // ✨ 콤보 시스템 변수
        this.comboCount = 0;          // 현재 콤보 횟수
        this.comboResetTimer = null;  // 콤보 리셋 타이머
        this.lastMergeTime = 0;       // 마지막 합체 시각
    }

    init() {
        const container = document.getElementById('game-container');
        const legend = document.getElementById('evolution-legend');

        UI.initLegend(legend);
        UI.initVersionBadge();
        // ✨ 배경 오버레이 초기화
        UI.initBackground();

        // Dimensions
        const totalHeight = window.innerHeight;
        const legendHeight = legend.offsetHeight || CONFIG.LEGEND_HEIGHT;
        const width = container.clientWidth;
        const height = totalHeight - legendHeight;

        // Matter Setup
        this.engine = Engine.create({
            enableSleeping: false,
            positionIterations: 8,
            velocityIterations: 8
        });
        this.engine.world.gravity.y = CONFIG.PHYSICS.gravity;

        this.render = Render.create({
            element: container,
            engine: this.engine,
            canvas: document.getElementById('game-canvas'),
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio
            }
        });

        if (this.imageLoader && this.imageLoader.loaded) {
            const images = this.imageLoader.getAllImages();

            CIRCLES.forEach((circle, index) => {
                const img = images[`circle_${index}`];
                if (img) {
                    this.render.textures[circle.image] = img;
                }
            });

            const specialImg = images['special'];
            if (specialImg) {
                this.render.textures[SPECIAL_CIRCLE_IMAGE] = specialImg;
            }
        }

        // Boundaries
        this.createBoundaries(width, height);

        Events.on(this.engine, 'collisionStart', this.collisionHandler);
        Events.on(this.engine, 'afterUpdate', this.gameOverHandler);
        Events.on(this.render, 'afterRender', this.deadlineHandler);

        // Run
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
        Render.run(this.render);

        // Input
        this.inputHandler = new InputHandler(container, {
            onMove: (x) => this.handleInputMove(x),
            onDrop: () => this.handleInputDrop()
        });

        // Start
        this.generateNextCircle();
        this.prepareNextTurn();

        // Orientation
        this.currentOrientation = this.getOrientation();

        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    createBoundaries(width, height) {
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

        World.add(this.engine.world, [floor, leftWall, rightWall]);
    }

    drawDeadline() {
        if (!this.render.context) return;
        const ctx = this.render.context;
        const width = this.render.canvas.width;

        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, CONFIG.DEADLINE_Y);

        ctx.beginPath();
        ctx.moveTo(0, CONFIG.DEADLINE_Y);
        ctx.lineTo(width, CONFIG.DEADLINE_Y);
        ctx.strokeStyle = '#FF5252';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 82, 82, 0.9)';
        ctx.fillRect(5, CONFIG.DEADLINE_Y - 18, 70, 16);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('DEADLINE', 10, CONFIG.DEADLINE_Y - 7);
    }

    generateNextCircle() {
        const canSpawnSpecial =
            this.maxReachedIndex >= CONFIG.SPECIAL.MIN_LEVEL &&
            this.turnsSinceLastSpecial >= CONFIG.SPECIAL.COOLDOWN_TURNS;

        if (canSpawnSpecial && Math.random() < CONFIG.SPECIAL.PROBABILITY) {
            this.nextCircleType = 'special';
            this.nextCircleIndex = 0;
            console.log('✨ Special circle 생성! (턴:', this.totalTurns, ', 최고 레벨:', this.maxReachedIndex, ')');
        } else {
            this.nextCircleType = 'normal';
            this.nextCircleIndex = Math.floor(Math.random() * 3);
        }
    }

    prepareNextTurn() {
        if (this.gameOver) return;

        this.currentCircleType = this.nextCircleType;
        this.currentCircleIndex = this.nextCircleIndex;

        if (this.currentCircleType === 'special') {
            this.turnsSinceLastSpecial = 0;
        } else {
            this.turnsSinceLastSpecial++;
        }

        this.totalTurns++;

        this.generateNextCircle();
        this.updateUI();
        this.currentCircleBody = null;

        const container = document.getElementById('game-container');
        this.spawnCurrentCircle(container.clientWidth / 2);
    }

    spawnCurrentCircle(x) {
        if (this.currentCircleBody || this.gameOver) return;

        let body;
        const spawnY = CONFIG.SPAWN_Y;

        if (this.currentCircleType === 'special') {
            body = createSpecialCircle(x, spawnY, true);
            this.particleSystem.registerSpecialCircle(body);
        } else {
            body = createCircle(x, spawnY, this.currentCircleIndex, true);
        }

        this.currentCircleBody = body;
        World.add(this.engine.world, this.currentCircleBody);
    }

    handleInputMove(x) {
        if (!this.currentCircleBody || !this.currentCircleBody.isStatic) return;

        const container = document.getElementById('game-container');
        const radius = this.currentCircleBody.circleRadius || (this.currentCircleIndex !== undefined ? CIRCLES[this.currentCircleIndex]?.radius : 15);
        const maxX = container.clientWidth - radius;
        const minX = radius;

        x = Math.max(minX, Math.min(x, maxX));
        Body.setPosition(this.currentCircleBody, { x: x, y: CONFIG.SPAWN_Y });
    }

    handleInputDrop() {
        if (this.currentCircleBody && this.currentCircleBody.isStatic && !this.isDropping) {
            this.isDropping = true;
            this.lastDropTime = Date.now();

            this.comboCount = 0;
            this.lastMergeTime = 0;
            Body.setStatic(this.currentCircleBody, false);
            this.currentCircleBody = null;

            setTimeout(() => {
                if (!this.gameOver && this.engine) {
                    this.prepareNextTurn();
                    this.isDropping = false;
                }
            }, 800);
        }
    }

    handleCollisions(event) {
        if (this.gameOver) return;

        const pairs = event.pairs;
        const processed = new Set();

        const worldBodySet = new Set(Composite.allBodies(this.engine.world));

        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            if (!worldBodySet.has(bodyA) || !worldBodySet.has(bodyB)) continue;

            const pairKey = `${Math.min(bodyA.id, bodyB.id)}-${Math.max(bodyA.id, bodyB.id)}`;
            if (processed.has(pairKey)) continue;
            processed.add(pairKey);

            if (bodyA.circleIndex !== undefined && bodyB.circleIndex !== undefined) {
                this.attemptMerge(bodyA, bodyB);
            }
        }
    }

    attemptMerge(bodyA, bodyB) {
        if (bodyA.toRemove || bodyB.toRemove) return;
        // 아직 들고 있는(static) 원은 합체 대상에서 제외
        if (bodyA.isStatic || bodyB.isStatic) return;
        let shouldMerge = false;
        let newIndex = -1;

        if (bodyA.circleType === 'normal' && bodyB.circleType === 'normal') {
            if (bodyA.circleIndex === bodyB.circleIndex) {
                shouldMerge = true;
                newIndex = bodyA.circleIndex + 1;
            }
        } else if (bodyA.circleType === 'special' || bodyB.circleType === 'special') {
            if (bodyA.circleType === 'special' && bodyB.circleType === 'special') {
                return;
            } else {
                const normalBody = bodyA.circleType === 'normal' ? bodyA : bodyB;
                if (normalBody.circleIndex < CIRCLES.length - 1) {
                    shouldMerge = true;
                    newIndex = normalBody.circleIndex + 1;
                }
            }
        }

        if (shouldMerge && newIndex >= 0 && newIndex < CIRCLES.length) {
            // ✨ 최고 도달 레벨 업데이트
            if (newIndex > this.maxReachedIndex) {
                this.maxReachedIndex = newIndex;
                console.log('🎯 새로운 최고 레벨 달성:', newIndex, CIRCLES[newIndex].score);
            }

            // ✨ Special circle 제거 시 등록 해제
            if (bodyA.circleType === 'special') this.particleSystem.unregisterSpecialCircle(bodyA);
            if (bodyB.circleType === 'special') this.particleSystem.unregisterSpecialCircle(bodyB);

            bodyA.toRemove = true;
            bodyB.toRemove = true;
            World.remove(this.engine.world, [bodyA, bodyB]);

            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            const newCircle = CIRCLES[newIndex];
            const particleColor = this.getColorFromImage(newCircle.image) || '#4CAF50';
            this.particleSystem.createMergeParticles(midX, midY, particleColor, 15);

            if (newIndex === CIRCLES.length - 1) {
                this.particleSystem.createWatermelonCelebration(midX, midY);
            }

            // ✨ 콤보 처리
            const now = Date.now();
            if (this.comboCount > 0 && now - this.lastMergeTime < CONFIG.COMBO.WINDOW) {
                // 콤보 연속
                this.comboCount++;
            } else {
                // 새 콤보 시작
                this.comboCount = 1;
            }
            this.lastMergeTime = now;

            // 콤보 리셋 타이머 갱신
            if (this.comboResetTimer) clearTimeout(this.comboResetTimer);
            this.comboResetTimer = setTimeout(() => {
                this.comboCount = 0;
            }, CONFIG.COMBO.WINDOW);

            // ✨ 콤보 배율 점수 계산
            const baseScore = CIRCLES[newIndex].score;
            const multiplier = this.comboCount >= 2
                ? Math.min(CONFIG.COMBO.MAX_MULTIPLIER, 1 + (this.comboCount - 1) * CONFIG.COMBO.MULTIPLIER_STEP)
                : 1;
            const actualScore = Math.floor(baseScore * multiplier);

            this.currentScore += actualScore;
            this.updateUI();

            // ✨ 콤보 2 이상일 때 메시지 표시
            if (this.comboCount >= 2) {
                this.particleSystem.showComboMessage(this.comboCount, actualScore, midX, midY);
            }

            const newBody = createCircle(midX, midY, newIndex, false);
            World.add(this.engine.world, newBody);
        }
    }

    checkGameOver() {
        if (this.gameOver) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastCheckTime;
        this.lastCheckTime = currentTime;

        const timeSinceLastDrop = currentTime - this.lastDropTime;
        if (timeSinceLastDrop < 1000) {
            this.dangerTimer = 0;
            return;
        }

        // Grace period after merge — new circle needs time to settle in physics
        const timeSinceLastMerge = currentTime - this.lastMergeTime;
        if (this.lastMergeTime > 0 && timeSinceLastMerge < 1500) {
            this.dangerTimer = 0;
            return;
        }

        const bodies = Composite.allBodies(this.engine.world);
        let underThreat = false;

        for (const body of bodies) {
            if (!body.isStatic && body.circleRadius) {
                if (body.position.y - body.circleRadius < CONFIG.DEADLINE_Y && body.speed < 0.5) {
                    underThreat = true;
                    break;
                }
            }
        }

        if (underThreat) {
            this.dangerTimer += deltaTime;
            if (this.dangerTimer > 2000) {
                this.endGame();
            }
        } else {
            this.dangerTimer = 0;
        }
    }

    updateUI() {
        UI.updateScoreDisplay(this.currentScore);
        UI.updateNextCirclePreview(this.nextCircleType, this.nextCircleIndex);
        UI.updateScoreBar(this.currentScore);
        // ✨ 점수 변경마다 배경 체크 (변경 시에만 실제 DOM 조작)
        UI.updateBackground(this.currentScore);
    }

    async endGame() {
        this.gameOver = true;
        this.cleanup();

        let scoreSaved = false;
        const { currentUser, isLocalMode } = await import('./main.js');
        if (!isLocalMode) {
            const { saveScore } = await import('./scoreboard.js');
            if (currentUser && currentUser.nickname) {
                try {
                    await saveScore(currentUser.uid, currentUser.nickname, this.currentScore);
                    scoreSaved = true;
                    console.log('✅ 점수 저장 완료:', this.currentScore);
                } catch (error) {
                    console.error('❌ 점수 저장 실패:', error);
                }
            }
        }

        UI.showGameOver(this.currentScore, () => location.reload(), scoreSaved);
    }

    cleanup() {
        // ✨ 콤보 타이머 정리
        if (this.comboResetTimer) clearTimeout(this.comboResetTimer);

        if (this.engine) {
            Events.off(this.engine, 'collisionStart', this.collisionHandler);
            Events.off(this.engine, 'afterUpdate', this.gameOverHandler);
        }
        if (this.render) {
            Events.off(this.render, 'afterRender', this.deadlineHandler);
        }

        if (this.engine) {
            World.clear(this.engine.world);
            Engine.clear(this.engine);
        }
        if (this.render) {
            Render.stop(this.render);
            if (this.render.canvas) this.render.canvas.remove();
        }
        if (this.runner) {
            Runner.stop(this.runner);
        }

        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }

        destroyParticleSystem();
    }

    handleResize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.cleanup();
            location.reload();
        }, 300);
    }

    getColorFromImage(imagePath) {
        const colorMap = {
            'circle_0_grape.svg': '#8B7DB8',
            'circle_1_strawberry.svg': '#FF6B9D',
            'circle_2_kiwi.svg': '#8BC34A',
            'circle_3_lemon.svg': '#FFF176',
            'circle_4_tomato.svg': '#FF5252',
            'circle_5_orange.svg': '#FF9800',
            'circle_6_peach.svg': '#FFCCBC',
            'circle_7_apple.svg': '#F44336',
            'circle_8_melon.svg': '#C8E6C9',
            'circle_9_watermelon.svg': '#4CAF50'
        };

        const filename = imagePath.split('/').pop();
        return colorMap[filename] || '#4CAF50';
    }
}