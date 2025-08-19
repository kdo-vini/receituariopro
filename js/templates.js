// ========================================
// templates.js - Template Management Module
// ========================================

/**
 * @fileoverview Manages prescription templates
 * @module templates
 */

class TemplateManager {
    constructor() {
        this.templates = {
            medicacao: {
                title: 'Receituário de Medicação',
                content: `USO INTERNO

1. ________________________________
   Posologia: _____________________
   Quantidade: ____________________

2. ________________________________
   Posologia: _____________________
   Quantidade: ____________________

3. ________________________________
   Posologia: _____________________
   Quantidade: ____________________

Orientações:
_________________________________
_________________________________`,
                placeholder: 'Digite as medicações e posologia...'
            },
            
            exames: {
                title: 'Solicitação de Exames',
                content: `SOLICITO OS SEGUINTES EXAMES:

□ Hemograma completo
□ Glicemia de jejum
□ Colesterol total e frações
□ Triglicerídeos
□ TGO/TGP
□ TSH e T4 livre
□ Urina tipo I
□ Creatinina
□ Ureia
□ _______________________________
□ _______________________________
□ _______________________________

Observações clínicas:
_________________________________
_________________________________

Hipótese diagnóstica:
_________________________________`,
                placeholder: 'Marque ou adicione os exames necessários...'
            },
            
            procedimentos: {
                title: 'Encaminhamento / Procedimento',
                content: `ENCAMINHAMENTO MÉDICO

Prezado(a) Colega,

Encaminho o(a) paciente para:
_________________________________
_________________________________

Motivo do encaminhamento:
_________________________________
_________________________________
_________________________________

Diagnóstico / CID:
_________________________________

História clínica resumida:
_________________________________
_________________________________
_________________________________

Exames realizados:
_________________________________
_________________________________

Medicações em uso:
_________________________________
_________________________________

Atenciosamente,`,
                placeholder: 'Descreva o encaminhamento ou procedimento...'
            },
            
            livre: {
                title: 'Receituário Livre',
                content: '',
                placeholder: 'Digite o conteúdo do receituário...'
            }
        };
    }
    
    /**
     * Load a template into the prescription textarea
     * @param {string} templateName - Name of the template to load
     */
    loadTemplate(templateName) {
        const template = this.templates[templateName];
        if (!template) {
            console.error(`Template ${templateName} not found`);
            return;
        }
        
        const textarea = document.getElementById('prescriptionText');
        textarea.value = template.content;
        textarea.placeholder = template.placeholder;
        
        // Dispatch input event for any listeners
        textarea.dispatchEvent(new Event('input'));
    }
    
    /**
     * Get template by name
     * @param {string} templateName - Template name
     * @returns {Object} Template object
     */
    getTemplate(templateName) {
        return this.templates[templateName];
    }
    
    /**
     * Add custom template
     * @param {string} name - Template name
     * @param {Object} template - Template object
     */
    addCustomTemplate(name, template) {
        this.templates[name] = template;
    }
}