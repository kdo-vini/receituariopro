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
// VERIFICAÇÃO DE SESSÃO GLOBAL
// ========================================

/**
 * Verificar sessão ativa e redirecionar se necessário
 */
async function checkSessionOrRedirect() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'index.html';
            return null;
        }
        
        // Verificar se usuário ainda existe e está ativo
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
        if (error || !user) {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
            return null;
        }
        
        if (user.status !== 'active') {
            await supabase.auth.signOut();
            alert('Sua conta não está ativa. Entre em contato com o suporte.');
            window.location.href = 'index.html';
            return null;
        }
        
        return { session, user };
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        window.location.href = 'index.html';
        return null;
    }
}

// ========================================
// FUNÇÕES DE AUTENTICAÇÃO
// ========================================

/**
 * Registrar novo profissional - VERSÃO MELHORADA
 */
async function registerProfessional(userData) {
    try {
        console.log('1. Iniciando registro:', userData.email);
        
        // 1. Verificar se email já existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', userData.email)
            .single();
            
        if (existingUser) {
            return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
        }

        // 2. Criar auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: { name: userData.name }
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            let errorMessage = 'Erro ao criar conta.';
            
            if (authError.message.includes('already registered')) {
                errorMessage = 'Este e-mail já está cadastrado.';
            } else if (authError.message.includes('invalid email')) {
                errorMessage = 'E-mail inválido.';
            } else if (authError.message.includes('password')) {
                errorMessage = 'Senha deve ter pelo menos 8 caracteres.';
            }
            
            return { success: false, error: errorMessage };
        }

        console.log('2. Auth user criado:', authData.user.id);

        // 3. Criar registro na tabela users
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

        if (userError) {
            console.error('User creation error:', userError);
            
            // Tentar deletar o auth user se falhou
            try {
                await supabase.auth.admin.deleteUser(authData.user.id);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
            
            let errorMessage = 'Erro ao criar perfil profissional.';
            if (userError.code === '23505') { // Unique constraint
                errorMessage = 'Este e-mail já está cadastrado.';
            }
            
            return { success: false, error: errorMessage };
        }

        console.log('3. Public user criado:', user);

        // 4. Criar registro de consentimento LGPD
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
            console.warn('Consent error (não crítico):', consentError);
        }

        // 5. Criar assinatura freemium
        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: authData.user.id,
                plan: 'freemium',
                status: 'active'
            });

        if (subError) {
            console.error('Subscription error:', subError);
            // Não falhar por causa disso, admin pode criar manualmente
        }

        return { success: true, user };

    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Erro interno. Tente novamente.' };
    }
}

/**
 * Login de usuário - VERSÃO MELHORADA
 */
async function loginUser(email, password) {
    try {
        // 1. Fazer login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('Auth error:', authError);
            let errorMessage = 'Erro ao fazer login.';
            
            if (authError.message.includes('Invalid login credentials')) {
                errorMessage = 'E-mail ou senha incorretos.';
            } else if (authError.message.includes('Email not confirmed')) {
                errorMessage = 'Confirme seu e-mail antes de fazer login.';
            } else if (authError.message.includes('Too many requests')) {
                errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
            } else if (authError.message.includes('Email logins are disabled')) {
                errorMessage = 'Login temporariamente indisponível.';
            }
            
            return { success: false, error: errorMessage };
        }

        // 2. Buscar dados do usuário
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError) {
            console.error('User fetch error:', userError);
            await supabase.auth.signOut();
            return { 
                success: false, 
                error: 'Perfil não encontrado. Entre em contato com o suporte.' 
            };
        }

        // 3. Verificar status
        if (user.status === 'pending') {
            await supabase.auth.signOut();
            return { 
                success: false, 
                error: 'Sua conta ainda está em validação. Aguarde até 24h para aprovação.' 
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
        return { success: false, error: 'Erro interno. Tente novamente.' };
    }
}

/**
 * Salvar assinatura desenhada (canvas) - VERSÃO MELHORADA
 */
async function saveCanvasSignature(dataURL) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        // Converter dataURL para blob
        const response = await fetch(dataURL);
        const blob = await response.blob();

        // Criar arquivo
        const file = new File([blob], 'signature.png', { type: 'image/png' });

        // Usar a função de upload existente
        const result = await uploadSignature(file);
        
        if (result.success) {
            // Também salvar no localStorage para fallback
            localStorage.setItem('user_signature', dataURL);
        }
        
        return result;
    } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
        return { success: false, error: 'Erro ao salvar assinatura.' };
    }
}

/**
 * Remover assinatura - VERSÃO MELHORADA  
 */
async function removeSignature() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        // 1. Remover do storage
        const fileName = `${session.user.id}/signature.png`;
        const { error: storageError } = await supabase.storage
            .from('signatures')
            .remove([fileName]);

        if (storageError) {
            console.warn('Storage removal warning:', storageError);
        }

        // 2. Remover da tabela users
        const { error: updateError } = await supabase
            .from('users')
            .update({ signature_url: null })
            .eq('id', session.user.id);

        if (updateError) throw updateError;

        // 3. Remover do localStorage
        localStorage.removeItem('user_signature');

        return { success: true };
    } catch (error) {
        console.error('Erro ao remover assinatura:', error);
        return { success: false, error: 'Erro ao remover assinatura.' };
    }
}

/**
 * Atualizar contador de receituários - CORRIGIDO
 */
