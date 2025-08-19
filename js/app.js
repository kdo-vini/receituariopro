/**
 * @fileoverview Main application controller for Digital Prescription System
 * @module app
 * @requires config
 * @requires templates
 * @requires signature
 * @requires export
 * @requires storage
 * @requires ui
 */

/**
 * Main Application Class
 * Controls the entire prescription system lifecycle
 */
class PrescriptionApp {
    /**
     * Initialize the application
     */
    constructor() {
        this.currentTemplate = 'medicacao';
        this.isInitialized = false;
        
        // Module instances
        this.ui = null;
        this.templates = null;
        this.signature = null;
        this.exportManager = null;
        this.storage = null;
    }

    /**
     * Initialize all modules and set up event listeners
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Initialize modules
            this.ui = new UIManager();
            this.templates = new TemplateManager();
            this.signature = new SignatureManager('signatureCanvas');
            this.exportManager = new ExportManager();
            this.storage = new StorageManager();

            // Initialize UI components
            this.initializeDate();
            this.setupEventListeners();
            
            // Load saved data if exists
            await this.loadSavedData();
            
            // Set default template
            this.templates.loadTemplate('medicacao');
            
            this.isInitialized = true;
            this.ui.showToast('Sistema carregado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.ui.showToast('Erro ao inicializar o sistema', 'error');
        }
    }

    /**
     * Set up all event listeners for the application
     */
    setupEventListeners() {
        // Template selection
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTemplateChange(e));
        });

        // Patient name input
        const patientInput = document.getElementById('patientName');
        patientInput.addEventListener('input', (e) => this.updatePatientDisplay(e));

        // Date input
        const dateInput = document.getElementById('prescriptionDate');
        dateInput.addEventListener('change', () => this.updateDateDisplay());

        // Signature controls
        document.getElementById('clearSignatureBtn').addEventListener('click', 
            () => this.signature.clear());
        
        document.getElementById('uploadSignatureBtn').addEventListener('click', 
            () => document.getElementById('signatureUpload').click());
        
        document.getElementById('signatureUpload').addEventListener('change', 
            (e) => this.signature.uploadImage(e));

        // Export buttons
        document.getElementById('generatePdfBtn').addEventListener('click', 
            () => this.handleExportPDF());
        
        document.getElementById('generatePngBtn').addEventListener('click', 
            () => this.handleExportPNG());
        
        document.getElementById('saveHistoryBtn').addEventListener('click', 
            () => this.handleSaveToHistory());

        // Auto-save on content change
        const prescriptionText = document.getElementById('prescriptionText');
        let saveTimeout;
        prescriptionText.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => this.autoSave(), 1000);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Before unload warning
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S: Save to history
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.handleSaveToHistory();
        }
        
        // Ctrl/Cmd + P: Generate PDF
        if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault();
            this.handleExportPDF();
        }
        
        // Ctrl/Cmd + Shift + C: Clear form
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            this.clearForm();
        }
    }

    /**
     * Handle template change
     * @param {Event} event - Click event
     */
    handleTemplateChange(event) {
        const button = event.currentTarget;
        const template = button.dataset.template;
        
        // Update active state
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        
        // Load template
        this.currentTemplate = template;
        this.templates.loadTemplate(template);
        
        // Save preference
        this.storage.savePreference('lastTemplate', template);
    }

    /**
     * Initialize date field with today's date
     */
    initializeDate() {
        const dateInput = document.getElementById('prescriptionDate');
        const today = new Date();
        dateInput.valueAsDate = today;
        this.updateDateDisplay();
    }

    /**
     * Update patient name display
     * @param {Event} event - Input event
     */
    updatePatientDisplay(event) {
        const display = document.getElementById('patientDisplay');
        const value = event.target.value.trim();
        display.textContent = value || '_________________________';
    }

    /**
     * Update date display in Brazilian format
     */
    updateDateDisplay() {
        const dateInput = document.getElementById('prescriptionDate');
        const display = document.getElementById('dateDisplay');
        
        if (dateInput.value) {
            const date = new Date(dateInput.value + 'T00:00:00');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            display.textContent = `${day}/${month}/${year}`;
        } else {
            display.textContent = '__/__/____';
        }
    }

    /**
     * Handle PDF export
     */
    async handleExportPDF() {
        try {
            this.ui.showLoading('Gerando PDF...');
            
            const fileName = this.generateFileName('pdf');
            const paperSize = document.querySelector('input[name="paperSize"]:checked').value;
            
            await this.exportManager.exportPDF(fileName, paperSize);
            
            this.ui.hideLoading();
            this.ui.showToast('PDF gerado com sucesso!', 'success');
            
            // Track export
            this.storage.trackExport('pdf', fileName);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.ui.hideLoading();
            this.ui.showToast('Erro ao gerar PDF', 'error');
        }
    }

    /**
     * Handle PNG export
     */
    async handleExportPNG() {
        try {
            this.ui.showLoading('Gerando imagem...');
            
            const fileName = this.generateFileName('png');
            
            await this.exportManager.exportPNG(fileName);
            
            this.ui.hideLoading();
            this.ui.showToast('Imagem gerada com sucesso!', 'success');
            
            // Track export
            this.storage.trackExport('png', fileName);
            
        } catch (error) {
            console.error('Error generating PNG:', error);
            this.ui.hideLoading();
            this.ui.showToast('Erro ao gerar imagem', 'error');
        }
    }

    /**
     * Handle save to history
     */
    async handleSaveToHistory() {
        try {
            const prescriptionData = this.collectPrescriptionData();
            
            if (!prescriptionData.patientName) {
                this.ui.showToast('Por favor, preencha o nome do paciente', 'warning');
                return;
            }
            
            const id = await this.storage.savePrescription(prescriptionData);
            
            this.ui.showToast('✅ Receituário salvo no histórico!', 'success');
            
            // Mark as saved
            this.markAsSaved();
            
        } catch (error) {
            console.error('Error saving to history:', error);
            this.ui.showToast('Erro ao salvar no histórico', 'error');
        }
    }

    /**
     * Collect all prescription data
     * @returns {Object} Prescription data object
     */
    collectPrescriptionData() {
        return {
            patientName: document.getElementById('patientName').value,
            date: document.getElementById('prescriptionDate').value,
            template: this.currentTemplate,
            content: document.getElementById('prescriptionText').value,
            signature: this.signature.getDataURL(),
            doctorInfo: {
                name: document.getElementById('doctorName').textContent,
                crm: document.getElementById('doctorCRM').textContent,
                specialty: document.getElementById('doctorSpecialty').textContent,
                phone: document.getElementById('doctorPhone').textContent
            },
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Generate file name based on patient and date
     * @param {string} extension - File extension
     * @returns {string} Generated file name
     */
    generateFileName(extension) {
        const patientName = document.getElementById('patientName').value || 'Paciente';
        const date = document.getElementById('dateDisplay').textContent.replace(/\//g, '-');
        
        // Sanitize filename
        const safeName = patientName.replace(/[^a-z0-9]/gi, '_');
        
        return `Receituario_${safeName}_${date}.${extension}`;
    }

    /**
     * Auto-save current prescription
     */
    async autoSave() {
        try {
            const data = this.collectPrescriptionData();
            await this.storage.autoSave(data);
            console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    /**
     * Load saved data from storage
     */
    async loadSavedData() {
        try {
            // Load auto-saved data
            const autoSaved = await this.storage.getAutoSave();
            if (autoSaved && this.shouldLoadAutoSave(autoSaved)) {
                this.loadPrescriptionData(autoSaved);
                this.ui.showToast('Dados recuperados automaticamente', 'success');
            }
            
            // Load preferences
            const preferences = await this.storage.getPreferences();
            if (preferences.lastTemplate) {
                this.currentTemplate = preferences.lastTemplate;
                const button = document.querySelector(`[data-template="${preferences.lastTemplate}"]`);
                if (button) button.click();
            }
            
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    /**
     * Check if auto-save should be loaded
     * @param {Object} data - Auto-saved data
     * @returns {boolean} Should load
     */
    shouldLoadAutoSave(data) {
        if (!data || !data.savedAt) return false;
        
        const savedTime = new Date(data.savedAt);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        // Load if saved within last 24 hours
        return hoursDiff < 24;
    }

    /**
     * Load prescription data into form
     * @param {Object} data - Prescription data
     */
    loadPrescriptionData(data) {
        if (data.patientName) {
            document.getElementById('patientName').value = data.patientName;
            document.getElementById('patientDisplay').textContent = data.patientName;
        }
        
        if (data.date) {
            document.getElementById('prescriptionDate').value = data.date;
            this.updateDateDisplay();
        }
        
        if (data.content) {
            document.getElementById('prescriptionText').value = data.content;
        }
        
        if (data.signature) {
            this.signature.loadFromDataURL(data.signature);
        }
    }

    /**
     * Clear all form fields
     */
    clearForm() {
        if (!confirm('Deseja limpar todos os campos?')) return;
        
        document.getElementById('patientName').value = '';
        document.getElementById('patientDisplay').textContent = '_________________________';
        
        this.initializeDate();
        
        document.getElementById('prescriptionText').value = '';
        this.signature.clear();
        
        this.ui.showToast('Formulário limpo', 'success');
    }

    /**
     * Mark current prescription as saved
     */
    markAsSaved() {
        // Add visual indicator that prescription is saved
        const container = document.querySelector('.prescription-preview');
        container.style.borderColor = '#28a745';
        
        setTimeout(() => {
            container.style.borderColor = '';
        }, 2000);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust signature canvas if needed
        this.signature.adjustCanvasSize();
    }

    /**
     * Handle before unload event
     * @param {Event} event - Before unload event
     */
    handleBeforeUnload(event) {
        const content = document.getElementById('prescriptionText').value;
        const patientName = document.getElementById('patientName').value;
        
        if (content || patientName) {
            event.preventDefault();
            event.returnValue = 'Existem dados não salvos. Deseja realmente sair?';
        }
    }
}

// ========================================
// APPLICATION INITIALIZATION
// ========================================

/**
 * Initialize app when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Check browser compatibility
    if (!checkBrowserCompatibility()) {
        alert('Seu navegador não é totalmente compatível. Por favor, use uma versão mais recente.');
    }
    
    // Create and initialize app instance
    window.prescriptionApp = new PrescriptionApp();
    await window.prescriptionApp.init();
    
    console.log('✅ Digital Prescription System initialized successfully');
});

/**
 * Check browser compatibility
 * @returns {boolean} Is compatible
 */
function checkBrowserCompatibility() {
    const required = ['localStorage', 'Canvas', 'Promise'];
    
    return required.every(feature => {
        switch(feature) {
            case 'localStorage':
                return typeof(Storage) !== 'undefined';
            case 'Canvas':
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext && canvas.getContext('2d'));
            case 'Promise':
                return typeof Promise !== 'undefined';
            default:
                return true;
        }
    });
}