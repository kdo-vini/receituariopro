/**
 * ui.module.js - Gerenciamento de interface e feedback visual
 */
class UIModule {
constructor() {
this.toastTimeout = null;
this.loadingCount = 0;
}
/**
 * Mostrar toast notification
 */
showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Limpar timeout anterior
    if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
    }

    // Configurar toast
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    // Auto-esconder após 3 segundos
    this.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Mostrar loading
 */
showLoading(message = 'Carregando...') {
    this.loadingCount++;
    
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        const loadingText = loadingScreen.querySelector('p');
        if (loadingText) loadingText.textContent = message;
        loadingScreen.classList.remove('hidden');
    }
}

/**
 * Esconder loading
 */
hideLoading() {
    this.loadingCount--;
    
    if (this.loadingCount <= 0) {
        this.loadingCount = 0;
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
}

/**
 * Mostrar modal genérico
 */
showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Esconder modal genérico
 */
hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Criar modal de confirmação
 */
async confirm(message, title = 'Confirmação') {
    return new Promise((resolve) => {
        const result = window.confirm(message);
        resolve(result);
    });
}

/**
 * Atualizar informações do header
 */
updateHeader(userData, subscriptionStatus) {
    // Nome do usuário
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = userData.name || 'Usuário';
    }

    // Status da assinatura
    const trialInfo = document.getElementById('trialInfo');
    if (trialInfo) {
        trialInfo.textContent = subscriptionStatus;
        
        // Adicionar classe de alerta se trial próximo do fim
        if (subscriptionStatus.includes('expira em')) {
            trialInfo.classList.add('warning');
        } else if (subscriptionStatus.includes('Expirado')) {
            trialInfo.classList.add('error');
        } else {
            trialInfo.classList.remove('warning', 'error');
        }
    }
}

/**
 * Desabilitar funcionalidades premium
 */
disablePremiumFeatures() {
    // Desabilitar botões de exportação
    const exportButtons = ['generatePdfBtn', 'generatePngBtn', 'saveBtn'];
    exportButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.onclick = () => this.showToast('Trial expirado. Faça upgrade para continuar.', 'warning');
        }
    });

    // Adicionar aviso no editor
    const textArea = document.getElementById('prescriptionTextArea');
    if (textArea) {
        textArea.contentEditable = false;
        textArea.style.opacity = '0.7';
        textArea.innerHTML = '<p style="text-align: center; color: #f56565;">⚠️ Trial expirado. Faça upgrade para continuar criando receituários.</p>';
    }
}

/**
 * Limpar formulário
 */
clearForm() {
    // Limpar campos
    document.getElementById('patientName').value = '';
    document.getElementById('prescriptionTextArea').innerHTML = '';
    
    // Reset data para hoje
    const dateInput = document.getElementById('prescriptionDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Atualizar displays
    this.updatePatientDisplay();
    this.updateDateDisplay();
}

/**
 * Atualizar display do paciente
 */
updatePatientDisplay() {
    const patientName = document.getElementById('patientName').value;
    const display = document.getElementById('patientInfoDisplay');
    
    if (display) {
        const date = this.getFormattedDate();
        display.innerHTML = `
            <p><strong>Paciente:</strong> ${patientName || '_________________________'}</p>
            <p><strong>Data:</strong> ${date}</p>
        `;
    }
}

/**
 * Atualizar display da data
 */
updateDateDisplay() {
    const display = document.getElementById('patientInfoDisplay');
    if (display) {
        const patientName = document.getElementById('patientName').value;
        const date = this.getFormattedDate();
        display.innerHTML = `
            <p><strong>Paciente:</strong> ${patientName || '_________________________'}</p>
            <p><strong>Data:</strong> ${date}</p>
        `;
    }
}

/**
 * Obter data formatada
 */
getFormattedDate() {
    const dateInput = document.getElementById('prescriptionDate');
    if (dateInput && dateInput.value) {
        const date = new Date(dateInput.value + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    }
    return new Date().toLocaleDateString('pt-BR');
}
}
// Exportar instância única
window.UIModule = new UIModule();