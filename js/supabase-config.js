/**
 * Configuração do Supabase e Stripe
 * IMPORTANTE: Substitua com suas chaves reais
 */

// ========================================
// CONFIGURAÇÕES DO SUPABASE
// ========================================

const SUPABASE_URL = 'https://kqumjmacwlpaxfuziooy.supabase.co'; // Substitua
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdW1qbWFjd2xwYXhmdXppb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDI3NDUsImV4cCI6MjA3MTExODc0NX0.gwCdzsL5YjfNx_Krav5l12PtuReHxibOQBLc80b-4UE'; // Substitua

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// CONFIGURAÇÕES DO STRIPE
// ========================================

const STRIPE_PUBLIC_KEY = 'pk_live_51RxYCmLUJWyE4PkYzYnJstmaICs14Lcmz8kSerkExOzCOdfdhH8m5gZuf65KUJMLAHcq9R7kh2VYeApsMLPtdIkU00u3IFh6E6'; // Substitua

// Links de pagamento do Stripe (pegue no dashboard)
const STRIPE_LINKS = {
    essential_monthly: 'https://buy.stripe.com/bJeaEYaht4mV5zC8pJ00000', // Substitua
    essential_yearly: 'https://buy.stripe.com/7sY8wQcpBcTrbY0cFZ00001'   // Substitua
};

// ========================================
// FUNÇÕES DE AUTENTICAÇÃO
// ========================================

/**
 * Registrar novo profissional
 */
async function registerProfessional(userData) {
    try {
        // 1. Criar auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
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
                status: 'pending'
            })
            .select()
            .single();

        if (userError) throw userError;

        // 3. Criar registro de consentimento LGPD
        const { error: consentError } = await supabase
            .from('consent_records')
            .insert({
                user_id: authData.user.id,
                consent_type: 'terms_and_privacy',
                version: '1.0',
                accepted: true,
                ip_address: await getUserIP()
            });

        if (consentError) throw consentError;

        // 4. Criar assinatura freemium
        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: authData.user.id,
                plan: 'freemium',
                status: 'active'
            });

        if (subError) throw subError;

        // 5. Enviar email para admin (você implementará)
        await notifyAdminNewRegistration(user);

        return { success: true, user };

    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

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

        // 3. Verificar status
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

        return { success: true, user };

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

        // 2. Verificar limite do plano
        const canCreate = await checkPrescriptionLimit(user.id);
        if (!canCreate) {
            return { 
                success: false, 
                error: 'Limite de receituários atingido. Faça upgrade do plano.' 
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
                signature_data: prescriptionData.signature
            })
            .select()
            .single();

        if (error) throw error;

        // 4. Atualizar contador
        await updatePrescriptionCount(user.id);

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
            .single();

        if (!subscription) return false;

        // 2. Se for plano essencial, sem limite
        if (subscription.plan === 'essential' || subscription.plan === 'professional') {
            return true;
        }

        // 3. Se for freemium, verificar limite mensal (30)
        if (subscription.plan === 'freemium') {
            // Contar receituários do mês atual
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count } = await supabase
                .from('prescriptions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', startOfMonth.toISOString());

            return count < 30;
        }

        return false;

    } catch (error) {
        console.error('Check limit error:', error);
        return false;
    }
}

/**
 * Atualizar contador de receituários
 */
async function updatePrescriptionCount(userId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

    await supabase
        .from('subscriptions')
        .update({ prescriptions_count: count })
        .eq('user_id', userId);
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
        if (!loginResult.user.is_admin) {
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
        const { error } = await supabase.rpc('validate_professional', {
            target_user_id: userId,
            approved: true
        });

        if (error) throw error;

        // Enviar email de aprovação (implementar)
        // await sendApprovalEmail(userId);

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
        const { error } = await supabase.rpc('validate_professional', {
            target_user_id: userId,
            approved: false,
            reason: reason
        });

        if (error) throw error;

        // Enviar email de rejeição (implementar)
        // await sendRejectionEmail(userId, reason);

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
            .neq('is_admin', true);

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

        // Assinaturas ativas
        const { count: activeSubscriptions } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'essential')
            .eq('status', 'active');

        // Receita mensal (R$ 29 * assinaturas)
        const monthlyRevenue = activeSubscriptions * 29;

        return {
            success: true,
            data: {
                totalUsers,
                pendingValidations,
                monthlyPrescriptions,
                activeSubscriptions,
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
 * Obter IP do usuário
 */
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return null;
    }
}

/**
 * Notificar admin sobre novo cadastro
 */
async function notifyAdminNewRegistration(user) {
    // Implementar envio de email
    console.log('Novo cadastro para validação:', user);
    
    // Por enquanto, apenas log
    // Em produção, usar SendGrid, Resend ou similar
}

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
        window.location.href = '/auth.html';
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