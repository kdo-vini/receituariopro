
/**
 * prescriptions.module.js - Gerenciamento de receituários
 */
class PrescriptionsModule {
constructor() {
this.autoSaveInterval = null;
this.currentPrescription = null;
}
/**
 * Inicializar auto-save
 */
initializeAutoSave() {
    // Limpar interval anterior se existir
    if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
    }

    // Configurar novo auto-save
    this.autoSaveInterval = setInterval(() => {
        this.autoSave();
    }, APP_CONSTANTS.LIMITS.AUTO_SAVE_INTERVAL);
}

/**
 * Auto-save silencioso
 */
async autoSave() {
    const data = this.collectPrescriptionData();
    
    // Só salva se tiver conteúdo
    if (data.patientName || data.content) {
        try {
            localStorage.setItem('prescriptionDraft', JSON.stringify({
                ...data,
                savedAt: new Date().toISOString()
            }));
            console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }
}

/**
 * Recuperar rascunho
 */
loadDraft() {
    try {
        const draft = localStorage.getItem('prescriptionDraft');
        if (draft) {
            const data = JSON.parse(draft);
            
            // Verificar se não é muito antigo (24h)
            const savedAt = new Date(data.savedAt);
            const now = new Date();
            const hoursDiff = (now - savedAt) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                return data;
            }
        }
    } catch (error) {
        console.error('Load draft error:', error);
    }
    return null;
}

/**
 * Coletar dados do receituário
 */
collectPrescriptionData() {
    const patientName = document.getElementById('patientName').value;
    const content = document.getElementById('prescriptionTextArea').innerHTML;
    const date = document.getElementById('prescriptionDate').value;
    const template = window.TemplatesModule?.currentTemplate || 'livre';

    // Coletar CIDs selecionados
    const cids = window.CIDModule ? window.CIDModule.getSelectedCIDs() : [];

    return {
        patientName: patientName.trim(),
        content: content,
        date: date,
        template: template,
        signature: window.SignatureModule?.getSignatureData() || null,
        cids: cids
    };
}

/**
 * Validar dados antes de salvar
 */
validatePrescriptionData(data) {
    const errors = [];

    if (!data.patientName) {
        errors.push('Nome do paciente é obrigatório');
    }

    if (!data.content || data.content === '<p><br></p>' || data.content.length < 10) {
        errors.push('Conteúdo do receituário é obrigatório');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Salvar receituário no banco
 */
async savePrescription() {
    try {
        // Verificar se pode salvar (assinatura)
        const canSave = window.SubscriptionModule.canCreatePrescription();
        if (!canSave) {
            window.UIModule.showToast(APP_CONSTANTS.MESSAGES.ERROR.TRIAL_EXPIRED, 'error');
            return false;
        }
        
            // Coletar dados
            const data = this.collectPrescriptionData();
        // Validar
        const validation = this.validatePrescriptionData(data);
        if (!validation.isValid) {
            window.UIModule.showToast(validation.errors[0], 'error');
            return false;
        }

        // Mostrar loading
        window.UIModule.showLoading(APP_CONSTANTS.MESSAGES.INFO.SAVING);

        // Preparar dados para salvar
        const prescriptionRecord = {
            user_id: window.AuthModule.getUser().id,
            patient_name: data.patientName,
            content: data.content,
            template_type: data.template,
            signature_data: data.signature,
            created_at: new Date().toISOString()
        };

        // Adicionar CIDs se houver
        if (data.cids && data.cids.length > 0) {
            prescriptionRecord.cid_codes = data.cids.map(c => c.codigo).join(', ');
            prescriptionRecord.metadata = {
                cids: data.cids
            };
        }

        // Salvar no banco
        const { data: savedData, error } = await supabaseClient
            .from('prescriptions')
            .insert(prescriptionRecord)
            .select()
            .single();

        if (error) throw error;

        // Limpar rascunho
        localStorage.removeItem('prescriptionDraft');

        // Feedback
        window.UIModule.hideLoading();
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.SUCCESS.PRESCRIPTION_SAVED, 'success');

        return true;

    } catch (error) {
        console.error('Save prescription error:', error);
        window.UIModule.hideLoading();
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.ERROR.SAVE_FAILED, 'error');
        return false;
    }
}

/**
 * Carregar histórico de receituários
 */
async loadHistory() {
    try {
        window.UIModule.showLoading('Carregando histórico...');

        const { data, error } = await supabaseClient
            .from('prescriptions')
            .select('*')
            .eq('user_id', window.AuthModule.getUser().id)
            .order('created_at', { ascending: false })
            .limit(APP_CONSTANTS.LIMITS.MAX_HISTORY_ITEMS);

        if (error) throw error;

        window.UIModule.hideLoading();
        return data || [];

    } catch (error) {
        console.error('Load history error:', error);
        window.UIModule.hideLoading();
        window.UIModule.showToast('Erro ao carregar histórico', 'error');
        return [];
    }
}

/**
 * Carregar receituário do histórico
 */
loadFromHistory(prescription) {
    // Preencher campos
    document.getElementById('patientName').value = prescription.patient_name || '';
    document.getElementById('prescriptionTextArea').innerHTML = prescription.content || '';
    
    // Atualizar template se existir
    if (prescription.template_type && window.TemplatesModule) {
        window.TemplatesModule.selectTemplate(prescription.template_type);
    }

    // Carregar assinatura se existir
    if (prescription.signature_data && window.SignatureModule) {
        window.SignatureModule.loadSignature(prescription.signature_data);
    }

    // Re-inicializar campos CID se existirem
    if (prescription.content && prescription.content.includes('cid-field')) {
        setTimeout(() => {
            if (window.CIDModule) {
                window.CIDModule.initializeCIDFields();
            }
        }, 100);
    }

    // Atualizar displays
    window.UIModule.updatePatientDisplay();
    window.UIModule.showToast('Receituário carregado do histórico', 'success');
}

/**
 * Buscar receituários por paciente
 */
async searchByPatient(patientName) {
    try {
        const { data, error } = await supabaseClient
            .from('prescriptions')
            .select('*')
            .eq('user_id', window.AuthModule.getUser().id)
            .ilike('patient_name', `%${patientName}%`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data || [];

    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

/**
 * Buscar receituários por CID
 */
async searchByCID(cidCode) {
    try {
        const { data, error } = await supabaseClient
            .from('prescriptions')
            .select('*')
            .eq('user_id', window.AuthModule.getUser().id)
            .contains('cid_codes', cidCode)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data || [];

    } catch (error) {
        console.error('Search by CID error:', error);
        return [];
    }
}
}
// Exportar instância única
window.PrescriptionsModule = new PrescriptionsModule();