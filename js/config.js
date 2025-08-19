// ========================================
// config.js - Configuration Module
// ========================================

/**
 * @fileoverview Application configuration and constants
 * @module config
 */

const CONFIG = {
    // Application info
    APP_NAME: 'Receituário Digital',
    APP_VERSION: '1.0.0',
    
    // Storage keys
    STORAGE_KEYS: {
        PRESCRIPTIONS: 'prescriptions',
        AUTO_SAVE: 'autoSave',
        PREFERENCES: 'preferences',
        EXPORT_HISTORY: 'exportHistory'
    },
    
    // Limits
    MAX_HISTORY_ITEMS: 100,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    
    // Paper sizes in mm
    PAPER_SIZES: {
        a4: { width: 210, height: 297 },
        a5: { width: 148, height: 210 },
        letter: { width: 216, height: 279 }
    },
    
    // Canvas settings
    SIGNATURE_CANVAS: {
        WIDTH: 300,
        HEIGHT: 100,
        LINE_WIDTH: 2,
        COLOR: '#000000'
    },
    
    // Export quality
    EXPORT_QUALITY: {
        PNG_SCALE: 2,
        PDF_QUALITY: 0.95
    },
    
    // Doctor default info (should come from backend in production)
    DEFAULT_DOCTOR: {
        name: 'Dr. João Silva',
        crm: 'CRM: 12345-SP',
        specialty: 'Especialista em Clínica Geral',
        phone: 'Tel: (11) 98765-4321'
    }
};