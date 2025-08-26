/**
 * signature.module.js - Gerenciamento de assinatura digital
 */class SignatureModule {
constructor() {
this.canvas = null;
this.ctx = null;
this.isDrawing = false;
this.lastX = 0;
this.lastY = 0;
}/**
 * Inicializar canvas de assinatura
 */
initialize() {
    this.canvas = document.getElementById('signatureCanvas');
    if (!this.canvas) return;    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
    this.attachEventListeners();
}/**
 * Configurar propriedades do canvas
 */
setupCanvas() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#000000';
}/**
 * Anexar event listeners
 */
attachEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
    this.canvas.addEventListener('touchend', () => this.stopDrawing());
}/**
 * Iniciar desenho
 */
startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
}/**
 * Desenhar
 */
draw(e) {
    if (!this.isDrawing) return;    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();    this.lastX = currentX;
    this.lastY = currentY;
}/**
 * Parar desenho
 */
stopDrawing() {
    this.isDrawing = false;
}/**
 * Lidar com touch
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
}/**
 * Limpar assinatura
 */
clear() {
    if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}/**
 * Verificar se tem assinatura
 */
hasSignature() {
    if (!this.ctx || !this.canvas) return false;    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return imageData.data.some(channel => channel !== 0);
}/**
 * Obter dados da assinatura
 */
getSignatureData() {
    if (!this.canvas) return null;
    return this.canvas.toDataURL('image/png');
}/**
 * Carregar assinatura de data URL
 */
loadSignature(dataUrl) {
    if (!dataUrl || !this.ctx) return;    const img = new Image();
    img.onload = () => {
        this.clear();
        this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
}/**
 * Carregar assinatura de URL
 */
async loadFromUrl(url) {
    if (!url || !this.ctx) return;    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.clear();            // Escalar para caber no canvas
            const scale = Math.min(
                this.canvas.width / img.width,
                this.canvas.height / img.height
            );
            const width = img.width * scale;
            const height = img.height * scale;
            const x = (this.canvas.width - width) / 2;
            const y = (this.canvas.height - height) / 2;            this.ctx.drawImage(img, x, y, width, height);
            resolve();
        };
        img.onerror = reject;
        img.src = url;
    });
}
}// Exportar instância única
window.SignatureModule = new SignatureModule();