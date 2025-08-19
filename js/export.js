// ========================================
// export.js - Export Management Module
// ========================================

/**
 * @fileoverview Handles PDF and PNG export functionality
 * @module export
 */

class ExportManager {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
    }
    
    /**
     * Prepare element for export
     * @returns {Object} Original states to restore
     */
    prepareForExport() {
        const textarea = document.getElementById('prescriptionText');
        const signatureControls = document.getElementById('signatureControls');
        
        // Save original states
        const originalStates = {
            textareaDisplay: textarea.style.display,
            controlsDisplay: signatureControls.style.display
        };
        
        // Create formatted content div
        const tempDiv = document.createElement('div');
        tempDiv.className = 'prescription-text-export';
        tempDiv.innerHTML = this.formatTextForExport(textarea.value);
        tempDiv.style.padding = '20px';
        tempDiv.style.minHeight = '400px';
        tempDiv.style.fontSize = '14px';
        tempDiv.style.lineHeight = '1.8';
        tempDiv.style.whiteSpace = 'pre-wrap';
        
        // Hide textarea and show formatted content
        textarea.style.display = 'none';
        textarea.parentNode.insertBefore(tempDiv, textarea);
        
        // Hide signature controls
        signatureControls.style.display = 'none';
        
        return { originalStates, tempDiv };
    }
    
    /**
     * Restore element after export
     * @param {Object} elements - Elements to restore
     */
    restoreAfterExport({ originalStates, tempDiv }) {
        const textarea = document.getElementById('prescriptionText');
        const signatureControls = document.getElementById('signatureControls');
        
        // Restore original states
        textarea.style.display = originalStates.textareaDisplay;
        signatureControls.style.display = originalStates.controlsDisplay;
        
        // Remove temp div
        if (tempDiv && tempDiv.parentNode) {
            tempDiv.parentNode.removeChild(tempDiv);
        }
    }
    
    /**
     * Format text for export
     * @param {string} text - Text to format
     * @returns {string} Formatted HTML
     */
    formatTextForExport(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/  /g, '&nbsp;&nbsp;');
    }
    
    /**
     * Export as PDF
     * @param {string} fileName - Output file name
     * @param {string} paperSize - Paper size (a4, a5, letter)
     * @returns {Promise<void>}
     */
    async exportPDF(fileName, paperSize = 'a4') {
        const elements = this.prepareForExport();
        
        try {
            const element = document.getElementById('prescriptionPreview');
            const canvas = await html2canvas(element, {
                scale: CONFIG.EXPORT_QUALITY.PNG_SCALE,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const pdf = new this.jsPDF('p', 'mm', paperSize);
            const paperDimensions = CONFIG.PAPER_SIZES[paperSize];
            
            const imgData = canvas.toDataURL('image/png', CONFIG.EXPORT_QUALITY.PDF_QUALITY);
            const imgWidth = paperDimensions.width - 20; // 10mm margins
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add image to PDF, centered
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            
            // Save PDF
            pdf.save(fileName);
            
        } finally {
            this.restoreAfterExport(elements);
        }
    }
    
    /**
     * Export as PNG
     * @param {string} fileName - Output file name
     * @returns {Promise<void>}
     */
    async exportPNG(fileName) {
        const elements = this.prepareForExport();
        
        try {
            const element = document.getElementById('prescriptionPreview');
            const canvas = await html2canvas(element, {
                scale: CONFIG.EXPORT_QUALITY.PNG_SCALE,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            // Create download link
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
        } finally {
            this.restoreAfterExport(elements);
        }
    }
    
    /**
     * Print prescription
     */
    print() {
        window.print();
    }
}