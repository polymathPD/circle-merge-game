// js/effects.js

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.specialCircles = []; // ✨ Special circle 추적
        this.time = 0; // ✨ 애니메이션 시간
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

    // ✨ Special circle 등록
    registerSpecialCircle(body) {
        if (!this.specialCircles.find(b => b.id === body.id)) {
            this.specialCircles.push(body);
            console.log('✨ Special circle 등록:', body.id);
        }
    }

    // ✨ Special circle 제거
    unregisterSpecialCircle(body) {
        const beforeLength = this.specialCircles.length;
        this.specialCircles = this.specialCircles.filter(b => b.id !== body.id);
        if (this.specialCircles.length < beforeLength) {
            console.log('✨ Special circle 제거:', body.id);
        }
    }

    // ✨ Special circle 커스텀 렌더링
    renderSpecialCircles() {
        if (!this.ctx) return;

        this.specialCircles.forEach(body => {
            const x = body.position.x;
            const y = body.position.y;
            const radius = body.circleRadius;

            // 1. 외부 광채 (펄스 효과)
            const glowRadius = radius + 8 + Math.sin(this.time * 0.003) * 4;
            const glowGradient = this.ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            glowGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.15)');
            glowGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. 회전하는 광선 (8개)
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(this.time * 0.001);
            
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                this.ctx.save();
                this.ctx.rotate(angle);
                
                const rayGradient = this.ctx.createLinearGradient(0, 0, 0, radius + 10);
                rayGradient.addColorStop(0, 'rgba(255, 255, 150, 0.4)');
                rayGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                this.ctx.fillStyle = rayGradient;
                this.ctx.beginPath();
                this.ctx.moveTo(-2, 0);
                this.ctx.lineTo(2, 0);
                this.ctx.lineTo(1, radius + 10);
                this.ctx.lineTo(-1, radius + 10);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.restore();
            }
            this.ctx.restore();

            // 3. 회전하는 별 (큰 별)
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(this.time * 0.0005);
            
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const outerRadius = radius * 0.5;
                const innerRadius = radius * 0.25;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                
                if (i === 0) {
                    this.ctx.moveTo(outerX, outerY);
                } else {
                    this.ctx.lineTo(outerX, outerY);
                }
                
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                this.ctx.lineTo(innerX, innerY);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'rgba(255, 248, 220, 0.3)';
            this.ctx.fill();
            this.ctx.restore();

            // 4. 반대로 회전하는 작은 별
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(-this.time * 0.001);
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const outerRadius = radius * 0.3;
                const innerRadius = radius * 0.15;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                
                if (i === 0) {
                    this.ctx.moveTo(outerX, outerY);
                } else {
                    this.ctx.lineTo(outerX, outerY);
                }
                
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                this.ctx.lineTo(innerX, innerY);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fill();
            this.ctx.restore();

            // 5. 깜빡이는 반짝임들 (4개 코너)
            const sparklePositions = [
                { x: -radius * 0.8, y: -radius * 0.8 },
                { x: radius * 0.8, y: -radius * 0.8 },
                { x: -radius * 0.8, y: radius * 0.8 },
                { x: radius * 0.8, y: radius * 0.8 }
            ];

            sparklePositions.forEach((pos, index) => {
                const sparkleTime = this.time + index * 500;
                const scale = 0.8 + Math.sin(sparkleTime * 0.003) * 0.4;
                const opacity = 0.5 + Math.sin(sparkleTime * 0.003) * 0.5;

                this.ctx.save();
                this.ctx.translate(x + pos.x, y + pos.y);
                this.ctx.scale(scale, scale);
                
                // 별 모양 반짝임
                this.ctx.fillStyle = `rgba(255, 255, 0, ${opacity})`;
                this.ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    const px = Math.cos(angle) * 4;
                    const py = Math.sin(angle) * 4;
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                // 십자 모양
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.8})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(-6, 0);
                this.ctx.lineTo(6, 0);
                this.ctx.moveTo(0, -6);
                this.ctx.lineTo(0, 6);
                this.ctx.stroke();
                
                this.ctx.restore();
            });

            // 6. 펄스 링
            const pulsePhase = (this.time * 0.002) % (Math.PI * 2);
            const ringRadius = radius + 4 + Math.sin(pulsePhase) * 6;
            const ringOpacity = 0.3 + Math.cos(pulsePhase) * 0.3;
            
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${ringOpacity})`;
            this.ctx.lineWidth = 2 + Math.sin(pulsePhase) * 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        });
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
        message.innerHTML = '🍉 수박 완성! 🍉';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-size: 11vw;
            font-weight: 900;
            color: #FF6347;
            white-space: nowrap;
            text-shadow: 
                0 0 10px rgba(255, 255, 255, 1),
                0 0 20px rgba(255, 99, 71, 0.8),
                0 0 30px rgba(255, 99, 71, 0.6),
                0 0 40px rgba(76, 175, 80, 0.4),
                3px 3px 0px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            pointer-events: none;
            animation: celebrationPop 2s ease-out forwards;
            letter-spacing: 0.05em;
            -webkit-text-stroke: 2px rgba(255, 255, 255, 0.5);
            text-stroke: 2px rgba(255, 255, 255, 0.5);
        `;

        document.body.appendChild(message);

        // 배경 플래시 효과 추가
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
            z-index: 999;
            pointer-events: none;
            animation: flashFade 1.5s ease-out forwards;
        `;
        document.body.appendChild(flash);

        // 애니메이션 키프레임 추가 (없으면)
        if (!document.getElementById('celebration-animations')) {
            const style = document.createElement('style');
            style.id = 'celebration-animations';
            style.textContent = `
                @keyframes celebrationPop {
                    0% {
                        transform: translate(-50%, -50%) scale(0) rotate(-10deg);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.3) rotate(5deg);
                        opacity: 1;
                    }
                    70% {
                        transform: translate(-50%, -50%) scale(0.95) rotate(-2deg);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                        opacity: 0;
                    }
                }
                
                @keyframes flashFade {
                    0% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 2초 후 제거
        setTimeout(() => {
            message.remove();
            flash.remove();
        }, 2000);
    }

    // ✨ 파티클 업데이트 및 렌더링 (시간 증가 추가)
    animate() {
        if (!this.ctx) return;

        // ✨ 시간 증가
        this.time += 16; // ~60fps 기준

        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // ✨ Special circle 효과 렌더링
        this.renderSpecialCircles();

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
        this.specialCircles = [];
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