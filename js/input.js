export class InputHandler {
    constructor(container, callbacks) {
        this.container = container;
        this.onMove = callbacks.onMove;
        this.onDrop = callbacks.onDrop;

        this.isTouching = false;

        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.initListeners();
    }

    initListeners() {
        // Mouse move - circle always follows cursor (no click required)
        this.container.addEventListener('mousemove', e => {
            if (this.isTouching) return;
            this.handleMove(e.offsetX);
        });

        // Mouse click - drop on press
        this.container.addEventListener('mousedown', e => {
            if (this.isTouching) return;
            this.handleMove(e.offsetX);
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

        window.addEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchEnd(e) {
        if (!this.isTouching) return;
        if (this.onDrop) this.onDrop();
        this.isTouching = false;
    }

    getTouchX(e) {
        const rect = this.container.getBoundingClientRect();
        return e.touches[0].clientX - rect.left;
    }

    handleMove(x) {
        if (this.onMove) this.onMove(x);
    }

    destroy() {
        window.removeEventListener('touchend', this.handleTouchEnd);
    }
}
