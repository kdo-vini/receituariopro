
/**
 * export.module.js - Gerenciamento de exportação (PDF/PNG)
 */class ExportModule {
constructor() {
this.jsPDF = window.jspdf?.jsPDF;
}/**
 * Preparar elemento para exportação
 */
prepareForExport() {
    const preview = document.getElementById('prescriptionPreview');
    if (!preview) return null;

    // Criar clone para não afetar o original
    const clone = preview.cloneNode(true);

    // Copiar conteúdo da assinatura
    const originalCanvas = preview.querySelector('#signatureCanvas');
    const cloneCanvas = clone.querySelector('#signatureCanvas');
    if (originalCanvas && cloneCanvas) {
        const ctx = cloneCanvas.getContext('2d');
        ctx.drawImage(originalCanvas, 0, 0);
    }

    // Remover elementos não exportáveis
    const editableElements = clone.querySelectorAll('[contenteditable]');
    editableElements.forEach(el => {
        el.removeAttribute('contenteditable');
    });

    // Remover linhas e placeholders vazios
    clone.querySelectorAll('.blank-line').forEach(el => {
        if (!el.textContent.trim()) el.remove();
    });
    clone.querySelectorAll('.placeholder').forEach(el => {
        if (!el.textContent.trim()) el.remove();
    });

    // Aplicar estilos de impressão
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.padding = '20mm';    return clone;
}/**
 * Exportar como PDF
 */
async exportPDF(prescriptionData) {
    try {
        window.UIModule.showLoading(APP_CONSTANTS.MESSAGES.INFO.GENERATING_PDF);        // Preparar elemento
        const element = this.prepareForExport();
        if (!element) throw new Error('Elemento não encontrado');        // Adicionar ao DOM temporariamente
        document.body.appendChild(element);
        element.style.position = 'absolute';
        element.style.left = '-9999px';        // Gerar canvas
        const canvas = await html2canvas(element, {
            scale: APP_CONSTANTS.EXPORT.PNG_SCALE,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });        // Remover elemento temporário
        document.body.removeChild(element);        // Criar PDF
        const pdf = new this.jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png', APP_CONSTANTS.EXPORT.PDF_QUALITY);        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;        // Adicionar imagem ao PDF
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));        // Gerar nome do arquivo
        const fileName = this.generateFileName(prescriptionData, 'pdf');        // Salvar PDF
        pdf.save(fileName);        window.UIModule.hideLoading();
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.SUCCESS.PDF_GENERATED, 'success');    } catch (error) {
        console.error('Export PDF error:', error);
        window.UIModule.hideLoading();
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.ERROR.EXPORT_FAILED, 'error');
    }
}/**
 * Exportar como PNG
 */
async exportPNG(prescriptionData) {
    try {
        window.UIModule.showLoading(APP_CONSTANTS.MESSAGES.INFO.GENERATING_PNG);        // Preparar elemento
        const element = this.prepareForExport();
        if (!element) throw new Error('Elemento não encontrado');        // Adicionar ao DOM temporariamente
        document.body.appendChild(element);
        element.style.position = 'absolute';
        element.style.left = '-9999px';        // Gerar canvas
        const canvas = await html2canvas(element, {
            scale: APP_CONSTANTS.EXPORT.PNG_SCALE,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });        // Remover elemento temporário
        document.body.removeChild(element);        // Converter para blob e baixar
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = this.generateFileName(prescriptionData, 'png');
            link.click();            // Limpar URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }, 'image/png');        window.UIModule.hideLoading();
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.SUCCESS.PNG_GENERATED, 'success');    } catch (error) {
        console.error('Export PNG error:', error);
        window.UIModule.hideLoading();
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.ERROR.EXPORT_FAILED, 'error');
    }
}/**
 * Gerar nome do arquivo
 */
generateFileName(prescriptionData, extension) {
    const patientName = prescriptionData.patientName || 'Paciente';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeName = patientName.replace(/[^a-z0-9]/gi, '_');    return `Receituario_${safeName}_${date}.${extension}`;
}
}// Exportar instância única
window.ExportModule = new ExportModule();