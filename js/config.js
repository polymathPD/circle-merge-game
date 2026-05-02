export const VERSION = 'v1.1.0';

// Game Configuration
export const CONFIG = {
    WALL_THICKNESS: 50,
    PHYSICS: {
        gravity: 1.3,
        restitution: 0.50
    },
    DEADLINE_Y: 180,
    SPAWN_Y: 135,
    LEGEND_HEIGHT: 60,
    SCORE_MILESTONES: [0, 500, 1000, 2000, 5000, 10000, 20000, 50000],
    SPECIAL: {
        PROBABILITY: 0.02,
        MIN_LEVEL: 6,
        COOLDOWN_TURNS: 5,
        RADIUS_MULTIPLIER: 1.7
    },
    // ✨ 콤보 시스템 설정
    COMBO: {
        WINDOW: 6000,           // ms 이내 연속 합체 시 콤보 인정
        MAX_MULTIPLIER: 4.0,    // 최대 4배 점수
        MULTIPLIER_STEP: 0.5,   // 콤보당 0.5배씩 증가 (2콤보=1.5x, 3콤보=2x, ...)
    }
};

// Circle Definitions
export const CIRCLES = [
    { radius: 11,  color: '#FFD700', score: 10,   image: 'data/circle_0_grape.svg' },
    { radius: 19,  color: '#FF6347', score: 20,   image: 'data/circle_1_strawberry.svg' },
    { radius: 26,  color: '#9370DB', score: 40,   image: 'data/circle_2_kiwi.svg' },
    { radius: 34,  color: '#1E90FF', score: 80,   image: 'data/circle_3_lemon.svg' },
    { radius: 45,  color: '#32CD32', score: 160,  image: 'data/circle_4_tomato.svg' },
    { radius: 56,  color: '#FF4500', score: 320,  image: 'data/circle_5_orange.svg' },
    { radius: 68,  color: '#FFD700', score: 640,  image: 'data/circle_6_peach.svg' },
    { radius: 83,  color: '#C71585', score: 1280, image: 'data/circle_7_apple.svg' },
    { radius: 98,  color: '#8A2BE2', score: 2560, image: 'data/circle_8_melon.svg' },
    { radius: 113, color: '#00FA9A', score: 5120, image: 'data/circle_9_watermelon.svg' }
];

export const SPECIAL_CIRCLE_IMAGE = 'data/special.svg';

// ✨ 점수 구간별 배경 테마
// textDark: true = 텍스트가 어두운 색 (밝은 배경), false = 텍스트가 밝은 색 (어두운 배경)
export const BACKGROUNDS = [
    {
        minScore: 0,
        background: 'url("data/backgrounds/bg_1_garden.png") center/cover no-repeat',
        textDark: true,
        label: null
    },
    {
        minScore: 3000,
        background: 'url("data/backgrounds/bg_2_golden.png") center/cover no-repeat',
        textDark: true,
        label: '🌅 황금빛 오후'
    },
    {
        minScore: 8000,
        background: 'url("data/backgrounds/bg_3_sunset.png") center/cover no-repeat',
        textDark: false,
        label: '🌇 붉은 노을'
    },
    {
        minScore: 15000,
        background: 'url("data/backgrounds/bg_4_dusk.png") center/cover no-repeat',
        textDark: false,
        label: '🌆 보랏빛 황혼'
    },
    {
        minScore: 22000,
        background: 'url("data/backgrounds/bg_5_starry.png") center/cover no-repeat',
        textDark: false,
        label: '🌃 밤하늘'
    },
    {
        minScore: 25000,
        background: 'url("data/backgrounds/bg_6_night.png") center/cover no-repeat',
        textDark: false,
        label: '🌙 깊은 밤'
    },
    {
        minScore: 28000,
        background: 'url("data/backgrounds/bg_7_galaxy.png") center/cover no-repeat',
        textDark: false,
        label: '🌌 우주'
    },
    {
        minScore: 35000,
        background: 'url("data/backgrounds/bg_8_aurora.png") center/cover no-repeat',
        textDark: false,
        label: '✨ 오로라'
    },
];