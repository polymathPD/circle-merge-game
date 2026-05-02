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
        this._onMouseMove = e => {
            if (this.isTouching) return;
            this.handleMove(e.offsetX);
        };
        this._onMouseDown = e => {
            if (this.isTouching) return;
            this.handleMove(e.offsetX);
            if (this.onDrop) this.onDrop();
        };
        this._onTouchStart = e => {
            e.preventDefault();
            this.isTouching = true;
            const x = this.getTouchX(e);
            this.handleMove(x);
        };
        this._onTouchMove = e => {
            e.preventDefault();
            if (!this.isTouching) return;
            const x = this.getTouchX(e);
            this.handleMove(x);
        };

        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('mousedown', this._onMouseDown);
        this.container.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.container.addEventListener('touchmove', this._onTouchMove, { passive: false });
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
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('mousedown', this._onMouseDown);
        this.container.removeEventListener('touchstart', this._onTouchStart);
        this.container.removeEventListener('touchmove', this._onTouchMove);
        window.removeEventListener('touchend', this.handleTouchEnd);
    }
}
