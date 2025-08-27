/**
 * auth.module.js - Gerenciamento de autenticação e sessão
 */
class AuthModule {
constructor() {
this.currentUser = null;
this.session = null;
}
/**
 * Inicializar módulo e verificar sessão
 */
async initialize() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            this.redirectToLogin();
            return false;
        }

        this.session = session;
        await this.loadUserData(session.user.id);
        
        // Verificar se é admin
        if (this.isAdmin()) {
            window.location.href = '/admin';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth initialization error:', error);
        this.redirectToLogin();
        return false;
    }
}

/**
 * Carregar dados do usuário
 */
async loadUserData(userId) {
    try {
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        this.currentUser = user;
        return user;
    } catch (error) {
        console.error('Load user data error:', error);
        throw error;
    }
}

/**
 * Verificar se é admin
 */
isAdmin() {
    return this.currentUser?.email === 'techne.br@gmail.com' || 
           this.currentUser?.is_admin === true;
}

/**
 * Fazer logout
 */
async logout() {
    try {
        await supabaseClient.auth.signOut();
        this.redirectToLogin();
    } catch (error) {
        console.error('Logout error:', error);
        this.redirectToLogin();
    }
}

/**
 * Redirecionar para login
 */
redirectToLogin() {
    window.location.href = '/auth';
}

/**
 * Obter usuário atual
 */
getUser() {
    return this.currentUser;
}

/**
 * Obter informações formatadas do profissional
 */
getProfessionalInfo() {
    if (!this.currentUser) return null;

    return {
        name: this.currentUser.name || 'Dr. Nome',
        council: this.currentUser.council || 'CRM',
        registrationNumber: this.currentUser.registration_number || '00000',
        state: this.currentUser.state || 'UF',
        specialty: this.currentUser.specialty || 'Especialidade',
        phone: this.currentUser.phone || '(00) 00000-0000',
        logoUrl: this.currentUser.logo_url,
        signatureUrl: this.currentUser.signature_url,
        fullCRM: `${this.currentUser.council || 'CRM'}: ${this.currentUser.registration_number || '00000'}-${this.currentUser.state || 'UF'}`
    };
}
}
// Exportar instância única (Singleton)
window.AuthModule = new AuthModule();
