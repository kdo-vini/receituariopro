/**
 * templates.module.js - Gerenciamento de templates
 */class TemplatesModule {
constructor() {
this.currentTemplate = 'medicacao';
this.templates = this.loadTemplates();
}/**
 * Carregar templates (futuramente de arquivo JSON)
 */
loadTemplates() {
    return {
        medicacao: {
            title: 'Receituário de Medicação',
            icon: '💊',
            content: `<strong>USO INTERNO</strong><br><br>

________________________________<br>
Posologia: _____________________<br>
Quantidade: ____________________<br><br>
________________________________<br>
Posologia: _____________________<br>
Quantidade: ____________________<br><br>
<strong>Orientações:</strong><br>
_________________________________`
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
☐ _______________________________<br><br>
<strong>Hipótese diagnóstica:</strong><br>
_________________________________`
},        procedimento: {
            title: 'Encaminhamento',
            icon: '🏥',
            content: `<strong>ENCAMINHAMENTO MÉDICO</strong><br><br>
Prezado(a) Colega,<br><br>
Encaminho o(a) paciente para:<br>
_________________________________<br><br>
Motivo do encaminhamento:<br>
_________________________________<br><br>
Atenciosamente,`
},        atestado: {
            title: 'Atestado Médico',
            icon: '📋',
            content: `<strong>ATESTADO MÉDICO</strong><br><br>
Atesto que o(a) paciente acima necessita se afastar de suas atividades por:<br>
_________________________________<br><br>
Período: _____ dias<br>
CID: _____________________________<br><br>
Por ser verdade, firmo o presente.`
},        laudo: {
            title: 'Laudo Médico',
            icon: '📄',
            content: `<strong>LAUDO MÉDICO</strong><br><br>
<strong>Exame realizado:</strong><br>
_________________________________<br><br>
<strong>Achados:</strong><br>
_________________________________<br><br>
<strong>Conclusão:</strong><br>
_________________________________`
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
selectTemplate(templateId) {
    // Validar template
    if (!this.templates[templateId]) return;    // Atualizar template atual
    this.currentTemplate = templateId;    // Atualizar UI - remover active de todos
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('active');
    });    // Adicionar active no selecionado
    const selectedCard = document.querySelector(`.template-card[data-template="${templateId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }    // Carregar conteúdo do template
    this.loadTemplateContent(templateId);
}/**
 * Carregar conteúdo do template
 */
loadTemplateContent(templateId) {
    const template = this.templates[templateId];
    const textArea = document.getElementById('prescriptionTextArea');    if (textArea && template) {
        // Só carrega se estiver vazio ou for template livre
        if (!textArea.innerHTML || textArea.innerHTML === '<p><br></p>' || templateId === 'livre') {
            textArea.innerHTML = template.content;
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