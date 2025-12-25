import { Game } from './game.js';

// Wait for DOM
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
