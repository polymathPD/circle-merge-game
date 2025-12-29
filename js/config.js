// Game Configuration
export const CONFIG = {
    WALL_THICKNESS: 50,
    PHYSICS: {
        gravity: 1.3,
        restitution: 0.50
    },
    DEADLINE_Y: 150,
    LEGEND_HEIGHT: 60, // Must match CSS
    SCORE_MILESTONES: [0, 500, 1000, 2000, 5000, 10000, 20000, 50000]
};

// Circle Definitions
export const CIRCLES = [
    { radius: 11, color: '#FFD700', score: 10, image: 'data/circle_0_grape.svg' },      // 15 * 0.75
    { radius: 19, color: '#FF6347', score: 20, image: 'data/circle_1_strawberry.svg' },      // 25 * 0.75
    { radius: 26, color: '#9370DB', score: 40, image: 'data/circle_2_kiwi.svg' },      // 35 * 0.75
    { radius: 34, color: '#1E90FF', score: 80, image: 'data/circle_3_lemon.svg' },      // 45 * 0.75
    { radius: 45, color: '#32CD32', score: 160, image: 'data/circle_4_tomato.svg' },     // 60 * 0.75
    { radius: 56, color: '#FF4500', score: 320, image: 'data/circle_5_orange.svg' },     // 75 * 0.75
    { radius: 68, color: '#FFD700', score: 640, image: 'data/circle_6_peach.svg' },     // 90 * 0.75
    { radius: 83, color: '#C71585', score: 1280, image: 'data/circle_7_apple.svg' },    // 110 * 0.75
    { radius: 98, color: '#8A2BE2', score: 2560, image: 'data/circle_8_melon.svg' },    // 130 * 0.75
    { radius: 113, color: '#00FA9A', score: 5120, image: 'data/circle_9_watermelon.svg' }    // 150 * 0.75
];

export const SPECIAL_CIRCLE_IMAGE = 'data/special.svg';
