/**
 * constants.js - Constantes e configurações globais
 */
window.APP_CONSTANTS = {
// Mensagens padronizadas
MESSAGES: {
SUCCESS: {
PRESCRIPTION_SAVED: '✅ Receituário salvo com sucesso!',
PDF_GENERATED: '📄 PDF gerado com sucesso!',
PNG_GENERATED: '🖼️ Imagem gerada com sucesso!',
FORM_CLEARED: '🗑️ Formulário limpo'
},
ERROR: {
PATIENT_NAME_REQUIRED: '⚠️ Por favor, preencha o nome do paciente',
CONTENT_REQUIRED: '⚠️ Por favor, preencha o conteúdo do receituário',
SAVE_FAILED: '❌ Erro ao salvar receituário',
EXPORT_FAILED: '❌ Erro ao exportar',
AUTH_REQUIRED: '⚠️ Faça login para continuar',
TRIAL_EXPIRED: '⏰ Seu período de trial expirou'
},
INFO: {
SAVING: '💾 Salvando...',
GENERATING_PDF: '📄 Gerando PDF...',
GENERATING_PNG: '🖼️ Gerando imagem...',
LOADING: '⏳ Carregando...'
}
},
// Templates disponíveis
TEMPLATE_TYPES: {
    MEDICACAO: { id: 'medicacao', name: 'Medicação', icon: '💊' },
    EXAMES: { id: 'exames', name: 'Exames', icon: '🔬' },
    PROCEDIMENTO: { id: 'procedimento', name: 'Encaminhamento', icon: '🏥' },
    ATESTADO: { id: 'atestado', name: 'Atestado', icon: '📋' },
    LAUDO: { id: 'laudo', name: 'Laudo', icon: '📄' },
    LIVRE: { id: 'livre', name: 'Livre', icon: '✏️' }
},

// Configurações de exportação
EXPORT: {
    PDF_QUALITY: 0.95,
    PNG_SCALE: 2,
    PAPER_SIZES: {
        A4: { width: 210, height: 297 },
        A5: { width: 148, height: 210 },
        LETTER: { width: 216, height: 279 }
    }
},

// Limites do sistema
LIMITS: {
    MAX_HISTORY_ITEMS: 100,
    AUTO_SAVE_INTERVAL: 30000, // 30 segundos
    TRIAL_DAYS: 30
}
};