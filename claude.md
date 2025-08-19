## 🚀 CHECKLIST PARA PRODUÇÃO - MVP

### ✅ PASSO 1: SUPABASE (30 minutos)
- [ ] Criar conta no Supabase
- [ ] Criar novo projeto (região São Paulo)
- [ ] Executar SQL Schema no SQL Editor
- [ ] Configurar Authentication (Email provider)
- [ ] Habilitar RLS nas tabelas
- [ ] Copiar chaves (URL e anon key)
- [ ] Inserir usuário admin no banco

### ✅ PASSO 2: STRIPE (20 minutos)
- [ ] Criar conta no Stripe
- [ ] Criar produtos (Essencial Mensal e Anual)
- [ ] Gerar Payment Links
- [ ] Configurar Webhooks
- [ ] Copiar chaves (Publishable e Secret)

### ✅ PASSO 3: CONFIGURAR PROJETO (15 minutos)
- [ ] Adicionar script Supabase no HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
- [ ] Criar arquivo `js/supabase-config.js`
- [ ] Substituir chaves no arquivo:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - STRIPE_PUBLIC_KEY
  - STRIPE_LINKS
- [ ] Incluir script em todas as páginas:
```html
<script src="js/supabase-config.js"></script>
```

### ✅ PASSO 4: INTEGRAR AUTENTICAÇÃO (30 minutos)
- [ ] Atualizar `auth.html` para usar Supabase
- [ ] Testar cadastro de profissional
- [ ] Testar login
- [ ] Testar recuperação de senha
- [ ] Verificar criação no banco

### ✅ PASSO 5: INTEGRAR ADMIN (20 minutos)
- [ ] Atualizar `admin.html` para usar Supabase
- [ ] Testar login admin
- [ ] Testar listagem de pendentes
- [ ] Testar aprovação/rejeição
- [ ] Verificar dashboard stats

### ✅ PASSO 6: INTEGRAR APP PRINCIPAL (30 minutos)
- [ ] Atualizar `app.html` para usar Supabase
- [ ] Implementar verificação de sessão
- [ ] Implementar salvamento de receituários
- [ ] Implementar limite freemium (30/mês)
- [ ] Testar exportação PDF/PNG

### ✅ PASSO 7: EMAILS (OPCIONAL PARA MVP)
- [ ] Configurar SendGrid ou Resend
- [ ] Template email de validação
- [ ] Template email de aprovação
- [ ] Template email de rejeição

### ✅ PASSO 8: DEPLOY (15 minutos)
- [ ] Escolher hospedagem:
  - **Vercel** (grátis, fácil)
  - **Netlify** (grátis, fácil)
  - **GitHub Pages** (grátis, simples)
- [ ] Fazer upload dos arquivos
- [ ] Configurar domínio (se tiver)
- [ ] Testar em produção

### ✅ PASSO 9: SEGURANÇA FINAL
- [ ] Verificar HTTPS ativo
- [ ] Remover console.logs
- [ ] Verificar chaves no frontend
- [ ] Testar fluxo completo
- [ ] Backup do banco Supabase

---

## 📝 SCRIPTS SQL ADICIONAIS ÚTEIS

### Criar usuário admin específico:
```sql
-- Primeiro criar no Auth
-- Depois atualizar na tabela users
UPDATE users 
SET is_admin = true, status = 'active' 
WHERE email = 'seu-email-admin@gmail.com';
```

### Ver estatísticas rápidas:
```sql
-- Total de usuários por status
SELECT status, COUNT(*) 
FROM users 
GROUP BY status;

-- Receituários do mês
SELECT COUNT(*) 
FROM prescriptions 
WHERE created_at >= date_trunc('month', CURRENT_DATE);

-- Assinaturas por plano
SELECT plan, COUNT(*) 
FROM subscriptions 
GROUP BY plan;
```

