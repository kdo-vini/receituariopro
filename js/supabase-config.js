/**
 * Configuração do Supabase e Stripe
 * IMPORTANTE: Substitua com suas chaves reais
 */

// ========================================
// CONFIGURAÇÕES DO SUPABASE
// ========================================

const SUPABASE_URL = 'https://kqumjmacwlpaxfuziooy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdW1qbWFjd2xwYXhmdXppb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDI3NDUsImV4cCI6MjA3MTExODc0NX0.gwCdzsL5YjfNx_Krav5l12PtuReHxibOQBLc80b-4UE';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
// FUNÇÕES DE AUTENTICAÇÃO
// ========================================

// Adicione estas funções ao seu supabase-config.js

/**
 * Registrar novo profissional COM EMAIL CUSTOMIZADO
 */
async function registerProfessionalWithCustomEmail(userData) {
    try {
        // 1. Criar auth user SEM enviar email automático do Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                emailRedirectTo: `${window.location.origin}/confirm.html`,
                data: {
                    name: userData.name
                }
            }
        });

        if (authError) throw authError;

        // 2. Criar registro na tabela users
        const { data: user, error: userError } = await supabase
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
                status: 'active',
                is_admin: false
            })
            .select()
            .single();

        if (userError) throw userError;

        // 3. Criar assinatura trial (30 dias)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: authData.user.id,
                plan: 'trial',
                status: 'active',
                trial_ends_at: trialEndDate.toISOString()
            });

        if (subError) throw subError;

        // 4. Enviar email de boas-vindas via Resend
        await sendCustomEmail('welcome', userData.email, {
            name: userData.name,
            confirmLink: `${window.location.origin}/confirm.html#type=signup&access_token=${authData.session?.access_token}&refresh_token=${authData.session?.refresh_token}`
        });

        return { success: true, user };

    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reset de senha COM EMAIL CUSTOMIZADO
 */
async function resetPasswordWithCustomEmail(email) {
    try {
        // Gerar link de reset
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/confirm.html`
        });

        if (error) throw error;

        // Enviar email customizado via Resend
        await sendCustomEmail('reset', email, {
            resetLink: `${window.location.origin}/confirm.html#type=recovery`
        });

        return { success: true };

    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Enviar email customizado via Edge Function
 */
async function sendCustomEmail(type, to, data) {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                type,
                to,
                data
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send email');
        }

        return await response.json();

    } catch (error) {
        console.error('Email send error:', error);
        // Fallback para email padrão do Supabase se falhar
        return null;
    }
}

/**
 * Verificar e notificar trials expirando
 */
