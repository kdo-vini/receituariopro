/**
 * app.controller.js - Controlador principal da aplicação
 */class AppController {
constructor() {
this.isInitialized = false;
}/**
 * Inicializar aplicação
 */
async initialize() {
    try {
        // Mostrar loading
        window.UIModule.showLoading('Inicializando sistema...');        // 1. Verificar autenticação
        const isAuthenticated = await window.AuthModule.initialize();
        if (!isAuthenticated) {
            return; // Auth module já redireciona
        }        // 2. Carregar dados do usuário
        const user = window.AuthModule.getUser();
        const professionalInfo = window.AuthModule.getProfessionalInfo();        // 3. Carregar assinatura
        const subscriptionStatus = await window.SubscriptionModule.loadSubscription(user.id);        // 4. Configurar UI com dados do usuário
        this.setupUserInterface(professionalInfo, subscriptionStatus);        // 5. Inicializar módulos
        await this.initializeModules();        // 6. Configurar event listeners
        this.setupEventListeners();        // 7. Verificar status da assinatura
        if (!subscriptionStatus.hasAccess) {
            this.handleExpiredTrial();
        }        // Marcar como inicializado
        this.isInitialized = true;        // Esconder loading
        window.UIModule.hideLoading();    } catch (error) {
        console.error('App initialization error:', error);
        window.UIModule.hideLoading();
        window.UIModule.showToast('Erro ao inicializar sistema', 'error');
    }
}/**
 * Configurar interface com dados do usuário
 */
setupUserInterface(professionalInfo, subscriptionStatus) {
    // Atualizar header
    const headerText = window.SubscriptionModule.getHeaderText();
    window.UIModule.updateHeader(professionalInfo, headerText);    // Atualizar informações do médico
    this.updateDoctorInfo(professionalInfo);    // Configurar logo se existir
    if (professionalInfo.logoUrl) {
        this.updateClinicLogo(professionalInfo.logoUrl);
    }    // Configurar data inicial
    this.initializeDate();
}/**
 * Atualizar informações do médico na prescrição
 */
updateDoctorInfo(info) {
    const doctorInfoEl = document.getElementById('doctorInfo');
    if (doctorInfoEl) {
        doctorInfoEl.innerHTML = `
            <h2>${info.name}</h2>
            <p>${info.fullCRM}</p>
            <p>${info.specialty}</p>
            <p>Tel: ${info.phone}</p>
        `;
    }    // Atualizar assinatura
    const signatureName = document.getElementById('signatureName');
    const signatureCRM = document.getElementById('signatureCRM');    if (signatureName) signatureName.textContent = info.name;
    if (signatureCRM) signatureCRM.textContent = info.fullCRM;
}/**
 * Atualizar logo da clínica
 */
updateClinicLogo(logoUrl) {
    const logoContainer = document.getElementById('clinicLogoContainer');
    if (logoContainer) {
        logoContainer.innerHTML = `
            <img src="${logoUrl}" class="clinic-logo" alt="Logo da Clínica">
        `;
    }
}/**
 * Inicializar módulos
 */
async initializeModules() {
    // Templates
    if (window.CIDModule) {
        await window.CIDModule.initialize();
    }
    if (window.TemplatesModule) {
        window.TemplatesModule.initialize();
    }    // Assinatura
    if (window.SignatureModule) {
        window.SignatureModule.initialize();        
        // Carregar assinatura salva se existir
        const professionalInfo = window.AuthModule.getProfessionalInfo();
        if (professionalInfo.signatureUrl) {
            await window.SignatureModule.loadFromUrl(professionalInfo.signatureUrl);
        }
    }    // Auto-save
    if (window.PrescriptionsModule) {
        window.PrescriptionsModule.initializeAutoSave();
    }
}/**
 * Configurar event listeners
 */
setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        window.AuthModule.logout();
    });    // Botões de ação
    document.getElementById('generatePdfBtn')?.addEventListener('click', () => {
        this.handleExportPDF();
    });    document.getElementById('generatePngBtn')?.addEventListener('click', () => {
        this.handleExportPNG();
    });    document.getElementById('saveBtn')?.addEventListener('click', () => {
        this.handleSave();
    });    document.getElementById('clearBtn')?.addEventListener('click', () => {
        this.handleClear();
    });    document.getElementById('historyBtn')?.addEventListener('click', () => {
        this.handleShowHistory();
    });    // Inputs
    document.getElementById('patientName')?.addEventListener('input', () => {
        window.UIModule.updatePatientDisplay();
    });    document.getElementById('prescriptionDate')?.addEventListener('change', () => {
        window.UIModule.updateDateDisplay();
    });    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S = Salvar
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.handleSave();
        }        // Ctrl/Cmd + P = PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            this.handleExportPDF();
        }
    });
}/**
 * Inicializar campo de data
 */
initializeDate() {
    const dateInput = document.getElementById('prescriptionDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
        window.UIModule.updateDateDisplay();
    }
}

/**
 * Lidar com trial expirado
 */
handleExpiredTrial() {
    window.UIModule.showToast(APP_CONSTANTS.MESSAGES.ERROR.TRIAL_EXPIRED, 'warning');
    window.UIModule.disablePremiumFeatures();    // Mostrar modal de upgrade após 2 segundos
    setTimeout(() => {
        if (confirm('Seu período de trial expirou. Deseja fazer upgrade agora?')) {
            window.SubscriptionModule.redirectToUpgrade();
        }
    }, 2000);
}/**
 * Handler: Exportar PDF
 */