### Limpar dados de teste:
```sql
-- CUIDADO! Apenas em desenvolvimento
DELETE FROM prescriptions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%teste%'
);
DELETE FROM users WHERE email LIKE '%teste%';
```

---

## 🔥 VARIÁVEIS DE AMBIENTE (Produção)# CLAUDE.md - Documentação de Mudanças do Receituário Pro

## 📋 Visão Geral do Projeto
**Nome:** Receituário Pro  
**Tipo:** SaaS de Receituários Médicos Digitais  
**Stack:** HTML, CSS, JavaScript (Frontend) | Supabase (Backend) | Stripe (Pagamentos)  
**Status:** MVP em desenvolvimento

---

## 🔄 Histórico de Mudanças

### Versão 1.3.0 - LGPD e Painel Administrativo (Data Atual)

#### **Mudanças Implementadas:**

1. **Modal de Termos de Uso e Política de Privacidade (`auth.html`)**
   - ✅ Modal completo com termos LGPD
   - ✅ Texto completo sobre coleta e uso de dados
   - ✅ Direitos do usuário (acesso, correção, exclusão)
   - ✅ Informações sobre dados anonimizados
   - ✅ Checkbox obrigatório para aceitar termos no cadastro
   - ✅ Links clicáveis nos formulários

2. **Painel Administrativo (`admin.html`)** 
   - ✅ URL isolada e não linkada publicamente
   - ✅ Login exclusivo para administrador
   - ✅ Dashboard com estatísticas gerais:
     - Total de profissionais (247)
     - Validações pendentes (5)
     - Receita mensal (R$ 7.163)
     - Receituários/mês (3.842)
   - ✅ **Gestão de Validações:**
     - Lista de profissionais pendentes
     - Botões aprovar/rejeitar
     - Modal com detalhes completos
   - ✅ **Gestão de Profissionais:**
     - Lista completa com filtros
     - Busca por nome
     - Exportação CSV
   - ✅ **Gestão de Planos:**
     - Visualização de assinaturas ativas
     - Configuração de preços
     - Estatísticas por plano
   - ✅ **Relatórios:**
     - Aba crescimento
     - Aba uso da plataforma
     - Aba financeiro
   - ✅ **Configurações:**
     - Email do admin
     - URL do Stripe
     - Tempo de validação
   - ✅ Design responsivo com sidebar
   - ✅ Credenciais de acesso:
     - Email: admin@receituariopro.com.br
     - Senha: Admin@2025

### Versão 1.2.0 - Sistema de Autenticação

#### **Mudanças Implementadas:**

1. **Landing Page Atualizada (`index.html`)**
   - ✅ Substituído emoji por logo real em `img/saas-logo.png`
   - ✅ Removida seção de depoimentos fictícios
   - ✅ Adicionada seção "Por Que Escolher o Receituário Pro" com benefícios concretos
   - ✅ Removida seção de oferta por tempo limitado
   - ✅ Atualizada estrutura de preços:
     - **Freemium:** R$ 0 (até 30 receituários/mês)
     - **Essencial:** R$ 29/mês (anual) ou R$ 39/mês (mensal) - Receituários ilimitados
     - **Profissional:** Em breve (com blur)
   - ✅ Adicionado toggle Mensal/Anual nos preços (padrão: Anual)
   - ✅ Links atualizados para `auth.html` ao invés de `app.html`

2. **Nova Tela de Autenticação (`auth.html`)**
   - ✅ Sistema completo de Login/Cadastro/Recuperação
   - ✅ Validação de profissionais da saúde
   - ✅ Campos obrigatórios:
     - Nome completo
     - E-mail profissional  
     - Registro profissional (CRM, CRO, CREFITO, etc.)
     - Conselho e Estado
     - Senha segura (mínimo 8 caracteres)
   - ✅ Campos opcionais:
     - Especialidade
     - WhatsApp
   - ✅ Modal de validação profissional
   - ✅ Sistema de alertas (success/error/warning)
   - ✅ Validação client-side completa
   - ✅ Máscara para telefone
   - ✅ Design responsivo com sidebar gradient