async function updatePrescriptionCount() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { count: 0, limit: 0 };

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from('prescriptions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .gte('created_at', startOfMonth.toISOString());

        // Buscar plano atual
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', session.user.id)
            .single();

        const plan = subscription?.plan || 'freemium';
        const limit = plan === 'freemium' ? 30 : Infinity;

        // Atualizar contador na tabela subscriptions
        await supabase
            .from('subscriptions')
            .update({ prescriptions_count: count })
            .eq('user_id', session.user.id);

        return { count: count || 0, limit, plan };
    } catch (error) {
        console.error('Error updating prescription count:', error);
        return { count: 0, limit: 30, plan: 'freemium' };
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
    window.location.href = 'index.html';
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
// FUNÇÕES DE PERFIL E UPLOAD
// ========================================

/**
 * Buscar dados completos do usuário logado
 */
async function getCurrentUserData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                subscriptions(plan, status)
            `)
            .eq('id', session.user.id)
            .single();

        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return null;
    }
}

/**
 * Atualizar dados do perfil
 */
async function updateProfile(profileData) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('users')
            .update({
                name: profileData.name,
                council: profileData.council,
                state: profileData.state,
                registration_number: profileData.registrationNumber,
                specialty: profileData.specialty,
                phone: profileData.phone,
                address: profileData.address,
                cnpj: profileData.cnpj,
                updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload de logo da clínica
 */
async function uploadLogo(file) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        // Verificar se é plano essencial
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', session.user.id)
            .single();

        if (!subscription || subscription.plan === 'freemium') {
            throw new Error('Upload de logo disponível apenas no plano Essencial');
        }

        // Validar arquivo
        if (file.size > 1024 * 1024) { // 1MB
            throw new Error('Arquivo muito grande. Máximo 1MB');
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('Apenas imagens são permitidas');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/logo.${fileExt}`;

        // Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('logos')
            .upload(fileName, file, {
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(fileName);

        // Atualizar na tabela users
        const { error: updateError } = await supabase
            .from('users')
            .update({ logo_url: publicUrl })
            .eq('id', session.user.id);

        if (updateError) throw updateError;

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Erro no upload do logo:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload de assinatura
 */
async function uploadSignature(file) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        // Validar arquivo
        if (file.size > 500 * 1024) { // 500KB
            throw new Error('Arquivo muito grande. Máximo 500KB');
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('Apenas imagens são permitidas');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/signature.${fileExt}`;

        // Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('signatures')
            .upload(fileName, file, {
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('signatures')
            .getPublicUrl(fileName);

        // Atualizar na tabela users
        const { error: updateError } = await supabase
            .from('users')
            .update({ signature_url: publicUrl })
            .eq('id', session.user.id);

        if (updateError) throw updateError;

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Erro no upload da assinatura:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Salvar assinatura desenhada (canvas)
 */
async function saveCanvasSignature(dataURL) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        // Converter dataURL para blob
        const response = await fetch(dataURL);
        const blob = await response.blob();

        // Criar arquivo
        const file = new File([blob], 'signature.png', { type: 'image/png' });

        // Usar a função de upload existente
        return await uploadSignature(file);
    } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        // Verificar limite do plano
        const canCreate = await checkPrescriptionLimit(session.user.id);
        if (!canCreate) {
            return { 
                success: false, 
                error: 'Limite de receituários atingido. Faça upgrade do plano.' 
            };
        }

        // Salvar receituário
        const { data, error } = await supabase
            .from('prescriptions')
            .insert({
                user_id: session.user.id,
                patient_name: prescriptionData.patientName,
                content: prescriptionData.content,
                template_type: prescriptionData.template,
                signature_data: prescriptionData.signature
            })
            .select()
            .single();

        if (error) throw error;

        // Atualizar contador
        await updatePrescriptionCount(session.user.id);

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
        // Buscar assinatura do usuário
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!subscription) return false;

        // Se for plano essencial, sem limite
        if (subscription.plan === 'essential' || subscription.plan === 'professional') {
            return true;
        }

        // Se for freemium, verificar limite mensal (30)
        if (subscription.plan === 'freemium') {
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('user_id', session.user.id)
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
        const loginResult = await loginUser(email, password);
        if (!loginResult.success) return loginResult;

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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Não autenticado');

        const { error } = await supabase
            .from('users')
            .update({
                status: 'active',
                validated_at: new Date().toISOString(),
                validated_by: session.user.id
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Não autenticado');

        const { error } = await supabase
            .from('users')
            .update({
                status: 'rejected',
                validated_at: new Date().toISOString(),
                validated_by: session.user.id
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
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email') || '';

    const link = plan === 'yearly' 
        ? STRIPE_LINKS.essential_yearly 
        : STRIPE_LINKS.essential_monthly;

    const checkoutUrl = userEmail 
        ? `${link}?prefilled_email=${encodeURIComponent(userEmail)}`
        : link;
    
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

// ========================================
// LISTENER DE MUDANÇAS DE AUTENTICAÇÃO
// ========================================

supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    
    if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        window.location.href = 'index.html';
    }
});

// ========================================
// EXPORTAR PARA USO GLOBAL
// ========================================

window.supabaseClient = supabase;
window.authFunctions = {
    registerProfessional,
    loginUser,
    logoutUser,
    resetPassword,
    loginAdmin,
    checkSessionOrRedirect
};
window.profileFunctions = {
    getCurrentUserData,
    updateProfile,
    uploadLogo,
    uploadSignature,
    saveCanvasSignature
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