async handleExportPDF() {
    // Verificar assinatura
    const status = window.SubscriptionModule.getStatus();
    if (!status.hasAccess) {
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.ERROR.TRIAL_EXPIRED, 'error');
        return;
    }    // Validar dados
    const data = window.PrescriptionsModule.collectPrescriptionData();
    const validation = window.PrescriptionsModule.validatePrescriptionData(data);    if (!validation.isValid) {
        window.UIModule.showToast(validation.errors[0], 'error');
        return;
    }    // Exportar
    if (window.ExportModule) {
        await window.ExportModule.exportPDF(data);
    }
}/**
 * Handler: Exportar PNG
 */
async handleExportPNG() {
    // Verificar assinatura
    const status = window.SubscriptionModule.getStatus();
    if (!status.hasAccess) {
        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.ERROR.TRIAL_EXPIRED, 'error');
        return;
    }    // Validar dados
    const data = window.PrescriptionsModule.collectPrescriptionData();
    const validation = window.PrescriptionsModule.validatePrescriptionData(data);    if (!validation.isValid) {
        window.UIModule.showToast(validation.errors[0], 'error');
        return;
    }    // Exportar
    if (window.ExportModule) {
        await window.ExportModule.exportPNG(data);
    }
}/**
 * Handler: Salvar
 */
async handleSave() {
    await window.PrescriptionsModule.savePrescription();
}/**
 * Handler: Limpar
 */
async handleClear() {
    if (await window.UIModule.confirm('Deseja limpar todos os campos?')) {
        window.UIModule.clearForm();        // Limpar assinatura se existir
        if (window.SignatureModule) {
            window.SignatureModule.clear();
        }        // Limpar rascunho
        localStorage.removeItem('prescriptionDraft');        window.UIModule.showToast(APP_CONSTANTS.MESSAGES.SUCCESS.FORM_CLEARED, 'success');
    }
}/**
/**
     * Handler: Mostrar histórico
     */
    async handleShowHistory() {
        const history = await window.PrescriptionsModule.loadHistory();
    if (history.length === 0) {
        window.UIModule.showToast('Nenhum receituário no histórico', 'info');
        return;
    }

    // Criar modal de histórico melhorado
    this.showHistoryModal(history);
}

/**
 * Mostrar modal de histórico melhorado
 */
showHistoryModal(history) {
    // Criar HTML do modal com busca
    const modalHTML = `
        <div class="modal" id="historyModal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>Histórico de Receituários</h2>
                    <button onclick="window.UIModule.hideModal('historyModal')" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <!-- Barra de busca -->
                    <div class="history-search" style="margin-bottom: 20px;">
                        <input type="text" 
                               id="historySearchInput" 
                               class="form-control" 
                               placeholder="Buscar por nome do paciente..."
                               oninput="window.AppController.filterHistory(this.value)">
                    </div>
                    
                    <!-- Estatísticas -->
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 8px; margin-bottom: 20px;">
                        <small>Total: ${history.length} receituários</small>
                    </div>
                    
                    <!-- Lista de histórico -->
                    <div class="history-list" id="historyList">
                        ${this.renderHistoryItems(history)}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Adicionar ao DOM
    const modalsContainer = document.getElementById('modalsContainer');
    if (modalsContainer) {
        modalsContainer.innerHTML = modalHTML;
        window.UIModule.showModal('historyModal');
    }

    // Guardar histórico para acesso
    this.historyCache = history;
}

/**
 * Renderizar itens do histórico
 */
renderHistoryItems(items) {
    if (items.length === 0) {
        return '<div style="text-align: center; padding: 20px; color: #999;">Nenhum resultado encontrado</div>';
    }

    return items.map((item, index) => {
        const date = new Date(item.created_at);
        const dateStr = date.toLocaleDateString('pt-BR');
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Extrair CIDs se houver
        const cids = item.cid_codes ? `<span style="color: #667eea; font-size: 12px;">CID: ${item.cid_codes}</span>` : '';
        
        return `
            <div class="history-item" onclick="window.AppController.loadHistoryItem(${index})">
                <div style="flex: 1;">
                    <div class="history-patient">${item.patient_name}</div>
                    <div class="history-meta" style="font-size: 12px; color: #999; margin-top: 5px;">
                        ${dateStr} às ${timeStr} ${cids}
                    </div>
                </div>
                <div class="history-type">${item.template_type || 'livre'}</div>
            </div>
        `;
    }).join('');
}

/**
 * Filtrar histórico
 */
filterHistory(searchTerm) {
    if (!this.historyCache) return;
    
    const filtered = searchTerm 
        ? this.historyCache.filter(item => 
            item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.cid_codes && item.cid_codes.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : this.historyCache;
    
    const historyList = document.getElementById('historyList');
    if (historyList) {
        historyList.innerHTML = this.renderHistoryItems(filtered);
    }
}

/**
 * Carregar item do histórico
 */
loadHistoryItem(index) {
    if (this.historyCache && this.historyCache[index]) {
        window.PrescriptionsModule.loadFromHistory(this.historyCache[index]);
        window.UIModule.hideModal('historyModal');
    }
}
}// Criar instância global e inicializar quando DOM carregar
window.AppController = new AppController();document.addEventListener('DOMContentLoaded', () => {
window.AppController.initialize();
});