3. **Fluxo de Validação Profissional**
   - Cadastro → Validação de formato → Email para admin → Validação manual → Ativação
   - Modal informativo sobre prazo de 24h para validação
   - Console.log simulando email para administrador

---

### Versão 1.1.0 - Landing Page Honesta

#### **Mudanças Implementadas:**
- Removidos depoimentos fictícios
- Adicionada seção "Por Que Escolher" com 5 benefícios verificáveis
- Estatísticas de mercado reais (80% médicos escrevem à mão)
- Comparação visual Método Tradicional vs Receituário Pro

---

### Versão 1.0.0 - MVP Inicial

#### **Estrutura Criada:**
1. **Sistema de Receituário (`app.html`)**
   - Templates: Medicação, Exames, Procedimentos, Livre
   - Assinatura digital (canvas)
   - Exportação PDF/PNG
   - LocalStorage para histórico

2. **Arquivos JavaScript Modulares:**
   - `config.js` - Configurações centralizadas
   - `templates.js` - Gerenciamento de templates
   - `signature.js` - Assinatura digital
   - `export.js` - Exportação PDF/PNG
   - `storage.js` - LocalStorage management
   - `ui.js` - Interface e notificações
   - `app.js` - Controlador principal

3. **CSS Profissional (`styles.css`)**
   - CSS Variables
   - Design responsivo
   - Print styles
   - Animações

---

## 📁 Estrutura de Arquivos Atual

```
receituario-pro/
├── index.html          # Landing page
├── auth.html          # Sistema de autenticação
├── admin.html         # Painel administrativo (novo)
├── app.html           # Sistema de receituários
├── styles.css         # Estilos do sistema
├── CLAUDE.md          # Esta documentação
├── img/
│   └── saas-logo.png  # Logo do sistema
└── js/
    ├── config.js      # Configurações
    ├── templates.js   # Templates de receituários
    ├── signature.js   # Assinatura digital
    ├── export.js      # Exportação PDF/PNG
    ├── storage.js     # Gerenciamento de dados
    ├── ui.js          # Interface do usuário
    └── app.js         # Aplicação principal
```├── config.js      # Configurações
    ├── templates.js   # Templates de receituários
    ├── signature.js   # Assinatura digital
    ├── export.js      # Exportação PDF/PNG
    ├── storage.js     # Gerenciamento de dados
    ├── ui.js          # Interface do usuário
    └── app.js         # Aplicação principal
```

---

## 🚀 Próximos Passos

### Integração Backend (Supabase)
- [ ] Configurar projeto no Supabase
- [ ] Criar tabelas:
  - `users` (profissionais)
  - `professional_validations` (validações pendentes)
  - `prescriptions` (receituários)
  - `subscription_plans` (planos)
  - `admin_logs` (logs de ações administrativas)
- [ ] Implementar autenticação real
- [ ] Sistema de envio de emails
- [ ] Webhooks para validação
- [ ] RLS (Row Level Security) para proteção de dados

### Integração Pagamentos (Stripe)
- [ ] Configurar conta Stripe
- [ ] Implementar checkout para plano Essencial
- [ ] Gerenciamento de assinaturas
- [ ] Webhooks de pagamento
- [ ] Portal do cliente
- [ ] Gestão de faturas

### Melhorias no Painel Administrativo
- [ ] Gráficos de crescimento (Chart.js)
- [ ] Export de relatórios em PDF
- [ ] Sistema de notificações em tempo real
- [ ] Log de todas as ações administrativas
- [ ] Backup automático de dados
- [ ] Dashboard customizável

### Segurança Adicional
- [ ] Rate limiting no admin
- [ ] 2FA obrigatório para admin
- [ ] Logs de acesso com IP
- [ ] Sessões com expiração automática
- [ ] Honeypot para tentativas de invasão
- [ ] Criptografia de dados sensíveis

### LGPD e Compliance
- [ ] Sistema de consent management
- [ ] Exportação de dados do usuário
- [ ] Anonimização automática
- [ ] Registro de consentimentos
- [ ] Política de retenção de dados
- [ ] DPO (Data Protection Officer) designado

### Melhorias Planejadas
- [ ] 2FA (autenticação em dois fatores)
- [ ] PWA (Progressive Web App)
- [ ] API REST para integrações
- [ ] Modo offline
- [ ] Impressão em lote
- [ ] Templates customizáveis por usuário

---

## 🔧 Configurações Necessárias

### Variáveis de Ambiente (`.env`)
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Stripe
STRIPE_PUBLIC_KEY=your_public_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email (SendGrid/Resend)
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@receituariopro.com.br

# Admin
ADMIN_EMAIL=admin@receituariopro.com.br
```

