import { CONFIG, CIRCLES, SPECIAL_CIRCLE_IMAGE } from './config.js';

const Bodies = window.Matter.Bodies;

export function createCircle(x, y, index, isStatic) {
    // Safety check for index
    const config = CIRCLES[index] || CIRCLES[CIRCLES.length - 1];

    const density = 0.001 + (index * 0.0005);

    const restitutionMultiplier = index < 3 ? 0.35 : 1.0;
    const restitution = CONFIG.PHYSICS.restitution * restitutionMultiplier;

    const body = Bodies.circle(x, y, config.radius, {
        isStatic: isStatic,
        render: {
            sprite: {
                texture: config.image,
                xScale: (config.radius * 2) / 100, // Assets are 100x100
                yScale: (config.radius * 2) / 100
            },
            fillStyle: config.color, // Fallback
            strokeStyle: '#222',
            lineWidth: 1
        },
        restitution: restitution,
        friction: 0.5,
        density: density
    });

    body.circleIndex = index;
    body.circleType = 'normal';
    body.circleRadius = config.radius;

    return body;
}

export function createSpecialCircle(x, y, isStatic) {
    // Special is small, like index 0 size
    const radius = CIRCLES[0].radius;

    const body = Bodies.circle(x, y, radius, {
        isStatic: isStatic,
        render: {
            sprite: {
                texture: SPECIAL_CIRCLE_IMAGE,
                xScale: (radius * 2) / 100, // Assets are 100x100
                yScale: (radius * 2) / 100
            },
            fillStyle: '#000', // Distinct look
            strokeStyle: '#FFF',
            lineWidth: 3
        },
        restitution: Math.min(1.0, CONFIG.PHYSICS.restitution + 0.2)
    });

    body.circleIndex = 0; // Dummy index
    body.circleType = 'special';
    body.circleRadius = radius;

    return body;
}
