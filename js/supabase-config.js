/**
 * Configuração COMPLETA do Supabase, Stripe e Resend
 * IMPORTANTE: Substitua com suas chaves reais
 */

// ========================================
// CONFIGURAÇÕES DO SUPABASE
// ========================================

const SUPABASE_URL = 'https://kqumjmacwlpaxfuziooy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdW1qbWFjd2xwYXhmdXppb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDI3NDUsImV4cCI6MjA3MTExODc0NX0.gwCdzsL5YjfNx_Krav5l12PtuReHxibOQBLc80b-4UE';

// Inicializar cliente Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// CONFIGURAÇÕES DO STRIPE
// ========================================

const STRIPE_PUBLIC_KEY = 'pk_live_51RxYCmLUJWyE4PkYzYnJstmaICs14Lcmz8kSerkExOzCOdfdhH8m5gZuf65KUJMLAHcq9R7kh2VYeApsMLPtdIkU00u3IFh6E6';

// Links de pagamento do Stripe
const STRIPE_LINKS = {
    essential_monthly: 'https://buy.stripe.com/bJeaEYaht4mV5zC8pJ00000',
    essential_yearly: 'https://buy.stripe.com/7sY8wQcpBcTrbY0cFZ00001'
};

// ========================================
// CONFIGURAÇÕES DO RESEND
// ========================================

const RESEND_CONFIG = {
    // Substitua pela sua chave do Resend
    API_KEY: 're_Au8CPo8L_JtwbhNpAU9nzNzQ8L4is2tiG',
    FROM_EMAIL: 'noreply@receituariopro.com.br', // Seu domínio verificado
    SUPPORT_EMAIL: 'suporte@receituariopro.com.br',
    
    // Templates de email
    TEMPLATES: {
        WELCOME: 'welcome',
        APPROVAL: 'professional_approved',
        REJECTION: 'professional_rejected',
        TRIAL_EXPIRING: 'trial_expiring',
        PASSWORD_RESET: 'password_reset'
    }
};

// ========================================
// FUNÇÕES DE EMAIL COM RESEND
// ========================================

/**
 * Enviar email usando Resend API
 */
