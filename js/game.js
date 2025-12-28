import { CONFIG, CIRCLES } from './config.js';
import { createCircle, createSpecialCircle } from './entities.js';
import * as UI from './ui.js';
import { InputHandler } from './input.js';

const { Engine, Render, Runner, World, Bodies, Body, Events, Composite, Sleeping } = window.Matter;

export class Game {
    constructor() {
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
            enableSleeping: true // Allow bodies to rest
        });
        this.engine.positionIterations = 8; // Default 6
        this.engine.velocityIterations = 8; // Default 4
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

        // Boundaries
        this.createBoundaries(width, height);

        // Collision Logic
        Events.on(this.engine, 'collisionStart', (e) => this.handleCollisions(e));

        // Game Over Logic
        Events.on(this.engine, 'afterUpdate', () => this.checkGameOver());

        // Custom Render (Deadline)
        Events.on(this.render, 'afterRender', () => this.drawDeadline());

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
        if (this.currentCircleBody && this.currentCircleBody.isStatic) {
            Body.setStatic(this.currentCircleBody, false);
            Sleeping.set(this.currentCircleBody, false); // Force wake up
            this.currentCircleBody = null;

            setTimeout(() => {
                if (!this.gameOver) this.prepareNextTurn();
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
            shouldMerge = true;
            if (bodyA.circleType === 'special' && bodyB.circleType === 'special') {
                newIndex = Math.floor(Math.random() * 3) + 2;
            }
            else if (bodyA.circleType === 'special') {
                // Check if target is max level
                if (bodyB.circleIndex === CIRCLES.length - 1) {
                    shouldMerge = false;
                } else {
                    newIndex = Math.min(CIRCLES.length - 1, bodyB.circleIndex + 1);
                }
            } else {
                // Check if target is max level
                if (bodyA.circleIndex === CIRCLES.length - 1) {
                    shouldMerge = false;
                } else {
                    newIndex = Math.min(CIRCLES.length - 1, bodyA.circleIndex + 1);
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

        const bodies = Composite.allBodies(this.engine.world);
        let underThreat = false;

        for (const body of bodies) {
            if (!body.isStatic && body !== this.currentCircleBody) {
                // If circle is above deadline
                if (body.position.y - (body.circleRadius || 15) < CONFIG.DEADLINE_Y && body.speed < 0.5) {
                    underThreat = true;
                    break;
                }
            }
        }

        if (underThreat) {
            this.dangerTimer += 16.6;
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
            Events.off(this.engine);
            const bodies = Composite.allBodies(this.engine.world);
            World.clear(this.engine.world);
            Engine.clear(this.engine);
        }
        if (this.render) {
            Events.off(this.render);
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
