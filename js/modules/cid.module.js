/**
 * cid.module.js - Gerenciamento de busca CID-10
 */class CIDModule {
constructor() {
this.currentField = null;
this.searchResults = [];
this.searchTimeout = null;
this.tableStructure = null;
}/**
 * Inicializar e descobrir estrutura da tabela
 */
async initialize() {
    await this.discoverTableStructure();
    this.initializeCIDFields();
}/**
 * Descobrir estrutura da tabela CID10
 */
async discoverTableStructure() {
    try {
        // Fazer uma query simples para descobrir a estrutura
        const { data, error } = await supabaseClient
            .from('cid10_subcategorias')
            .select('*')
            .limit(1);        if (!error && data && data.length > 0) {
            // Descobrir os nomes das colunas
            const sample = data[0];
            const columns = Object.keys(sample);            console.log('Estrutura da tabela CID10:', columns);            // Mapear as colunas baseado no que existe
            this.tableStructure = {
                codigo: this.findColumn(columns, ['codigo', 'code', 'cod', 'subcat', 'subcategoria']),
                descricao: this.findColumn(columns, ['descricao', 'description', 'desc', 'nome', 'name']),
                categoria: this.findColumn(columns, ['categoria', 'category', 'cat', 'grupo'])
            };            console.log('Mapeamento de colunas:', this.tableStructure);
        }
    } catch (error) {
        console.error('Erro ao descobrir estrutura da tabela:', error);
        // Usar estrutura padrão se falhar
        this.tableStructure = {
            codigo: 'subcat',
            descricao: 'descricao',
            categoria: 'cat'
        };
    }
}/**
 * Encontrar coluna pelo nome
 */
findColumn(availableColumns, possibleNames) {
    for (let name of possibleNames) {
        if (availableColumns.includes(name)) {
            return name;
        }
    }
    // Se não encontrar, retornar o primeiro nome disponível
    return availableColumns[0];
}/**
 * Inicializar campos CID existentes
 */
initializeCIDFields() {
    const cidFields = document.querySelectorAll('.cid-field');
    cidFields.forEach(field => {
        // Adicionar estilos
        field.style.display = 'inline-block';
        field.style.padding = '5px 10px';
        field.style.background = '#f0f0f0';
        field.style.borderRadius = '4px';
        field.style.cursor = 'pointer';
        field.style.minWidth = '200px';
        field.style.border = '1px solid #ddd';        // Tornar não editável diretamente
        field.contentEditable = false;
    });
}/**
 * Abrir modal de busca CID
 */
openSearch(fieldElement) {
    this.currentField = fieldElement;
    this.createSearchModal();
    window.UIModule.showModal('cidSearchModal');    // Adicionar sugestões comuns
    this.showCommonSuggestions();    // Focar no campo de busca
    setTimeout(() => {
        const searchInput = document.getElementById('cidSearchInput');
        if (searchInput) searchInput.focus();
    }, 100);
}/**
 * Criar modal de busca
 */
createSearchModal() {
    const existingModal = document.getElementById('cidSearchModal');
    if (existingModal) {
        existingModal.remove();
    }    const modalHTML = `
        <div class="modal" id="cidSearchModal">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>Buscar CID-10</h2>
                    <button onclick="window.CIDModule.closeSearch()" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="cid-search-container">
                        <input type="text" 
                               id="cidSearchInput" 
                               class="form-control" 
                               placeholder="Digite o nome da doença, sintoma ou código CID..."
                               oninput="window.CIDModule.handleSearch(this.value)">                        <div class="cid-search-info" style="margin-top: 10px; color: #666; font-size: 14px;">
                            💡 Dica: Digite pelo menos 3 caracteres. Ex: "febre", "gripe", "J11", "diabetes"
                        </div>                        <!-- Atalhos rápidos -->
                        <div id="cidQuickLinks" style="margin: 15px 0;">
                            <span style="color: #666; font-size: 14px;">Buscas frequentes:</span>
                            <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
                                <button onclick="window.CIDModule.quickSearch('gripe')" class="quick-search-btn">Gripe</button>
                                <button onclick="window.CIDModule.quickSearch('febre')" class="quick-search-btn">Febre</button>
                                <button onclick="window.CIDModule.quickSearch('hipertensão')" class="quick-search-btn">Hipertensão</button>
                                <button onclick="window.CIDModule.quickSearch('diabetes')" class="quick-search-btn">Diabetes</button>
                                <button onclick="window.CIDModule.quickSearch('ansiedade')" class="quick-search-btn">Ansiedade</button>
                                <button onclick="window.CIDModule.quickSearch('depressão')" class="quick-search-btn">Depressão</button>
                                <button onclick="window.CIDModule.quickSearch('covid')" class="quick-search-btn">COVID-19</button>
                            </div>
                        </div>                        <div id="cidSearchResults" class="cid-results-container" style="margin-top: 20px; max-height: 400px; overflow-y: auto;">
                            <!-- Resultados aparecerão aqui -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;    // Adicionar ao DOM
    const modalsContainer = document.getElementById('modalsContainer');
    if (!modalsContainer) {
        const container = document.createElement('div');
        container.id = 'modalsContainer';
        document.body.appendChild(container);
    }    document.getElementById('modalsContainer').insertAdjacentHTML('beforeend', modalHTML);    // Adicionar estilos específicos do CID
    this.addCIDStyles();
}/**
 * Adicionar estilos CSS para CID
 */
addCIDStyles() {
    if (document.getElementById('cidStyles')) return;    const styles = `
        <style id="cidStyles">
            .cid-result-item {
                padding: 12px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: white;
            }            .cid-result-item:hover {
                background: #f5f5f5;
                border-color: #667eea;
                transform: translateX(5px);
            }            .cid-result-item.highlight {
                background: #fff9e6;
                border-color: #ffc107;
            }            .cid-code {
                font-weight: bold;
                color: #667eea;
                font-size: 16px;
                margin-bottom: 4px;
            }            .cid-description {
                color: #333;
                font-size: 14px;
                line-height: 1.4;
            }            .cid-description mark {
                background: #ffeb3b;
                padding: 1px 2px;
                border-radius: 2px;
            }            .cid-category {
                color: #666;
                font-size: 12px;
                margin-top: 4px;
                font-style: italic;
            }            .cid-field {
                transition: all 0.2s;
            }            .cid-field:hover {
                background: #e8e8e8 !important;
            }            .cid-field.filled {
                background: #e8f4ff !important;
                border-color: #667eea !important;
                font-weight: 500;
            }            .cid-placeholder {
                color: #999;
                font-style: italic;
            }            .cid-search-loading {
                text-align: center;
                padding: 20px;
                color: #666;
            }            .cid-no-results {
                text-align: center;
                padding: 20px;
                color: #999;
                font-style: italic;
            }            .quick-search-btn {
                padding: 5px 12px;
                background: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 15px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }            .quick-search-btn:hover {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }            .cid-group-header {
                padding: 8px;
                background: #f5f5f5;
                border-radius: 4px;
                margin: 10px 0 5px;
                font-weight: 600;
                color: #555;
                font-size: 13px;
            }
        </style>
    `;    document.head.insertAdjacentHTML('beforeend', styles);
}/**
 * Busca rápida por botões
 */
quickSearch(term) {
    const searchInput = document.getElementById('cidSearchInput');
    if (searchInput) {
        searchInput.value = term;
        this.handleSearch(term);
    }
}/**
 * Mostrar sugestões comuns
 */
showCommonSuggestions() {
    const resultsContainer = document.getElementById('cidSearchResults');
    resultsContainer.innerHTML = `
        <div class="cid-group-header">CIDs mais utilizados</div>
        <div class="cid-result-item" onclick="window.CIDModule.selectCID('J11.0', 'Influenza (gripe) com pneumonia, vírus não identificado')">
            <div class="cid-code">J11.0</div>
            <div class="cid-description">Influenza (gripe) com pneumonia, vírus não identificado</div>
        </div>
        <div class="cid-result-item" onclick="window.CIDModule.selectCID('R50.9', 'Febre não especificada')">
            <div class="cid-code">R50.9</div>
            <div class="cid-description">Febre não especificada</div>
        </div>
        <div class="cid-result-item" onclick="window.CIDModule.selectCID('I10', 'Hipertensão essencial (primária)')">
            <div class="cid-code">I10</div>
            <div class="cid-description">Hipertensão essencial (primária)</div>
        </div>
        <div class="cid-result-item" onclick="window.CIDModule.selectCID('E11.9', 'Diabetes mellitus tipo 2 sem complicações')">
            <div class="cid-code">E11.9</div>
            <div class="cid-description">Diabetes mellitus tipo 2 sem complicações</div>
        </div>
        <div class="cid-result-item" onclick="window.CIDModule.selectCID('F41.1', 'Transtorno de ansiedade generalizada')">
            <div class="cid-code">F41.1</div>
            <div class="cid-description">Transtorno de ansiedade generalizada</div>
        </div>
    `;
}/**
 * Handler de busca
 */
handleSearch(query) {
    // Limpar timeout anterior
    if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
    }    const resultsContainer = document.getElementById('cidSearchResults');    // Verificar tamanho mínimo
    if (query.length < 3) {
        this.showCommonSuggestions();
        return;
    }    // Mostrar loading
    resultsContainer.innerHTML = `
        <div class="cid-search-loading">
            <div class="loader-spinner" style="width: 30px; height: 30px; margin: 0 auto;"></div>
            <p>Buscando...</p>
        </div>
    `;    // Debounce de 300ms
    this.searchTimeout = setTimeout(() => {
        this.searchCID(query);
    }, 300);
}
/**
 * Buscar CID no banco de dados
 */
/**
 * Buscar CID no banco de dados
 */
async searchCID(query) {
    try {
        // Se ainda não descobriu a estrutura, tentar descobrir
        if (!this.tableStructure) {
            await this.discoverTableStructure();
        }
    // Preparar query para busca
    const searchTerm = query.toLowerCase().trim();
    
    // Coletar todos os resultados
    let allResults = [];
    
    // 1. Se parece um código CID (começa com letra seguida de número)
    if (searchTerm.match(/^[a-z]\d/i)) {
        const { data: codeResults } = await supabaseClient
            .from('cid10_subcategorias')
            .select('*')
            .ilike(this.tableStructure.codigo, `${searchTerm}%`)
            .limit(20);
        
        if (codeResults) {
            allResults = codeResults.map(r => ({...r, relevance: 100}));
        }
    } else {
        // 2. Busca por palavra na descrição (busca simples que funciona)
        const { data: descResults } = await supabaseClient
            .from('cid10_subcategorias')
            .select('*')
            .ilike(this.tableStructure.descricao, `%${searchTerm}%`)
            .limit(100);
        
        if (descResults) {
            // Calcular relevância baseada na posição da palavra
            descResults.forEach(result => {
                const desc = (result[this.tableStructure.descricao] || '').toLowerCase();
                let relevance = 50;
                
                // Maior relevância se a palavra aparece no início
                if (desc.startsWith(searchTerm)) {
                    relevance = 95;
                } else if (desc.includes(` ${searchTerm} `)) {
                    // Palavra completa no meio
                    relevance = 85;
                } else if (desc.includes(searchTerm)) {
                    // Parte de outra palavra
                    relevance = 70;
                }
                
                allResults.push({...result, relevance});
            });
        }
        
        // 3. Buscar também sinônimos conhecidos
        const synonyms = {
            'febre': ['febril', 'pirexia', 'hipertermia'],
            'gripe': ['influenza', 'gripal'],
            'dor de cabeça': ['cefaleia', 'enxaqueca'],
            'pressão alta': ['hipertensão'],
            'diabetes': ['mellitus'],
            'covid': ['coronavirus', 'u07.1'],
            'tosse': ['tussis'],
            'diarreia': ['diarréia', 'enterite'],
            'vomito': ['vômito', 'êmese'],
            'ansiedade': ['ansioso', 'f41'],
            'depressão': ['depressivo', 'f32', 'f33']
        };
        
        // Verificar se tem sinônimo conhecido
        const termSynonyms = synonyms[searchTerm] || [];
        for (const synonym of termSynonyms) {
            const { data: synResults } = await supabaseClient
                .from('cid10_subcategorias')
                .select('*')
                .ilike(this.tableStructure.descricao, `%${synonym}%`)
                .limit(20);
            
            if (synResults) {
                synResults.forEach(result => {
                    const codigo = result[this.tableStructure.codigo];
                    // Evitar duplicatas
                    if (!allResults.find(r => r[this.tableStructure.codigo] === codigo)) {
                        allResults.push({...result, relevance: 60});
                    }
                });
            }
        }
    }
    
    // Ordenar por relevância
    allResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    
    // Limitar a 50 resultados
    this.searchResults = allResults.slice(0, 50);
    this.displayResults(searchTerm);

} catch (error) {
    console.error('Erro ao buscar CID:', error);
    
    const resultsContainer = document.getElementById('cidSearchResults');
    resultsContainer.innerHTML = `
        <div class="cid-no-results">
            Erro ao buscar. Tente novamente.
            <br><small>${error.message}</small>
        </div>
    `;
}
}
/**
 * Gerar variações de busca para melhorar resultados
 */
generateSearchVariations(term) {
    const variations = [term];    // Mapeamento de termos comuns para termos médicos
    const synonymMap = {
        'febre': ['febre', 'febril', 'pirexia', 'hipertermia'],
        'gripe': ['gripe', 'influenza', 'gripal'],
        'dor de cabeça': ['cefaleia', 'cefaléia', 'enxaqueca'],
        'pressão alta': ['hipertensão', 'hipertensa'],
        'pressão baixa': ['hipotensão', 'hipotensa'],
        'diabetes': ['diabetes', 'diabético', 'mellitus'],
        'ansiedade': ['ansiedade', 'ansioso', 'transtorno'],
        'depressão': ['depressão', 'depressivo'],
        'covid': ['covid', 'coronavirus', 'sars-cov'],
        'pneumonia': ['pneumonia', 'pneumonite'],
        'tosse': ['tosse', 'tussis'],
        'diarreia': ['diarreia', 'diarréia', 'enterite'],
        'vômito': ['vômito', 'vomito', 'êmese', 'emese'],
        'infecção': ['infecção', 'infeccioso', 'infecciosa'],
        'alergia': ['alergia', 'alérgica', 'alérgico'],
        'asma': ['asma', 'asmática', 'bronquite']
    };    // Verificar se o termo tem sinônimos
    for (let [key, synonyms] of Object.entries(synonymMap)) {
        if (term.includes(key)) {
            variations.push(...synonyms);
        }
    }    // Remover duplicatas
    return [...new Set(variations)];
}/**
 * Extrair palavras-chave do termo de busca
 */
extractKeywords(term) {
    // Remover palavras muito comuns
    const stopWords = ['de', 'do', 'da', 'com', 'sem', 'por', 'para', 'e', 'ou', 'a', 'o'];
    const words = term.split(/\s+/);
    return words.filter(word => word.length > 2 && !stopWords.includes(word.toLowerCase()));
}/**
 * Exibir resultados da busca com destaque
 */
displayResults(searchTerm) {
    const resultsContainer = document.getElementById('cidSearchResults');    if (this.searchResults.length === 0) {
        resultsContainer.innerHTML = `
            <div class="cid-no-results">
                Nenhum resultado encontrado para "${searchTerm}". 
                <br>Tente outros termos ou use os botões de busca rápida.
            </div>
        `;
        return;
    }    // Usar os nomes de coluna descobertos
    const codeCol = this.tableStructure?.codigo || 'subcat';
    const descCol = this.tableStructure?.descricao || 'descricao';
    const catCol = this.tableStructure?.categoria || 'cat';    // Agrupar por relevância
    const highRelevance = this.searchResults.filter(r => r.relevance >= 80);
    const mediumRelevance = this.searchResults.filter(r => r.relevance >= 60 && r.relevance < 80);
    const lowRelevance = this.searchResults.filter(r => !r.relevance || r.relevance < 60);    let html = '';    // Resultados mais relevantes
    if (highRelevance.length > 0) {
        html += '<div class="cid-group-header">🎯 Mais relevantes</div>';
        html += this.renderResultItems(highRelevance, searchTerm, true);
    }    // Resultados médios
    if (mediumRelevance.length > 0) {
        html += '<div class="cid-group-header">Relacionados</div>';
        html += this.renderResultItems(mediumRelevance, searchTerm, false);
    }    // Outros resultados
    if (lowRelevance.length > 0 && (highRelevance.length + mediumRelevance.length) < 10) {
        html += '<div class="cid-group-header">Outros resultados</div>';
        html += this.renderResultItems(lowRelevance.slice(0, 10), searchTerm, false);
    }    resultsContainer.innerHTML = html;
}/**
 * Renderizar itens de resultado
 */
renderResultItems(items, searchTerm, highlight) {
    const codeCol = this.tableStructure?.codigo || 'subcat';
    const descCol = this.tableStructure?.descricao || 'descricao';
    const catCol = this.tableStructure?.categoria || 'cat';    return items.map(item => {
        const codigo = item[codeCol] || item.codigo || item.subcat || 'N/A';
        const descricao = item[descCol] || item.descricao || item.nome || 'Sem descrição';
        const categoria = item[catCol] || item.categoria || item.cat || '';        // Destacar termo buscado na descrição
        const highlightedDesc = this.highlightSearchTerm(descricao, searchTerm);        return `
            <div class="cid-result-item ${highlight ? 'highlight' : ''}" 
                 onclick="window.CIDModule.selectCID('${this.escapeHtml(codigo)}', '${this.escapeHtml(descricao)}')">
                <div class="cid-code">${codigo}</div>
                <div class="cid-description">${highlightedDesc}</div>
                ${categoria ? `<div class="cid-category">Categoria: ${categoria}</div>` : ''}
            </div>
        `;
    }).join('');
}/**
 * Destacar termo de busca no texto
 */
highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return text;    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}/**
 * Selecionar CID
 */
selectCID(codigo, descricao) {
    if (this.currentField) {
        // Atualizar o campo
        this.currentField.innerHTML = `
            <strong>${codigo}</strong> - ${descricao}
            <span style="margin-left: 10px; color: #999; cursor: pointer;" onclick="window.CIDModule.clearCID(this.parentElement)">✖</span>
        `;
        this.currentField.classList.add('filled');        // Salvar dados no campo
        this.currentField.dataset.cidCodigo = codigo;
        this.currentField.dataset.cidDescricao = descricao;
    }    // Fechar modal
    this.closeSearch();    // Feedback
    window.UIModule.showToast(`CID ${codigo} selecionado`, 'success');
}/**
 * Limpar CID selecionado
 */
clearCID(fieldElement) {
    fieldElement.innerHTML = '<span class="cid-placeholder">Clique para buscar CID...</span>';
    fieldElement.classList.remove('filled');
    delete fieldElement.dataset.cidCodigo;
    delete fieldElement.dataset.cidDescricao;
}/**
 * Fechar modal de busca
 */
closeSearch() {
    window.UIModule.hideModal('cidSearchModal');
    this.currentField = null;
    this.searchResults = [];
}/**
 * Escape HTML para evitar XSS
 */
escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}/**
 * Obter CIDs selecionados no documento
 */
getSelectedCIDs() {
    const cidFields = document.querySelectorAll('.cid-field.filled');
    const cids = [];    cidFields.forEach(field => {
        if (field.dataset.cidCodigo) {
            cids.push({
                codigo: field.dataset.cidCodigo,
                descricao: field.dataset.cidDescricao
            });
        }
    });    return cids;
}
}// Exportar instância única
window.CIDModule = new CIDModule();
