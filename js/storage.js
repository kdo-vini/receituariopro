// ========================================
// storage.js - Local Storage Management Module
// ========================================

/**
 * @fileoverview Manages local storage for prescriptions
 * @module storage
 */

class StorageManager {
    constructor() {
        this.storage = window.localStorage;
    }
    
    /**
     * Save prescription to history
     * @param {Object} prescriptionData - Prescription data
     * @returns {string} Prescription ID
     */
    savePrescription(prescriptionData) {
        const id = this.generateId();
        const prescription = {
            ...prescriptionData,
            id,
            savedAt: new Date().toISOString()
        };
        
        // Get existing prescriptions
        let prescriptions = this.getPrescriptions();
        
        // Add new prescription
        prescriptions.unshift(prescription);
        
        // Limit history size
        if (prescriptions.length > CONFIG.MAX_HISTORY_ITEMS) {
            prescriptions = prescriptions.slice(0, CONFIG.MAX_HISTORY_ITEMS);
        }
        
        // Save to storage
        this.storage.setItem(
            CONFIG.STORAGE_KEYS.PRESCRIPTIONS,
            JSON.stringify(prescriptions)
        );
        
        return id;
    }
    
    /**
     * Get all prescriptions from history
     * @returns {Array} Array of prescriptions
     */
    getPrescriptions() {
        try {
            const data = this.storage.getItem(CONFIG.STORAGE_KEYS.PRESCRIPTIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading prescriptions:', error);
            return [];
        }
    }
    
    /**
     * Get prescription by ID
     * @param {string} id - Prescription ID
     * @returns {Object|null} Prescription object or null
     */
    getPrescriptionById(id) {
        const prescriptions = this.getPrescriptions();
        return prescriptions.find(p => p.id === id) || null;
    }
    
    /**
     * Delete prescription by ID
     * @param {string} id - Prescription ID
     * @returns {boolean} Success status
     */
    deletePrescription(id) {
        try {
            let prescriptions = this.getPrescriptions();
            prescriptions = prescriptions.filter(p => p.id !== id);
            
            this.storage.setItem(
                CONFIG.STORAGE_KEYS.PRESCRIPTIONS,
                JSON.stringify(prescriptions)
            );
            
            return true;
        } catch (error) {
            console.error('Error deleting prescription:', error);
            return false;
        }
    }
    
    /**
     * Search prescriptions
     * @param {string} query - Search query
     * @returns {Array} Filtered prescriptions
     */
    searchPrescriptions(query) {
        const prescriptions = this.getPrescriptions();
        const lowerQuery = query.toLowerCase();
        
        return prescriptions.filter(p => {
            return p.patientName.toLowerCase().includes(lowerQuery) ||
                   p.content.toLowerCase().includes(lowerQuery) ||
                   p.date.includes(query);
        });
    }
    
    /**
     * Save auto-save data
     * @param {Object} data - Data to auto-save
     */
    autoSave(data) {
        const autoSaveData = {
            ...data,
            savedAt: new Date().toISOString()
        };
        
        this.storage.setItem(
            CONFIG.STORAGE_KEYS.AUTO_SAVE,
            JSON.stringify(autoSaveData)
        );
    }
    
    /**
     * Get auto-save data
     * @returns {Object|null} Auto-save data or null
     */
    getAutoSave() {
        try {
            const data = this.storage.getItem(CONFIG.STORAGE_KEYS.AUTO_SAVE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading auto-save:', error);
            return null;
        }
    }
    
    /**
     * Clear auto-save data
     */
    clearAutoSave() {
        this.storage.removeItem(CONFIG.STORAGE_KEYS.AUTO_SAVE);
    }
    
    /**
     * Save user preferences
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    savePreference(key, value) {
        let preferences = this.getPreferences();
        preferences[key] = value;
        
        this.storage.setItem(
            CONFIG.STORAGE_KEYS.PREFERENCES,
            JSON.stringify(preferences)
        );
    }
    
    /**
     * Get user preferences
     * @returns {Object} Preferences object
     */
    getPreferences() {
        try {
            const data = this.storage.getItem(CONFIG.STORAGE_KEYS.PREFERENCES);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading preferences:', error);
            return {};
        }
    }
    
    /**
     * Track export action
     * @param {string} type - Export type (pdf/png)
     * @param {string} fileName - Exported file name
     */
    trackExport(type, fileName) {
        let exportHistory = this.getExportHistory();
        
        exportHistory.push({
            type,
            fileName,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 exports
        if (exportHistory.length > 50) {
            exportHistory = exportHistory.slice(-50);
        }
        
        this.storage.setItem(
            CONFIG.STORAGE_KEYS.EXPORT_HISTORY,
            JSON.stringify(exportHistory)
        );
    }
    
    /**
     * Get export history
     * @returns {Array} Export history
     */
    getExportHistory() {
        try {
            const data = this.storage.getItem(CONFIG.STORAGE_KEYS.EXPORT_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading export history:', error);
            return [];
        }
    }
    
    /**
     * Get storage statistics
     * @returns {Object} Storage statistics
     */
    getStatistics() {
        const prescriptions = this.getPrescriptions();
        const exportHistory = this.getExportHistory();
        
        return {
            totalPrescriptions: prescriptions.length,
            totalExports: exportHistory.length,
            storageUsed: this.calculateStorageSize(),
            oldestPrescription: prescriptions[prescriptions.length - 1]?.savedAt,
            newestPrescription: prescriptions[0]?.savedAt,
            exportsByType: this.countExportsByType(exportHistory)
        };
    }
    
    /**
     * Calculate storage size in bytes
     * @returns {number} Storage size
     */
    calculateStorageSize() {
        let totalSize = 0;
        
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                totalSize += this.storage[key].length + key.length;
            }
        }
        
        return totalSize;
    }
    
    /**
     * Count exports by type
     * @param {Array} exportHistory - Export history
     * @returns {Object} Count by type
     */
    countExportsByType(exportHistory) {
        return exportHistory.reduce((acc, exp) => {
            acc[exp.type] = (acc[exp.type] || 0) + 1;
            return acc;
        }, {});
    }
    
    /**
     * Clear all data
     * @param {boolean} confirm - Confirmation flag
     * @returns {boolean} Success status
     */
    clearAllData(confirm = false) {
        if (!confirm) {
            console.warn('clearAllData requires confirmation');
            return false;
        }
        
        try {
            Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                this.storage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
    
    /**
     * Export all data as JSON
     * @returns {Object} All stored data
     */
    exportAllData() {
        return {
            prescriptions: this.getPrescriptions(),
            preferences: this.getPreferences(),
            exportHistory: this.getExportHistory(),
            exportDate: new Date().toISOString()
        };
    }
    
    /**
     * Import data from JSON
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.prescriptions) {
                this.storage.setItem(
                    CONFIG.STORAGE_KEYS.PRESCRIPTIONS,
                    JSON.stringify(data.prescriptions)
                );
            }
            
            if (data.preferences) {
                this.storage.setItem(
                    CONFIG.STORAGE_KEYS.PREFERENCES,
                    JSON.stringify(data.preferences)
                );
            }
            
            if (data.exportHistory) {
                this.storage.setItem(
                    CONFIG.STORAGE_KEYS.EXPORT_HISTORY,
                    JSON.stringify(data.exportHistory)
                );
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
    
    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `presc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}