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
        // Não precisamos definir status - vai usar o default 'active'
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
                phone: userData.phone || null
                // status: omitido, usará default 'active'
            })
            .select()
            .single();

        if (userError) {
            console.error('Detalhes do erro ao criar usuário:', {
                error: userError,
                message: userError.message,
                details: userError.details,
                hint: userError.hint,
                code: userError.code
            });
            throw userError;
        }

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

        if (consentError) {
            console.warn('Erro ao salvar consentimento:', consentError);
            // Não vamos falhar o registro por causa disso
        }

        // 4. Criar assinatura trial (período de teste gratuito)
        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: authData.user.id,
                plan: 'trial', // Período de teste gratuito
                status: 'active',
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias grátis
            });

        if (subError) {
            console.warn('Erro ao criar assinatura trial:', subError);
            // Não vamos falhar o registro por causa disso
        }

        return { 
            success: true, 
            user,
            message: 'Cadastro realizado! Verifique seu email para confirmar a conta.' 
        };

    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Traduzir erros do Supabase para português
 */
function translateError(error) {
    // Mapear mensagens de erro conhecidas
    const errorMap = {
        // Erros de autenticação
        'Invalid login credentials': 'E-mail ou senha incorretos',
        'Email not confirmed': 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
        'User not found': 'Usuário não encontrado',
        'Invalid email': 'E-mail inválido',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
        'User already registered': 'Este e-mail já está cadastrado',
        'Email link is invalid or has expired': 'O link expirou ou é inválido',
        'New password should be different from the old password': 'A nova senha deve ser diferente da senha atual',
        'Token has expired or is invalid': 'Token expirado ou inválido',
        'A user with this email address has already been registered': 'Este e-mail já está cadastrado',
        'Unable to validate email address: invalid format': 'Formato de e-mail inválido',
        'Password is too weak': 'Senha muito fraca. Use letras, números e símbolos',
        'Auth session missing!': 'Sessão expirada. Faça login novamente',
        'Invalid refresh token': 'Sessão expirada. Faça login novamente',
        
        // Erros de banco de dados
        'duplicate key value violates unique constraint': 'Este registro já existe',
        'violates check constraint': 'Dados inválidos para este campo',
        'null value in column': 'Campo obrigatório não preenchido',
        'foreign key violation': 'Referência inválida',
        
        // Erros de rede
        'Failed to fetch': 'Erro de conexão. Verifique sua internet',
        'Network request failed': 'Falha na conexão. Tente novamente',
        
        // Erros de permissão
        'new row violates row-level security policy': 'Você não tem permissão para esta ação',
        'permission denied': 'Permissão negada',
        
        // Erros específicos
        'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos',
        'Database error': 'Erro no servidor. Tente novamente',
        'Internal server error': 'Erro interno. Entre em contato com o suporte'
    };
    
    // Converter erro para string
    const errorMessage = error?.message || error?.error_description || error?.error || String(error);
    
    // Procurar correspondência parcial
    for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    
    // Se não encontrar tradução, retornar mensagem genérica amigável
    console.error('Erro não traduzido:', errorMessage);
    return 'Ocorreu um erro. Por favor, tente novamente.';
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

        if (authError) {
            return { 
                success: false, 
                error: translateError(authError)
            };
        }

        // 2. Buscar dados do usuário
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError) {
            return { 
                success: false, 
                error: translateError(userError)
            };
        }

        // 3. Verificar se email foi confirmado
        if (!authData.user.email_confirmed_at) {
            return { 
                success: false, 
                error: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.' 
            };
        }

        // 4. Verificar status (só suspended bloqueia)
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
        return { success: false, error: translateError(error) };
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

        if (error) {
            return { 
                success: false, 
                error: translateError(error)
            };
        }
        
        return { success: true };

    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: translateError(error) };
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

        // 2. Se for plano essential, sem limite
        if (subscription.plan === 'essential') {
            return true;
        }

        // 3. Se for trial, verificar se ainda está no período de teste
        if (subscription.plan === 'trial') {
            // Verificar se trial ainda está válido
            if (subscription.trial_ends_at) {
                const trialEnd = new Date(subscription.trial_ends_at);
                const now = new Date();
                
                if (now > trialEnd) {
                    // Trial expirado
                    return false;
                }
            }
            
            // Durante o trial, limite de 30 receituários
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
// FUNÇÕES ADMINISTRATIVAS SIMPLIFICADAS
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
 * Buscar todos os profissionais
 */
async function getAllProfessionals() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .neq('is_admin', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        console.error('Get professionals error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Suspender profissional (única ação administrativa necessária)
 */
async function suspendProfessional(userId, reason) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'suspended'
            })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };

    } catch (error) {
        console.error('Suspend error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reativar profissional
 */
async function reactivateProfessional(userId) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'active'
            })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };

    } catch (error) {
        console.error('Reactivate error:', error);
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
                pendingValidations: 0, // Não há mais validações pendentes
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
    getAllProfessionals,
    suspendProfessional,
    reactivateProfessional,
    getDashboardStats
};
window.paymentFunctions = {
    redirectToCheckout
};