export class InputHandler {
    constructor(container, callbacks) {
        this.container = container;
        this.onMove = callbacks.onMove;
        this.onDrop = callbacks.onDrop;

        this.isTouching = false;
        this.isMouseDown = false;
        this.initListeners();
    }

    initListeners() {
        // Mouse
        this.container.addEventListener('mousedown', e => {
            console.log('🖱️ MOUSEDOWN', { isTouching: this.isTouching });
            if (this.isTouching) return;
            this.isMouseDown = true;
            console.log('✅ isMouseDown set to TRUE');
            this.handleMove(e.offsetX);
        });

        this.container.addEventListener('mousemove', e => {
            if (this.isTouching) return;
            if (this.isMouseDown) {
                console.log('🖱️ MOUSEMOVE with isMouseDown=true');
                this.handleMove(e.offsetX);
            }
        });

        window.addEventListener('mouseup', e => {
            console.log('🖱️ MOUSEUP', { isTouching: this.isTouching, isMouseDown: this.isMouseDown });
            if (this.isTouching) return;
            if (this.isMouseDown) {
                this.isMouseDown = false;
                console.log('💧 Calling onDrop()');
                if (this.onDrop) this.onDrop();
            }
        });

        // Touch
        this.container.addEventListener('touchstart', e => {
            e.preventDefault();
            console.log('👆 TOUCHSTART');
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
            console.log('👆 TOUCHEND');
            if (!this.isTouching) return;
            console.log('💧 Calling onDrop() from touch');
            if (this.onDrop) this.onDrop();
            this.isTouching = false;
        });
    }

    getTouchX(e) {
        const rect = this.container.getBoundingClientRect();
        return e.touches[0].clientX - rect.left;
    }

    handleMove(x) {
        console.log('📍 handleMove called with x:', x);
        if (this.onMove) this.onMove(x);
    }
}