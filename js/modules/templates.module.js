
/**
 * templates.module.js - Gerenciamento de templates
 */class TemplatesModule {
constructor() {
this.currentTemplate = 'medicacao';
this.templates = this.loadTemplates();
this.lastContent = ''; // Para rastrear mudanças
}/**
 * Carregar templates
 */
loadTemplates() {
    return {
        medicacao: {
            title: 'Receituário de Medicação',
            icon: '💊',
            content: `<strong>USO INTERNO</strong><br><br>
<span class="blank-line" contenteditable="true"></span><br>
Posologia: <span class="blank-line" contenteditable="true"></span><br>
Quantidade: <span class="blank-line" contenteditable="true"></span><br><br>
<span class="blank-line" contenteditable="true"></span><br>
Posologia: <span class="blank-line" contenteditable="true"></span><br>
Quantidade: <span class="blank-line" contenteditable="true"></span><br><br>
<strong>Orientações:</strong><br>
<span class="blank-line" contenteditable="true"></span>`
},
        exames: {
            title: 'Solicitação de Exames',
            icon: '🔬',
            content: `<strong>SOLICITO OS SEGUINTES EXAMES:</strong><br><br>
☐ Hemograma completo<br>
☐ Glicemia de jejum<br>
☐ Colesterol total e frações<br>
☐ Triglicerídeos<br>
☐ TSH e T4 livre<br>
☐ Urina tipo I<br>
☐ <span class="blank-line" contenteditable="true"></span><br><br>
<strong>Hipótese diagnóstica / CID-10:</strong><br>
<span class="cid-field" contenteditable="false" onclick="window.CIDModule.openSearch(this)">
<span class="cid-placeholder">Clique para buscar CID...</span>
</span><br><br>
<span class="blank-line" contenteditable="true"></span>`
},        procedimento: {
            title: 'Encaminhamento',
            icon: '🏥',
            content: `<strong>ENCAMINHAMENTO MÉDICO</strong><br><br>
Prezado(a) Colega,<br><br>
Encaminho o(a) paciente para:<br>
<span class="blank-line" contenteditable="true"></span><br><br>
Motivo do encaminhamento:<br>
<span class="blank-line" contenteditable="true"></span><br><br>
<strong>Diagnóstico / CID-10:</strong><br>
<span class="cid-field" contenteditable="false" onclick="window.CIDModule.openSearch(this)">
<span class="cid-placeholder">Clique para buscar CID...</span>
</span><br><br>
Atenciosamente,`
},        atestado: {
            title: 'Atestado Médico',
            icon: '📋',
            content: `<strong>ATESTADO MÉDICO</strong><br><br>
Atesto que o(a) paciente acima necessita se afastar de suas atividades por:<br>
<span class="blank-line" contenteditable="true"></span><br><br>
Período: <span class="blank-line short" contenteditable="true"></span> dias<br><br>
<strong>CID-10:</strong><br>
<span class="cid-field" contenteditable="false" onclick="window.CIDModule.openSearch(this)">
<span class="cid-placeholder">Clique para buscar CID...</span>
</span><br><br>
Por ser verdade, firmo o presente.`
},        laudo: {
            title: 'Laudo Médico',
            icon: '📄',
            content: `<strong>LAUDO MÉDICO</strong><br><br>
<strong>Exame realizado:</strong><br>
<span class="blank-line" contenteditable="true"></span><br><br>
<strong>Achados:</strong><br>
<span class="blank-line" contenteditable="true"></span><br><br>
<strong>Conclusão / CID-10:</strong><br>
<span class="cid-field" contenteditable="false" onclick="window.CIDModule.openSearch(this)">
<span class="cid-placeholder">Clique para buscar CID...</span>
</span><br><br>
<span class="blank-line" contenteditable="true"></span>`
},        livre: {
            title: 'Receituário Livre',
            icon: '✏️',
            content: ''
        }
    };
}/**
 * Inicializar módulo
 */
initialize() {
    this.renderTemplateGrid();
    this.selectTemplate('medicacao');
}/**
 * Renderizar grid de templates
 */
renderTemplateGrid() {
    const grid = document.getElementById('templateGrid');
    if (!grid) return;    const html = Object.keys(this.templates).map(key => {
        const template = this.templates[key];
        return `
            <div class="template-card" data-template="${key}" onclick="window.TemplatesModule.selectTemplate('${key}')">
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.title.replace('Receituário de ', '').replace('Solicitação de ', '')}</div>
            </div>
        `;
    }).join('');    grid.innerHTML = html;
}/**
 * Selecionar template
 */
async selectTemplate(templateId) {
    // Validar template
    if (!this.templates[templateId]) return;    const textArea = document.getElementById('prescriptionTextArea');
    if (!textArea) return;    // Verificar se o conteúdo atual é de um template ou foi editado
    const currentContent = textArea.innerHTML.trim();
    const isTemplateContent = this.isTemplateContent(currentContent);
    const isEmpty = !currentContent || currentContent === '<p><br></p>' || currentContent === '<br>';    // Se está vazio, ou é conteúdo de template não editado, ou está mudando para template livre
    if (isEmpty || isTemplateContent || templateId === 'livre') {
        // Perguntar confirmação se houver conteúdo personalizado
        if (!isEmpty && !isTemplateContent && templateId !== 'livre') {
            if (!(await window.UIModule.confirm('Deseja descartar as alterações na receita?'))) {
                this.updateTemplateUI(this.currentTemplate);
                return;
            }
        }
        this.loadTemplateContent(templateId);
    } else if (!isTemplateContent && templateId !== this.currentTemplate) {
        if (await window.UIModule.confirm('Deseja descartar as alterações na receita?')) {
            this.loadTemplateContent(templateId);
        } else {
            this.updateTemplateUI(this.currentTemplate);
            return;
        }
    }    // Atualizar template atual
    this.currentTemplate = templateId;
    this.updateTemplateUI(templateId);
}/**
 * Verificar se o conteúdo é de um template não editado
 */
isTemplateContent(content) {
    // Remove espaços e tags vazias para comparação
    const cleanContent = content.replace(/<p><\/p>|<br>/g, '').trim();    // Verifica se o conteúdo corresponde a algum template
    return Object.values(this.templates).some(template => {
        const cleanTemplate = template.content.replace(/<p><\/p>|<br>/g, '').trim();
        return cleanTemplate && cleanContent === cleanTemplate;
    });
}/**
 * Atualizar UI do template selecionado
 */
updateTemplateUI(templateId) {
    // Remover active de todos
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('active');
    });    // Adicionar active no selecionado
    const selectedCard = document.querySelector(`.template-card[data-template="${templateId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
}/**
 * Carregar conteúdo do template
 */
loadTemplateContent(templateId) {
    const template = this.templates[templateId];
    const textArea = document.getElementById('prescriptionTextArea');    if (textArea && template) {
        textArea.innerHTML = template.content;        // Se o template tem campos CID, inicializar
        if (template.content.includes('cid-field')) {
            setTimeout(() => {
                if (window.CIDModule) {
                    window.CIDModule.initializeCIDFields();
                }
            }, 100);
        }
    }
}/**
 * Obter template atual
 */
getCurrentTemplate() {
    return this.currentTemplate;
}
}// Exportar instância única
window.TemplatesModule = new TemplatesModule();