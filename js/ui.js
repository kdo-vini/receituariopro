// ========================================
// ui.js - User Interface Management Module
// ========================================

/**
 * @fileoverview Manages UI interactions and feedback
 * @module ui
 */

class UIManager {
    constructor() {
        this.toastElement = null;
        this.loadingElement = null;
        this.initializeToast();
    }
    
    /**
     * Initialize toast notification element
     */
    initializeToast() {
        // Create toast element if it doesn't exist
        if (!document.getElementById('toast')) {
            const toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        
        this.toastElement = document.getElementById('toast');
    }
    
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastElement) {
            this.initializeToast();
        }
        
        // Clear existing classes
        this.toastElement.className = 'toast';
        
        // Add type class
        this.toastElement.classList.add(type);
        
        // Set message
        this.toastElement.textContent = message;
        
        // Show toast
        setTimeout(() => {
            this.toastElement.classList.add('show');
        }, 10);
        
        // Hide after duration
        setTimeout(() => {
            this.toastElement.classList.remove('show');
        }, duration);
    }
    
    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    showLoading(message = 'Processando...') {
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loading-overlay';
            this.loadingElement.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(this.loadingElement);
        } else {
            this.loadingElement.querySelector('p').textContent = message;
        }
        
        this.loadingElement.style.display = 'flex';
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }
    
    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Callback for confirmation
     * @param {Function} onCancel - Callback for cancellation
     */
    showConfirmation(message, onConfirm, onCancel) {
        const result = confirm(message);
        
        if (result && onConfirm) {
            onConfirm();
        } else if (!result && onCancel) {
            onCancel();
        }
        
        return result;
    }
    
    /**
     * Show prompt dialog
     * @param {string} message - Prompt message
     * @param {string} defaultValue - Default value
     * @returns {string|null} User input or null
     */
    showPrompt(message, defaultValue = '') {
        return prompt(message, defaultValue);
    }
    
    /**
     * Update progress bar
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} label - Progress label
     */
    updateProgress(percent, label = '') {
        let progressBar = document.getElementById('progressBar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'progressBar';
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = `
                <div class="progress-fill"></div>
                <span class="progress-label"></span>
            `;
            document.body.appendChild(progressBar);
        }
        
        const fill = progressBar.querySelector('.progress-fill');
        const labelElement = progressBar.querySelector('.progress-label');
        
        fill.style.width = `${percent}%`;
        labelElement.textContent = label || `${percent}%`;
        
        if (percent >= 100) {
            setTimeout(() => {
                progressBar.style.display = 'none';
            }, 500);
        } else {
            progressBar.style.display = 'block';
        }
    }
    
    /**
     * Highlight element temporarily
     * @param {string} elementId - Element ID to highlight
     * @param {string} color - Highlight color
     * @param {number} duration - Duration in milliseconds
     */
    highlightElement(elementId, color = '#ffeb3b', duration = 2000) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const originalBackground = element.style.backgroundColor;
        element.style.backgroundColor = color;
        element.style.transition = 'background-color 0.3s';
        
        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
        }, duration);
    }
    
    /**
     * Toggle element visibility
     * @param {string} elementId - Element ID
     * @param {boolean} show - Show or hide
     */
    toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.style.display = show ? 'block' : 'none';
    }
    
    /**
     * Enable/disable form
     * @param {string} formId - Form ID
     * @param {boolean} enable - Enable or disable
     */
    toggleForm(formId, enable) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, textarea, select, button');
        inputs.forEach(input => {
            input.disabled = !enable;
        });
    }
    
    /**
     * Validate form fields
     * @param {string} formId - Form ID
     * @returns {boolean} Is valid
     */
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        if (!isValid) {
            this.showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        }
        
        return isValid;
    }
    
    /**
     * Create modal dialog
     * @param {Object} options - Modal options
     */
    createModal(options) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${options.title || 'Modal'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${options.content || ''}
                </div>
                <div class="modal-footer">
                    ${options.footer || '<button class="btn btn-primary">OK</button>'}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button handler
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
}