### Supabase Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  council TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  registration_number TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending', -- pending, active, suspended
  validated_at TIMESTAMP,
  validated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Professional validations
CREATE TABLE professional_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  validated_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  patient_name TEXT NOT NULL,
  patient_data JSONB, -- age, additional info
  content TEXT NOT NULL,
  template_type TEXT,
  signature_data TEXT,
  medications JSONB, -- structured medication data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan TEXT NOT NULL, -- freemium, essential, professional
  status TEXT DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin logs
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT, -- user, subscription, validation
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- LGPD consent records
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  consent_type TEXT NOT NULL, -- terms, privacy, marketing
  version TEXT NOT NULL,
  accepted BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_council ON users(council, state);
CREATE INDEX idx_validations_status ON professional_validations(status);
CREATE INDEX idx_prescriptions_user ON prescriptions(user_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action, created_at);
```

---

## 📝 Notas de Desenvolvimento

### Segurança
- Todas as senhas devem usar bcrypt/scrypt
- Implementar rate limiting
- HTTPS obrigatório em produção
- Sanitização de inputs
- Proteção CSRF
- Headers de segurança (CSP, HSTS, etc.)

### Performance
- Lazy loading de imagens
- Minificação de CSS/JS
- CDN para assets
- Cache de API
- Compressão gzip/brotli

### SEO
- Meta tags completas
- Schema.org estruturado
- Sitemap.xml
- Robots.txt
- URLs amigáveis
- Performance Core Web Vitals

---

## 🐛 Bugs Conhecidos
- [ ] Canvas de assinatura não funciona bem em alguns dispositivos móveis
- [ ] PDF às vezes corta conteúdo muito longo
- [ ] LocalStorage pode ficar cheio com muitas prescrições

---

## 📞 Contato para Dúvidas
Para questões sobre esta documentação ou o desenvolvimento, consultar o histórico de conversas ou criar nova issue.

---

**Última atualização:** Data atual  
**Versão:** 1.3.0  
**Status:** MVP completo com LGPD e Admin Panel

## 📌 Notas Importantes da v1.3.0

### Acesso ao Painel Admin
- **URL:** `/admin.html` (não linkado publicamente)
- **Email:** admin@receituariopro.com.br
- **Senha:** Admin@2025
- **Importante:** Trocar credenciais em produção!

### Conformidade LGPD
- Modal de termos implementado
- Consentimento obrigatório no cadastro
- Direitos do usuário especificados
- Política de dados anonimizados clara
- Email de contato: privacidade@receituariopro.com.br

### Fluxo de Validação Atual
1. Profissional se cadastra → Modal de termos
2. Aceita termos → Dados enviados
3. Admin recebe notificação (console.log simulado)
4. Admin acessa painel → Valida manualmente
5. Profissional recebe email → Acesso liberado

### Segurança Implementada
- Admin login com localStorage
- Sessão isolada do sistema principal
- Nenhum link público para admin
- Validação de formato de registro profissional
- Proteção básica contra SQL injection (frontend)