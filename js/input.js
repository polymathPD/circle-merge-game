export class InputHandler {
    constructor(container, callbacks) {
        this.container = container;
        this.onMove = callbacks.onMove;
        this.onDrop = callbacks.onDrop;

        this.isTouching = false;
        this.isMouseDown = false;

        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.initListeners();
    }

    initListeners() {
        // Mouse
        this.container.addEventListener('mousedown', e => {
            if (this.isTouching) return;
            this.isMouseDown = true;
            this.handleMove(e.offsetX);
        });

        this.container.addEventListener('mousemove', e => {
            if (this.isTouching) return;
            if (this.isMouseDown) {
                this.handleMove(e.offsetX);
            }
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

        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('touchend', this.handleTouchEnd);
    }

    handleMouseUp(e) {
        if (this.isTouching) return;
        if (this.isMouseDown) {
            this.isMouseDown = false;
            if (this.onDrop) this.onDrop();
        }
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
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('touchend', this.handleTouchEnd);
    }
}