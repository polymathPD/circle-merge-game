// js/effects.js

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.init();
    }

    init() {
        // 파티클 전용 캔버스 생성
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
        `;
        
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.canvas);
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.ctx = this.canvas.getContext('2d');
        }

        this.animate();
    }

    // 파티클 생성 (합칠 때)
    createMergeParticles(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 4,
                color: color,
                alpha: 1,
                life: 1
            });
        }
    }

    // 수박 축하 효과
    createWatermelonCelebration(x, y) {
        // 많은 파티클로 축하 효과
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // 위로 올라가는 효과
                radius: 4 + Math.random() * 6,
                color: this.getRandomCelebrationColor(),
                alpha: 1,
                life: 1,
                gravity: 0.1
            });
        }

        // 축하 메시지 표시
        this.showCelebrationMessage();
    }

    getRandomCelebrationColor() {
        const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB', '#32CD32'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showCelebrationMessage() {
        const existingMsg = document.getElementById('celebration-message');
        if (existingMsg) {
            existingMsg.remove();
        }

        const message = document.createElement('div');
        message.id = 'celebration-message';
        message.innerHTML = '🎉 수박 완성! 🎉';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-size: 48px;
            font-weight: bold;
            color: #FF6347;
            text-shadow: 
                0 0 10px rgba(255, 255, 255, 0.8),
                0 0 20px rgba(255, 99, 71, 0.6),
                0 0 30px rgba(255, 99, 71, 0.4);
            z-index: 1000;
            pointer-events: none;
            animation: celebrationPop 2s ease-out forwards;
        `;

        document.body.appendChild(message);

        // 2초 후 제거
        setTimeout(() => {
            message.remove();
        }, 2000);
    }

    // 파티클 업데이트 및 렌더링
    animate() {
        if (!this.ctx) return;

        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 파티클 업데이트
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // 위치 업데이트
            p.x += p.vx;
            p.y += p.vy;

            // 중력 적용 (있는 경우)
            if (p.gravity) {
                p.vy += p.gravity;
            }

            // 수명 감소
            p.life -= 0.02;
            p.alpha = p.life;

            // 파티클 그리기
            if (p.life > 0) {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            } else {
                // 수명 다한 파티클 제거
                this.particles.splice(i, 1);
            }
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    // 정리
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas) {
            this.canvas.remove();
        }
        this.particles = [];
    }

    // 리사이즈 처리
    resize(width, height) {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }
}

// 싱글톤 인스턴스
let particleSystemInstance = null;

export function getParticleSystem() {
    if (!particleSystemInstance) {
        particleSystemInstance = new ParticleSystem();
    }
    return particleSystemInstance;
}

export function destroyParticleSystem() {
    if (particleSystemInstance) {
        particleSystemInstance.destroy();
        particleSystemInstance = null;
    }
}