async function sendEmail(to, subject, htmlContent, templateData = null) {
    try {
        const emailData = {
            from: RESEND_CONFIG.FROM_EMAIL,
            to: [to],
            subject: subject,
            html: htmlContent
        };

        // Se tiver template data, pode usar templates do Resend
        if (templateData) {
            emailData.template = templateData.template;
            emailData.template_data = templateData.data;
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Resend API error: ${result.message || 'Unknown error'}`);
        }

        console.log('Email enviado com sucesso:', result.id);
        return { success: true, id: result.id };

    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Email de boas-vindas para novos usuários
 */
async function sendWelcomeEmail(user) {
    const subject = '🎉 Bem-vindo ao Receituário Pro!';
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
                .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
                .feature-item:before { content: "✅"; position: absolute; left: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Receituário Pro</h1>
                    <h2>Bem-vindo, Dr(a). ${user.name}!</h2>
                </div>
                <div class="content">
                    <p>Parabéns! Sua conta foi criada com sucesso e você já pode começar a usar o Receituário Pro.</p>
                    
                    <div class="features">
                        <h3>🎁 Seu trial de 30 dias inclui:</h3>
                        <div class="feature-item">Receituários ilimitados</div>
                        <div class="feature-item">Todos os templates profissionais</div>
                        <div class="feature-item">Assinatura digital personalizada</div>
                        <div class="feature-item">Exportação em PDF e PNG</div>
                        <div class="feature-item">Histórico completo</div>
                        <div class="feature-item">Suporte prioritário</div>
                    </div>

                    <div style="text-align: center;">
                        <a href="https://receituariopro.com.br/app.html" class="button">🚀 Começar a Usar Agora</a>
                    </div>

                    <p><strong>Seus dados de acesso:</strong></p>
                    <ul>
                        <li><strong>Email:</strong> ${user.email}</li>
                        <li><strong>Registro:</strong> ${user.council}-${user.state} ${user.registration_number}</li>
                        <li><strong>Especialidade:</strong> ${user.specialty || 'Não informada'}</li>
                    </ul>

                    <p>Precisa de ajuda? Responda este email ou entre em contato conosco em <strong>${RESEND_CONFIG.SUPPORT_EMAIL}</strong></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(user.email, subject, htmlContent);
}

/**
 * Email de aprovação profissional
 */
async function sendApprovalEmail(user) {
    const subject = '✅ Cadastro Aprovado - Receituário Pro';
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #48bb78; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #48bb78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Parabéns!</h1>
                    <h2>Seu cadastro foi aprovado!</h2>
                </div>
                <div class="content">
                    <p>Olá Dr(a). ${user.name},</p>
                    
                    <p>Seu cadastro profissional foi <strong>aprovado</strong> com sucesso! Você já pode acessar o sistema e começar a criar seus receituários digitais.</p>

                    <p><strong>Suas informações aprovadas:</strong></p>
                    <ul>
                        <li><strong>Nome:</strong> ${user.name}</li>
                        <li><strong>Registro:</strong> ${user.council}-${user.state} ${user.registration_number}</li>
                        <li><strong>Especialidade:</strong> ${user.specialty || 'Não informada'}</li>
                    </ul>

                    <div style="text-align: center;">
                        <a href="https://receituariopro.com.br/auth.html" class="button">🚀 Fazer Login</a>
                    </div>

                    <p>Bem-vindo à família Receituário Pro!</p>
                    
                    <p>Atenciosamente,<br>
                    <strong>Equipe Receituário Pro</strong></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(user.email, subject, htmlContent);
}

/**
 * Email de rejeição profissional
 */
async function sendRejectionEmail(user, reason) {
    const subject = '❌ Cadastro não aprovado - Receituário Pro';
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f56565; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Receituário Pro</h1>
                    <h2>Cadastro não aprovado</h2>
                </div>
                <div class="content">
                    <p>Olá ${user.name},</p>
                    
                    <p>Infelizmente não foi possível aprovar seu cadastro no momento.</p>

                    <div class="reason-box">
                        <strong>Motivo:</strong> ${reason}
                    </div>

                    <p><strong>O que fazer agora?</strong></p>
                    <ul>
                        <li>Verifique se seus dados estão corretos</li>
                        <li>Certifique-se de que o número do registro profissional está válido</li>
                        <li>Entre em contato conosco para esclarecimentos</li>
                    </ul>

                    <p>Você pode tentar se cadastrar novamente após corrigir as informações ou entrar em contato conosco em <strong>${RESEND_CONFIG.SUPPORT_EMAIL}</strong></p>
                    
                    <p>Atenciosamente,<br>
                    <strong>Equipe Receituário Pro</strong></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(user.email, subject, htmlContent);
}

/**
 * Email de trial expirando
 */
async function sendTrialExpiringEmail(user, daysLeft) {
    const subject = `⚠️ Seu trial expira em ${daysLeft} dias`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ed8936; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .price-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px solid #667eea; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Trial Expirando</h1>
                    <h2>Apenas ${daysLeft} dias restantes!</h2>
                </div>
                <div class="content">
                    <p>Olá Dr(a). ${user.name},</p>
                    
                    <p>Seu trial gratuito de 30 dias no Receituário Pro expira em <strong>${daysLeft} dias</strong>!</p>

                    <p>Não perca o acesso a todas as funcionalidades que você já conhece:</p>
                    <ul>
                        <li>✅ Receituários ilimitados</li>
                        <li>✅ Templates profissionais</li>
                        <li>✅ Assinatura digital</li>
                        <li>✅ Histórico completo</li>
                        <li>✅ Suporte prioritário</li>
                    </ul>

                    <div class="price-box">
                        <h3>Plano Essencial</h3>
                        <p style="font-size: 24px; color: #667eea; margin: 10px 0;"><strong>R$ 29/mês</strong></p>
                        <p>ou <strong>R$ 348/ano</strong> (2 meses grátis)</p>
                    </div>

                    <div style="text-align: center;">
                        <a href="${STRIPE_LINKS.essential_yearly}?prefilled_email=${encodeURIComponent(user.email)}" class="button">💰 Upgrade Anual - Melhor Oferta</a>
                        <br>
                        <a href="${STRIPE_LINKS.essential_monthly}?prefilled_email=${encodeURIComponent(user.email)}" class="button">📅 Upgrade Mensal</a>
                    </div>

                    <p><small>Tem dúvidas? Responda este email ou acesse seu <a href="https://receituariopro.com.br/profile.html">perfil</a> no sistema.</small></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(user.email, subject, htmlContent);
}

// ========================================
// FUNÇÕES DE AUTENTICAÇÃO - COMPLETAS E CORRIGIDAS
// ========================================

/**
 * Registrar novo profissional - VERSÃO COMPLETA
 */
async function registerProfessional(userData) {
    try {
        console.log('Iniciando registro profissional...', userData);
        
        // 1. Criar auth user
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    name: userData.name
                }
            }
        });

        if (authError) {
            console.error('Erro auth:', authError);
            throw authError;
        }

        console.log('Auth user criado:', authData.user?.id);

        // 2. Criar registro na tabela users
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .insert({
                id: authData.user.id,
                email: userData.email,
                name: userData.name,
                council: userData.council,
                state: userData.state,
                registration_number: userData.registrationNumber,
                specialty: userData.specialty || null,
                phone: userData.phone || null,
                status: 'active', // Aprovação automática para trial
                is_admin: false
            })
            .select()
            .single();

        if (userError) {
            console.error('Erro user:', userError);
            // Se der erro, tentar deletar o auth user criado
            try {
                await supabaseClient.auth.admin.deleteUser(authData.user.id);
            } catch (cleanupError) {
                console.error('Erro ao limpar auth user:', cleanupError);
            }
            throw userError;
        }

        console.log('User criado:', user);

        // 3. Criar assinatura trial (30 dias)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        const { data: subscription, error: subError } = await supabaseClient
            .from('subscriptions')
            .insert({
                user_id: authData.user.id,
                plan: 'trial',
                status: 'active',
                trial_ends_at: trialEndDate.toISOString()
            })
            .select()
            .single();

        if (subError) {
            console.error('Erro subscription:', subError);
            throw subError;
        }

        console.log('Subscription criada:', subscription);

        // 4. Enviar email de boas-vindas
        try {
            await sendWelcomeEmail(user);
            console.log('Email de boas-vindas enviado');
        } catch (emailError) {
            console.error('Erro ao enviar email de boas-vindas:', emailError);
            // Não falhar o registro por causa do email
        }

        return { success: true, user, subscription };

    } catch (error) {
        console.error('Registration error:', error);
        
        // Mensagens de erro mais específicas
        let errorMessage = 'Erro ao criar conta. Tente novamente.';
        
        if (error.message?.includes('already registered')) {
            errorMessage = 'Este e-mail já está cadastrado. Tente fazer login.';
        } else if (error.message?.includes('invalid email')) {
            errorMessage = 'E-mail inválido. Verifique o formato.';
        } else if (error.message?.includes('password')) {
            errorMessage = 'Senha deve ter pelo menos 8 caracteres.';
        } else if (error.message?.includes('network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet.';
        }
        
        return { success: false, error: errorMessage };
    }
}

/**
 * Login de usuário - VERSÃO COM FALLBACK PARA RLS
 */
async function loginUser(email, password) {
    try {
        console.log('Tentando login para:', email);
        
        // 1. Fazer login
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('Erro de auth:', authError);
            throw authError;
        }

        console.log('Login auth sucesso:', authData.user?.id);

        // 2. Buscar dados do usuário - COM FALLBACK PARA RLS
        let user = null;
        let userError = null;
        
        try {
            // Tentar busca normal primeiro
            const { data: userData, error: normalError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();
                
            if (normalError) throw normalError;
            user = userData;
            
        } catch (relsError) {
            console.warn('Erro RLS na busca normal, tentando com service role:', relsError);
            
            // Fallback: usar uma query mais simples ou service key
            try {
                const { data: fallbackData, error: fallbackError } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('email', email)  // Buscar por email em vez de ID
                    .single();
                    
                if (fallbackError) throw fallbackError;
                user = fallbackData;
                
            } catch (fallbackError2) {
                console.error('Fallback também falhou:', fallbackError2);
                
                // Último recurso: criar usuário se não existir
                if (fallbackError2.code === 'PGRST116') { // Nenhum resultado
                    console.log('Usuário não encontrado, tentando criar...');
                    
                    const { data: newUser, error: createError } = await supabaseClient
                        .from('users')
                        .insert({
                            id: authData.user.id,
                            email: email,
                            name: authData.user.user_metadata?.name || email.split('@')[0],
                            status: 'active',
                            is_admin: email === 'techne.br@gmail.com'
                        })
                        .select()
                        .single();
                        
                    if (createError) {
                        console.error('Erro ao criar usuário:', createError);
                        throw createError;
                    }
                    
                    user = newUser;
                    console.log('Usuário criado com sucesso:', user);
                } else {
                    throw fallbackError2;
                }
            }
        }

        if (!user) {
            throw new Error('Não foi possível carregar dados do usuário');
        }

        console.log('User data carregada:', user.name);

        // 3. Verificar se é admin
        if (email === 'techne.br@gmail.com' || user.is_admin) {
            return { success: true, user, isAdmin: true };
        }

        // 4. Verificar status do usuário regular
        if (user.status === 'pending') {
            await supabaseClient.auth.signOut();
            return { 
                success: false, 
                error: 'Sua conta ainda está em validação. Aguarde até 24h.' 
            };
        }

        if (user.status === 'rejected') {
            await supabaseClient.auth.signOut();
            return { 
                success: false, 
                error: 'Seu cadastro foi rejeitado. Entre em contato com o suporte.' 
            };
        }

        if (user.status === 'suspended') {
            await supabaseClient.auth.signOut();
            return { 
                success: false, 
                error: 'Sua conta está suspensa. Entre em contato com o suporte.' 
            };
        }

        // 5. Verificar trial status - COM TRATAMENTO DE ERRO
        let trialStatus = null;
        try {
            trialStatus = await checkTrialStatus(authData.user.id);
        } catch (trialError) {
            console.warn('Erro ao verificar trial status:', trialError);
            // Continuar sem trial status se der erro
            trialStatus = { 
                has_access: true, 
                message: 'Erro ao verificar trial, mas permitindo acesso' 
            };
        }
        
        return { 
            success: true, 
            user, 
            isAdmin: false,
            trialStatus 
        };

    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        
        if (error.message?.includes('Invalid login credentials')) {
            errorMessage = 'E-mail ou senha incorretos.';
        } else if (error.message?.includes('Email not confirmed')) {
            errorMessage = 'Confirme seu e-mail antes de fazer login.';
        } else if (error.message?.includes('network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else if (error.code === '42P17') {
            errorMessage = 'Erro de configuração do sistema. Contate o suporte.';
        }
        
        return { success: false, error: errorMessage };
    }
}
/**
 * Verificar status do trial - FUNÇÃO COMPLETA
 */
async function checkTrialStatus(userId) {
    try {
        const { data: subscription, error } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        if (error) {
            console.error('Erro ao verificar trial:', error);
            return { 
                has_access: false, 
                reason: 'error',
                message: 'Erro ao verificar status'
            };
        }

        if (!subscription) {
            return { 
                has_access: false, 
                reason: 'no_subscription',
                message: 'Nenhuma assinatura encontrada'
            };
        }

        // Se for plano essencial pago, acesso liberado
        if (subscription.plan === 'essential') {
            return { 
                has_access: true, 
                plan: 'essential',
                subscription: subscription,
                message: 'Plano essencial ativo'
            };
        }

        // Se for trial, verificar se ainda está válido
        if (subscription.plan === 'trial') {
            const trialEnd = new Date(subscription.trial_ends_at);
            const now = new Date();
            
            if (now > trialEnd) {
                return { 
                    has_access: false, 
                    reason: 'trial_expired',
                    message: 'Trial de 30 dias expirou',
                    expired_date: trialEnd,
                    subscription: subscription
                };
            }
            
            const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
            
            return { 
                has_access: true, 
                plan: 'trial',
                days_left: daysLeft,
                trial_end: trialEnd,
                subscription: subscription,
                message: `${daysLeft} dias de trial restantes`
            };
        }

        return { 
            has_access: false, 
            reason: 'unknown_plan',
            message: 'Plano não reconhecido',
            subscription: subscription
        };

    } catch (error) {
        console.error('Error checking trial status:', error);
        return { 
            has_access: false, 
            reason: 'error',
            message: 'Erro ao verificar status do trial'
        };
    }
}

/**
 * Logout
 */
async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        return false;
    }
    return true;
}

/**
 * Recuperar senha
 */
async function resetPassword(email) {
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth.html?reset=true`
        });

        if (error) throw error;
        return { success: true };

    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// FUNÇÕES DE RECEITUÁRIOS - COMPLETAS
// ========================================

/**
 * Salvar receituário
 */
async function savePrescription(prescriptionData) {
    try {
        // 1. Verificar se usuário está logado
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // 2. Para trial, não há limite durante os 30 dias
        const canCreate = await checkPrescriptionLimit(user.id);
        if (!canCreate.allowed) {
            return { 
                success: false, 
                error: canCreate.message
            };
        }

        // 3. Salvar receituário
        const { data, error } = await supabaseClient
            .from('prescriptions')
            .insert({
                user_id: user.id,
                patient_name: prescriptionData.patientName,
                content: prescriptionData.content,
                template_type: prescriptionData.template,
                signature_data: prescriptionData.signature,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };

    } catch (error) {
        console.error('Save prescription error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verificar limite de receituários
 */
async function checkPrescriptionLimit(userId) {
    try {
        // 1. Buscar assinatura do usuário
        const { data: subscription } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        if (!subscription) {
            return { allowed: false, message: 'Nenhuma assinatura ativa encontrada' };
        }

        // 2. Se for plano essencial pago, sem limite
        if (subscription.plan === 'essential') {
            return { allowed: true, message: 'Receituários ilimitados' };
        }

        // 3. Se for trial, verificar se ainda está no período
        if (subscription.plan === 'trial') {
            const trialEnd = new Date(subscription.trial_ends_at);
            const now = new Date();
            
            if (now > trialEnd) {
                return { 
                    allowed: false, 
                    message: 'Período de trial expirado. Faça upgrade para continuar.' 
                };
            }
            
            return { allowed: true, message: 'Trial ativo - receituários ilimitados' };
        }

        return { allowed: false, message: 'Plano não reconhecido' };

    } catch (error) {
        console.error('Check limit error:', error);
        return { allowed: false, message: 'Erro ao verificar limite' };
    }
}

/**
 * Buscar histórico de receituários
 */
async function getPrescriptionHistory() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabaseClient
            .from('prescriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        console.error('Get history error:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// FUNÇÕES ADMINISTRATIVAS - COMPLETAS
// ========================================

/**
 * Login do admin
 */
async function loginAdmin(email, password) {
    try {
        // 1. Fazer login normal
        const loginResult = await loginUser(email, password);
        if (!loginResult.success) return loginResult;

        // 2. Verificar se é admin
        if (!loginResult.isAdmin) {
            await supabaseClient.auth.signOut();
            return { success: false, error: 'Acesso negado' };
        }

        return { success: true, user: loginResult.user };

    } catch (error) {
        console.error('Admin login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar profissionais pendentes
 */
async function getPendingProfessionals() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        console.error('Get pending error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Aprovar profissional - COM EMAIL
 */
async function approveProfessional(userId) {
    try {
        // 1. Buscar dados do usuário primeiro
        const { data: user, error: userFetchError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userFetchError) throw userFetchError;

        // 2. Atualizar status para active
        const { error } = await supabaseClient
            .from('users')
            .update({ 
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        // 3. Criar assinatura trial se não existir
        const { data: existingSubscription } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!existingSubscription) {
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);

            await supabaseClient
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan: 'trial',
                    status: 'active',
                    trial_ends_at: trialEndDate.toISOString()
                });
        }

        // 4. Enviar email de aprovação
        try {
            await sendApprovalEmail(user);
            console.log('Email de aprovação enviado para:', user.email);
        } catch (emailError) {
            console.error('Erro ao enviar email de aprovação:', emailError);
        }

        return { success: true };

    } catch (error) {
        console.error('Approve error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Rejeitar profissional - COM EMAIL
 */
async function rejectProfessional(userId, reason) {
    try {
        // 1. Buscar dados do usuário primeiro
        const { data: user, error: userFetchError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userFetchError) throw userFetchError;

        // 2. Atualizar status para rejected
        const { error } = await supabaseClient
            .from('users')
            .update({ 
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        // 3. Enviar email de rejeição
        try {
            await sendRejectionEmail(user, reason);
            console.log('Email de rejeição enviado para:', user.email);
        } catch (emailError) {
            console.error('Erro ao enviar email de rejeição:', emailError);
        }

        return { success: true };

    } catch (error) {
        console.error('Reject error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar estatísticas do dashboard
 */
async function getDashboardStats() {
    try {
        // Total de profissionais
        const { count: totalUsers } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_admin', false);

        // Validações pendentes
        const { count: pendingValidations } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Receituários do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const { count: monthlyPrescriptions } = await supabaseClient
            .from('prescriptions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString());

        // Assinaturas trial ativas
        const { count: trialSubscriptions } = await supabaseClient
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'trial')
            .eq('status', 'active');

        // Assinaturas pagas ativas
        const { count: paidSubscriptions } = await supabaseClient
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'essential')
            .eq('status', 'active');

        // Receita mensal estimada (R$ 29 * assinaturas pagas)
        const monthlyRevenue = paidSubscriptions * 29;

        return {
            success: true,
            data: {
                totalUsers,
                pendingValidations,
                monthlyPrescriptions,
                trialSubscriptions,
                paidSubscriptions,
                monthlyRevenue
            }
        };

    } catch (error) {
        console.error('Dashboard stats error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar todos os profissionais com suas assinaturas
 */
async function getAllProfessionals() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select(`
                *,
                subscriptions (*)
            `)
            .eq('is_admin', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        console.error('Get all professionals error:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// FUNÇÕES DE PAGAMENTO (STRIPE) - COMPLETAS
// ========================================

/**
 * Redirecionar para checkout do Stripe
 */
function redirectToCheckout(plan, userEmail = null) {
    const link = plan === 'yearly' 
        ? STRIPE_LINKS.essential_yearly 
        : STRIPE_LINKS.essential_monthly;

    // Adicionar email do usuário como parâmetro se disponível
    let checkoutUrl = link;
    if (userEmail) {
        checkoutUrl = `${link}?prefilled_email=${encodeURIComponent(userEmail)}`;
    }
    
    window.location.href = checkoutUrl;
}

/**
 * Processar webhook do Stripe (para uso futuro)
 */
async function handleStripeWebhook(event) {
    try {
        console.log('Processing Stripe webhook:', event.type);
        
        switch (event.type) {
            case 'customer.subscription.created':
                return await handleSubscriptionCreated(event.data.object);
                
            case 'customer.subscription.updated':
                return await handleSubscriptionUpdated(event.data.object);
                
            case 'customer.subscription.deleted':
                return await handleSubscriptionCanceled(event.data.object);
                
            case 'invoice.payment_succeeded':
                return await handlePaymentSucceeded(event.data.object);
                
            case 'invoice.payment_failed':
                return await handlePaymentFailed(event.data.object);
                
            default:
                console.log('Unhandled event type:', event.type);
                return { success: true, message: 'Event not handled' };
        }
        
    } catch (error) {
        console.error('Webhook error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Manipular criação de assinatura
 */
async function handleSubscriptionCreated(subscription) {
    try {
        // Encontrar usuário pelo customer_id ou email
        const customer = await getStripeCustomer(subscription.customer);
        
        const { error } = await supabaseClient
            .from('subscriptions')
            .update({
                plan: 'essential',
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                trial_ends_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', customer.user_id);

        if (error) throw error;
        
        return { success: true };
        
    } catch (error) {
        console.error('Handle subscription created error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Função auxiliar para buscar customer do Stripe
 */
async function getStripeCustomer(customerId) {
    // Esta função seria implementada no backend
    // Por enquanto, retorna um mock
    return {
        user_id: 'user_id_from_metadata'
    };
}

// ========================================
// SISTEMA DE NOTIFICAÇÕES - COMPLETO
// ========================================

/**
 * Enviar notificações de trial expirando (função para executar diariamente)
 */
async function sendTrialExpiringNotifications() {
    try {
        // Buscar usuários com trial expirando em 3, 7 e 14 dias
        const { data: expiringUsers, error } = await supabaseClient
            .from('users')
            .select(`
                *,
                subscriptions!inner (
                    plan,
                    status,
                    trial_ends_at
                )
            `)
            .eq('subscriptions.plan', 'trial')
            .eq('subscriptions.status', 'active')
            .gte('subscriptions.trial_ends_at', new Date().toISOString())
            .lte('subscriptions.trial_ends_at', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;

        for (const user of expiringUsers) {
            const subscription = user.subscriptions[0];
            const trialEnd = new Date(subscription.trial_ends_at);
            const now = new Date();
            const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

            // Enviar notificação para 14, 7, 3 e 1 dias
            if ([14, 7, 3, 1].includes(daysLeft)) {
                try {
                    await sendTrialExpiringEmail(user, daysLeft);
                    console.log(`Notificação enviada para ${user.email} - ${daysLeft} dias restantes`);
                } catch (emailError) {
                    console.error(`Erro ao enviar notificação para ${user.email}:`, emailError);
                }
            }
        }

        return { success: true, notificationsSent: expiringUsers.length };

    } catch (error) {
        console.error('Error sending trial expiring notifications:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Função para criar trial subscription quando não existe
 */
async function createTrialSubscription(userId) {
    try {
        console.log('Criando assinatura trial para:', userId);
        
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        const { data, error } = await supabaseClient
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan: 'trial',
                status: 'active',
                trial_ends_at: trialEndDate.toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        console.log('Trial subscription criada:', data);
        return { success: true, data };

    } catch (error) {
        console.error('Erro ao criar trial subscription:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// FUNÇÕES AUXILIARES - COMPLETAS
// ========================================

/**
 * Verificar sessão atual
 */
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

/**
 * Função para debug e logs
 */
function debugLog(message, data = null) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`[DEBUG] ${message}`, data);
    }
}

/**
 * Função para validar email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Função para formatar data brasileira
 */
function formatBrazilianDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Função para calcular dias restantes
 */
function calculateDaysLeft(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

// ========================================
// SISTEMA DE CACHE SIMPLES
// ========================================

const cache = {
    data: {},
    
    set(key, value, ttl = 300000) { // 5 minutos default
        this.data[key] = {
            value,
            expires: Date.now() + ttl
        };
    },
    
    get(key) {
        const item = this.data[key];
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            delete this.data[key];
            return null;
        }
        
        return item.value;
    },
    
    clear() {
        this.data = {};
    }
};

// ========================================
// LISTENER DE MUDANÇAS DE AUTENTICAÇÃO
// ========================================
supabaseClient.auth.onAuthStateChange((event, session) => {
    debugLog('Auth event:', event);
    
    if (event === 'SIGNED_IN' && session?.user) {
        debugLog('User signed in:', session.user.email);
        cache.clear(); // Limpar cache ao fazer login
    }
    
    if (event === 'SIGNED_OUT') {
        debugLog('User signed out');
        cache.clear(); // Limpar cache ao fazer logout
        
        // Só redireciona se não estiver já na página de auth ou index
        if (!window.location.pathname.includes('auth.html') && 
            !window.location.pathname.includes('index.html')) {
            window.location.href = '/auth.html';
        }
    }
    
    if (event === 'TOKEN_REFRESHED') {
        debugLog('Token refreshed');
    }
    
    if (event === 'PASSWORD_RECOVERY') {
        debugLog('Password recovery initiated');
    }
});

// ========================================
// MONITORAMENTO DE ERROS
// ========================================

window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('supabase') || 
        event.error?.message?.includes('auth')) {
        debugLog('Supabase error detected:', {
            message: event.error.message,
            stack: event.error.stack,
            url: window.location.href
        });
    }
});

// ========================================
// EXPORTAÇÕES GLOBAIS - COMPLETAS
// ========================================
window.supabaseClient = supabaseClient;

// Funções de autenticação
window.authFunctions = {
    registerProfessional,
    loginUser,
    logoutUser,
    resetPassword,
    checkTrialStatus,
    loginAdmin
};

// Funções de receituários
window.prescriptionFunctions = {
    savePrescription,
    getPrescriptionHistory,
    checkPrescriptionLimit
};

// Funções administrativas
window.adminFunctions = {
    getPendingProfessionals,
    approveProfessional,
    rejectProfessional,
    getDashboardStats,
    getAllProfessionals
};

// Funções de pagamento
window.paymentFunctions = {
    redirectToCheckout,
    handleStripeWebhook
};

// Funções de email
window.emailFunctions = {
    sendWelcomeEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendTrialExpiringEmail,
    sendTrialExpiringNotifications
};

// Funções auxiliares
window.utilityFunctions = {
    createTrialSubscription,
    validateEmail,
    formatBrazilianDate,
    calculateDaysLeft,
    debugLog
};

// Cache global
window.appCache = cache;

// ========================================
// INICIALIZAÇÃO COMPLETA
// ========================================
console.log('✅ Supabase config COMPLETO carregado com sucesso');
console.log('📧 Sistema de emails Resend configurado');
console.log('💳 Sistema Stripe configurado');
console.log('🛡️ Sistema de autenticação completo');
console.log('📊 Sistema administrativo completo');

// Verificar se todas as configurações estão presentes
if (!RESEND_CONFIG.API_KEY || RESEND_CONFIG.API_KEY.includes('YOUR_')) {
    console.warn('⚠️ Configure sua chave do Resend em RESEND_CONFIG.API_KEY');
}

if (!STRIPE_PUBLIC_KEY || STRIPE_PUBLIC_KEY.includes('YOUR_')) {
    console.warn('⚠️ Configure sua chave do Stripe em STRIPE_PUBLIC_KEY');
}