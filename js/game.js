import { CONFIG, CIRCLES, SPECIAL_CIRCLE_IMAGE } from './config.js';
import { createCircle, createSpecialCircle } from './entities.js';
import * as UI from './ui.js';
import { InputHandler } from './input.js';

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
    }

    init() {
        const container = document.getElementById('game-container');
        const legend = document.getElementById('evolution-legend');

        UI.initLegend(legend);

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
            console.log('🎨 Matter.js에 텍스처 등록 중...');

            // Render의 텍스처 캐시에 등록
            CIRCLES.forEach((circle, index) => {
                const img = images[`circle_${index}`];
                if (img) {
                    this.render.textures[circle.image] = img;
                    console.log(`✅ 텍스처 등록: circle_${index}`);
                }
            });

            const specialImg = images['special'];
            if (specialImg) {
                this.render.textures[SPECIAL_CIRCLE_IMAGE] = specialImg;
                console.log(`✅ 텍스처 등록: special`);
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
        this.generateNextCircle(); // Generate the first 'next'
        this.prepareNextTurn(); // Move 'next' to 'current' and generate new 'next'

        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
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
    }

    generateNextCircle() {
        // 10% Chance for Special
        if (Math.random() < 0.1) {
            this.nextCircleType = 'special';
            this.nextCircleIndex = 0;
        } else {
            this.nextCircleType = 'normal';
            this.nextCircleIndex = Math.floor(Math.random() * 3); // 0, 1, or 2
        }
    }

    prepareNextTurn() {
        if (this.gameOver) return;

        // Move Next to Current
        this.currentCircleType = this.nextCircleType;
        this.currentCircleIndex = this.nextCircleIndex;

        // Generate new Next
        this.generateNextCircle();

        this.updateUI();
        this.currentCircleBody = null;

        const container = document.getElementById('game-container');
        this.spawnCurrentCircle(container.clientWidth / 2);
    }

    spawnCurrentCircle(x) {
        if (this.currentCircleBody || this.gameOver) return;

        let body;
        if (this.currentCircleType === 'special') {
            body = createSpecialCircle(x, 90, true);
        } else {
            body = createCircle(x, 90, this.currentCircleIndex, true);
        }

        this.currentCircleBody = body;
        World.add(this.engine.world, this.currentCircleBody);
    }

    handleInputMove(x) {
        if (!this.currentCircleBody || !this.currentCircleBody.isStatic) return;

        const container = document.getElementById('game-container'); // Or passed in ctor
        const radius = this.currentCircleBody.circleRadius || (this.currentCircleIndex !== undefined ? CIRCLES[this.currentCircleIndex]?.radius : 15);
        const maxX = container.clientWidth - radius;
        const minX = radius;

        x = Math.max(minX, Math.min(x, maxX));
        Body.setPosition(this.currentCircleBody, { x: x, y: 90 });
    }

    handleInputDrop() {
        if (this.currentCircleBody && this.currentCircleBody.isStatic && !this.isDropping) {
            this.isDropping = true;
            this.lastDropTime = Date.now();

            Body.setStatic(this.currentCircleBody, false);
            this.currentCircleBody = null;

            setTimeout(() => {
                if (!this.gameOver) {
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

        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            const worldBodies = Composite.allBodies(this.engine.world);
            if (!worldBodies.includes(bodyA) || !worldBodies.includes(bodyB)) continue;

            const pairKey = `${Math.min(bodyA.id, bodyB.id)}-${Math.max(bodyA.id, bodyB.id)}`;
            if (processed.has(pairKey)) continue;
            processed.add(pairKey);

            if (bodyA.circleIndex !== undefined && bodyB.circleIndex !== undefined) {
                this.attemptMerge(bodyA, bodyB);
            }
        }
    }

    attemptMerge(bodyA, bodyB) {
        let shouldMerge = false;
        let newIndex = -1;

        if (bodyA.circleType === 'normal' && bodyB.circleType === 'normal') {
            if (bodyA.circleIndex === bodyB.circleIndex) {
                shouldMerge = true;
                newIndex = bodyA.circleIndex + 1;
            }
        }
        else if (bodyA.circleType === 'special' || bodyB.circleType === 'special') {
            if (bodyA.circleType === 'special' && bodyB.circleType === 'special') {
                shouldMerge = true;
                newIndex = Math.floor(Math.random() * 3) + 2;
            } else {
                const normalBody = bodyA.circleType === 'normal' ? bodyA : bodyB;
                if (normalBody.circleIndex < CIRCLES.length - 1) {
                    shouldMerge = true;
                    newIndex = normalBody.circleIndex + 1;
                }
            }
        }

        if (shouldMerge && newIndex >= 0 && newIndex < CIRCLES.length) {
            World.remove(this.engine.world, [bodyA, bodyB]);

            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            this.currentScore += CIRCLES[newIndex].score;
            this.updateUI();

            const newBody = createCircle(midX, midY, newIndex, false);
            World.add(this.engine.world, newBody);
        }
    }

    checkGameOver() {
        if (this.gameOver) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastCheckTime;
        this.lastCheckTime = currentTime;

        // 방금 드롭한 원은 1초 동안 게임오버 체크에서 제외
        const timeSinceLastDrop = currentTime - this.lastDropTime;
        if (timeSinceLastDrop < 1000) {
            this.dangerTimer = 0;
            return;
        }

        const bodies = Composite.allBodies(this.engine.world);
        let underThreat = false;

        for (const body of bodies) {
            if (!body.isStatic && body.circleRadius) {  // circleRadius로 원인지 체크
                if (body.position.y - body.circleRadius < CONFIG.DEADLINE_Y && body.speed < 0.5) {
                    underThreat = true;
                    break;
                }
            }
        }

        if (underThreat) {
            this.dangerTimer += deltaTime;  // 실제 경과 시간 사용
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
    }

    endGame() {
        this.gameOver = true;
        this.cleanup();
        UI.showGameOver(this.currentScore, () => location.reload());
    }

    cleanup() {
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
    }

    handleResize() {
        // Simple debounce
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.cleanup();
            location.reload();
        }, 300);
    }
}
