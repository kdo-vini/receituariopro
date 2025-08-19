// ========================================
// signature.js - Digital Signature Module
// ========================================

/**
 * @fileoverview Manages digital signature canvas
 * @module signature
 */

class SignatureManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.setupCanvas();
        this.attachEventListeners();
    }
    
    /**
     * Setup canvas properties
     */
    setupCanvas() {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = CONFIG.SIGNATURE_CANVAS.LINE_WIDTH;
        this.ctx.strokeStyle = CONFIG.SIGNATURE_CANVAS.COLOR;
    }
    
    /**
     * Attach event listeners for drawing
     */
    attachEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
    }
    
    /**
     * Start drawing
     * @param {MouseEvent} e - Mouse event
     */
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    /**
     * Draw on canvas
     * @param {MouseEvent} e - Mouse event
     */
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    /**
     * Stop drawing
     */
    stopDrawing() {
        this.isDrawing = false;
    }
    
    /**
     * Handle touch events
     * @param {TouchEvent} e - Touch event
     */
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(
            e.type === 'touchstart' ? 'mousedown' : 
            e.type === 'touchmove' ? 'mousemove' : 'mouseup',
            {
                clientX: touch.clientX,
                clientY: touch.clientY
            }
        );
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    /**
     * Clear the signature canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Upload image as signature
     * @param {Event} event - File input change event
     */
    uploadImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.clear();
                // Scale image to fit canvas
                const scale = Math.min(
                    this.canvas.width / img.width,
                    this.canvas.height / img.height
                );
                const width = img.width * scale;
                const height = img.height * scale;
                const x = (this.canvas.width - width) / 2;
                const y = (this.canvas.height - height) / 2;
                
                this.ctx.drawImage(img, x, y, width, height);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Get signature as data URL
     * @returns {string} Base64 data URL
     */
    getDataURL() {
        return this.canvas.toDataURL('image/png');
    }
    
    /**
     * Load signature from data URL
     * @param {string} dataURL - Base64 data URL
     */
    loadFromDataURL(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.clear();
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    }
    
    /**
     * Check if canvas has signature
     * @returns {boolean} Has signature
     */
    hasSignature() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return imageData.data.some(channel => channel !== 0);
    }
    
    /**
     * Adjust canvas size for responsive design
     */
    adjustCanvasSize() {
        // Save current content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Resize canvas
        const container = this.canvas.parentElement;
        const maxWidth = container.clientWidth - 40;
        
        if (maxWidth < CONFIG.SIGNATURE_CANVAS.WIDTH) {
            this.canvas.width = maxWidth;
            this.canvas.style.width = maxWidth + 'px';
        }
        
        // Restore content
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.setupCanvas();
    }
}