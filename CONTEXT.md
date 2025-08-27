# ReceituarioPro SaaS Overview

## Visão Geral
ReceituarioPro é um SaaS de geração de receituários médicos. A aplicação roda no navegador e utiliza módulos JavaScript para lidar com autenticação, templates de receitas, captura de assinatura e exportação em PDF.

## Stack Principal
- **Frontend:** HTML5, CSS3 (`css/app.css`), JavaScript modular.
- **Backend as a Service:** [Supabase](https://supabase.com) para autenticação, banco de dados e edge functions.
- **Pagamentos:** [Stripe](https://stripe.com) para gestão de assinaturas.
- **Envio de e-mails:** [Resend](https://resend.com) utilizado nas edge functions.
- **Outros:** `html2canvas` e `jsPDF` para exportação de receituários.

## Mudanças Propostas
1. **Externalizar chaves e URLs sensíveis**
   - Criar arquivo `.env` com `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STRIPE_PUBLIC_KEY`, `RESEND_API_KEY`, entre outras.
   - Injetar essas variáveis no `js/supabase-config.js` durante o build ou via script backend.
   - Remover qualquer chave embutida no frontend e rotacionar credenciais existentes.
2. **Remover código legado**
   - Arquivos como `css/styles.css` e `js/app.js` não são utilizados pelo `app`.
   - Consolidar funcionalidades duplicadas dos módulos antigos (`js/*.js`) nos módulos atuais (`js/modules`).
3. **Unificar utilitários de UI e templates**
   - Centralizar toasts e indicadores de carregamento no `js/modules/ui.module.js`.
   - Garantir que templates e lógica de prescrição estejam apenas em `templates.module.js` e `prescriptions.module.js`.

## Próximos Passos Sugeridos
- Rotacionar todas as chaves e configurar o projeto para ler variáveis de ambiente.
- Deletar arquivos e pastas legados após migração para módulos atualizados.
- Documentar o padrão de contribuição e organização de módulos.
- Criar testes automatizados para módulos críticos (autenticação, assinatura, exportação).

## Guia de Manutenção Rápida
| Tarefa | Local do Código |
|-------|----------------|
| Alterar template de receita | `js/modules/templates.module.js` |
| Ajustar lógica de assinatura/pagamento | `js/modules/subscription.module.js` |
| Alterar chaves/URLs de serviços | `.env` e `js/supabase-config.js` |
| Modificar estilo global | `css/app.css` |
| Alterar comportamento de toasts/loading | `js/modules/ui.module.js` |
| Atualizar exportação para PDF | `js/modules/export.module.js` |


## Status do Projeto

### 1. Landing Page (`index.html`)
- Design responsivo com gradientes
- Seções: Hero, Features, Stats, Pricing, FAQ
- Animações e interações
- Links para autenticação e pagamento

### 2. Sistema de Autenticação (`auth`)
- Login, cadastro e recuperação de senha
- Validação de campos
- Integração parcial com Supabase
- Modal de termos e condições (LGPD)

### 3. Configuração Supabase (`js/supabase-config.js`)
- Conexão configurada
- Funções de autenticação
- Funções de gestão de usuários
- Funções de receituários
- Funções administrativas

### 4. Estrutura do Banco de Dados

```sql
- users (profissionais com validação)
- subscriptions (planos e limites)
- prescriptions (receituários salvos)
- consent_records (LGPD)
```

### 5. Admin Backend
- Login de admin funcional
- Usuário admin: techne.br@gmail.com

### Notas
- Admin único: techne.br@gmail.com
- Sem necessidade de logs/audit trail
- Foco inicial em validações e dashboard
- Plano Professional será implementado depois

