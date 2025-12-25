export class InputHandler {
    constructor(container, callbacks) {
        this.container = container;
        this.onMove = callbacks.onMove; // (x) => void
        this.onDrop = callbacks.onDrop; // () => void

        this.isTouching = false;

        this.initListeners();
    }

    initListeners() {
        // Mouse
        this.container.addEventListener('mousemove', e => {
            if (this.isTouching) return;
            if (e.buttons === 1) this.handleMove(e.offsetX);
        });

        this.container.addEventListener('mousedown', e => {
            if (this.isTouching) return;
            this.handleMove(e.offsetX);
        });

        window.addEventListener('mouseup', e => {
            if (this.isTouching) return;
            if (this.onDrop) this.onDrop();
        });

        // Touch
        this.container.addEventListener('touchstart', e => {
            e.preventDefault();
            this.isTouching = true;
            const x = this.getTouchX(e);
            this.handleMove(x);
        }, { passive: false });

        this.container.addEventListener('touchmove', e => {
            e.preventDefault();
            if (!this.isTouching) return;
            const x = this.getTouchX(e);
            this.handleMove(x);
        }, { passive: false });

        window.addEventListener('touchend', e => {
            if (!this.isTouching) return;
            if (this.onDrop) this.onDrop();

            // Prevent mouse events shortly after touch
            setTimeout(() => {
                this.isTouching = false;
            }, 300);
        });
    }

    getTouchX(e) {
        const rect = this.container.getBoundingClientRect();
        return e.touches[0].clientX - rect.left;
    }

    handleMove(x) {
        if (this.onMove) this.onMove(x);
    }
}