async function checkExpiringTrials() {
    try {
        // Buscar trials que expiram em 3 dias
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        const { data: expiringTrials, error } = await supabase
            .from('subscriptions')
            .select('*, users!inner(*)')
            .eq('plan', 'trial')
            .eq('status', 'active')
            .lte('trial_ends_at', threeDaysFromNow.toISOString())
            .gte('trial_ends_at', new Date().toISOString());

        if (error) throw error;

        // Enviar emails para cada usuário
        for (const subscription of expiringTrials) {
            await sendCustomEmail('trial_ending', subscription.users.email, {
                name: subscription.users.name,
                daysLeft: Math.ceil((new Date(subscription.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
            });
        }

    } catch (error) {
        console.error('Check expiring trials error:', error);
    }
}

// Configuração do Stripe Checkout com metadados
function redirectToStripeCheckout(plan, userId, email) {
    const link = plan === 'yearly' 
        ? STRIPE_LINKS.essential_yearly 
        : STRIPE_LINKS.essential_monthly;

    // Adicionar parâmetros para identificar o usuário
    const checkoutUrl = `${link}?prefilled_email=${encodeURIComponent(email)}&client_reference_id=${userId}`;
    
    window.location.href = checkoutUrl;
}

// Atualizar as funções exportadas
window.authFunctions = {
    registerProfessional: registerProfessionalWithCustomEmail, // Usar a versão com email customizado
    loginUser,
    logoutUser,
    resetPassword: resetPasswordWithCustomEmail, // Usar a versão com email customizado
    loginAdmin,
    sendCustomEmail,
    checkExpiringTrials
};

/**
 * Login de usuário
 */
async function loginUser(email, password) {
    try {
        // 1. Fazer login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;

        // 2. Buscar dados do usuário
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError) throw userError;

        // 3. Verificar se é admin
        if (email === 'techne.br@gmail.com' || user.is_admin) {
            return { success: true, user, isAdmin: true };
        }

        // 4. Verificar status do usuário regular
        if (user.status === 'pending') {
            await supabase.auth.signOut();
            return { 
                success: false, 
                error: 'Sua conta ainda está em validação. Aguarde até 24h.' 
            };
        }

        if (user.status === 'rejected') {
            await supabase.auth.signOut();
            return { 
                success: false, 
                error: 'Seu cadastro foi rejeitado. Entre em contato com o suporte.' 
            };
        }

        if (user.status === 'suspended') {
            await supabase.auth.signOut();
            return { 
                success: false, 
                error: 'Sua conta está suspensa. Entre em contato com o suporte.' 
            };
        }

        return { success: true, user, isAdmin: false };

    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Logout
 */
async function logoutUser() {
    const { error } = await supabase.auth.signOut();
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
// FUNÇÕES DE RECEITUÁRIOS
// ========================================

/**
 * Salvar receituário
 */
async function savePrescription(prescriptionData) {
    try {
        // 1. Verificar se usuário está logado
        const { data: { user } } = await supabase.auth.getUser();
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
        const { data, error } = await supabase
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
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
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
// FUNÇÕES ADMINISTRATIVAS
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
            await supabase.auth.signOut();
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
        const { data, error } = await supabase
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
 * Aprovar profissional
 */
async function approveProfessional(userId) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };

    } catch (error) {
        console.error('Approve error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Rejeitar profissional
 */
async function rejectProfessional(userId, reason) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

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
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_admin', false);

        // Validações pendentes
        const { count: pendingValidations } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Receituários do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const { count: monthlyPrescriptions } = await supabase
            .from('prescriptions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString());

        // Assinaturas trial ativas
        const { count: trialSubscriptions } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'trial')
            .eq('status', 'active');

        // Assinaturas pagas ativas
        const { count: paidSubscriptions } = await supabase
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

// ========================================
// FUNÇÕES DE PAGAMENTO (STRIPE)
// ========================================

/**
 * Redirecionar para checkout do Stripe
 */
function redirectToCheckout(plan) {
    const { data: { user } } = supabase.auth.getUser();
    if (!user) {
        alert('Faça login primeiro');
        return;
    }

    const link = plan === 'yearly' 
        ? STRIPE_LINKS.essential_yearly 
        : STRIPE_LINKS.essential_monthly;

    // Adicionar email do usuário como parâmetro
    const checkoutUrl = `${link}?prefilled_email=${encodeURIComponent(user.email)}`;
    
    window.location.href = checkoutUrl;
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Verificar sessão atual
 */
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Listener de mudanças de autenticação
 */
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
    }
    
    if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        // Só redireciona se não estiver já na página de auth
        if (!window.location.pathname.includes('auth.html') && 
            !window.location.pathname.includes('index.html')) {
            window.location.href = '/auth.html';
        }
    }
    
});

// Exportar para uso global
window.supabaseClient = supabase;
window.authFunctions = {
    registerProfessional,
    loginUser,
    logoutUser,
    resetPassword,
    loginAdmin
};
window.prescriptionFunctions = {
    savePrescription,
    getPrescriptionHistory,
    checkPrescriptionLimit
};
window.adminFunctions = {
    getPendingProfessionals,
    approveProfessional,
    rejectProfessional,
    getDashboardStats
};
window.paymentFunctions = {
    redirectToCheckout
};