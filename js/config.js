// Game Configuration
export const CONFIG = {
    WALL_THICKNESS: 50,
    PHYSICS: {
        gravity: 1.5,
        restitution: 0.6 // Bouncy!
    },
    DEADLINE_Y: 150,
    LEGEND_HEIGHT: 60, // Must match CSS
    SCORE_MILESTONES: [0, 500, 1000, 2000, 5000, 10000, 20000, 50000]
};

// Circle Definitions
export const CIRCLES = [
    { radius: 11, color: '#FFD700', score: 10 },      // 15 * 0.75
    { radius: 19, color: '#FF6347', score: 20 },      // 25 * 0.75
    { radius: 26, color: '#9370DB', score: 40 },      // 35 * 0.75
    { radius: 34, color: '#1E90FF', score: 80 },      // 45 * 0.75
    { radius: 45, color: '#32CD32', score: 160 },     // 60 * 0.75
    { radius: 56, color: '#FF4500', score: 320 },     // 75 * 0.75
    { radius: 68, color: '#FFD700', score: 640 },     // 90 * 0.75
    { radius: 83, color: '#C71585', score: 1280 },    // 110 * 0.75
    { radius: 98, color: '#8A2BE2', score: 2560 },    // 130 * 0.75
    { radius: 113, color: '#00FA9A', score: 5120 }    // 150 * 0.75
];
