/**
 * subscription.module.js - Gerenciamento de assinaturas e trial
 */
class SubscriptionModule {
constructor() {
this.subscription = null;
this.trialStatus = null;
}
/**
 * Carregar dados da assinatura
 */
async loadSubscription(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        if (error) throw error;

        this.subscription = data;
        this.calculateTrialStatus();
        
        return this.getStatus();
    } catch (error) {
        console.error('Load subscription error:', error);
        return { hasAccess: false, isTrialing: false };
    }
}

/**
 * Calcular status do trial
 */
calculateTrialStatus() {
    if (!this.subscription) {
        this.trialStatus = { isActive: false, daysLeft: 0 };
        return;
    }

    if (this.subscription.plan === 'trial' && this.subscription.trial_ends_at) {
        const trialEnd = new Date(this.subscription.trial_ends_at);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        
        this.trialStatus = {
            isActive: daysLeft > 0,
            daysLeft: Math.max(0, daysLeft),
            expiryDate: trialEnd
        };
    } else if (this.subscription.plan === 'essential') {
        this.trialStatus = {
            isActive: false,
            isPaid: true
        };
    }
}

/**
 * Obter status da assinatura
 */
getStatus() {
    const now = new Date();
    
    // Plano pago
    if (this.subscription?.plan === 'essential') {
        return {
            hasAccess: true,
            isTrialing: false,
            isPaid: true,
            plan: 'essential',
            canUsePremiumFeatures: true
        };
    }

    // Trial ativo
    if (this.trialStatus?.isActive) {
        return {
            hasAccess: true,
            isTrialing: true,
            isPaid: false,
            plan: 'trial',
            daysLeft: this.trialStatus.daysLeft,
            expiryDate: this.trialStatus.expiryDate,
            canUsePremiumFeatures: true
        };
    }

    // Trial expirado ou sem assinatura
    return {
        hasAccess: false,
        isTrialing: false,
        isPaid: false,
        plan: 'none',
        canUsePremiumFeatures: false,
        message: 'Trial expirado. Faça upgrade para continuar.'
    };
}

/**
 * Verificar se pode criar receituário
 */
canCreatePrescription() {
    const status = this.getStatus();
    return status.hasAccess;
}

/**
 * Obter texto para exibir no header
 */
getHeaderText() {
    const status = this.getStatus();
    
    if (status.isPaid) {
        return '✅ Plano Essencial';
    }
    
    if (status.isTrialing) {
        if (status.daysLeft <= 3) {
            return `⚠️ Trial expira em ${status.daysLeft} dias`;
        }
        return `🎁 Trial - ${status.daysLeft} dias restantes`;
    }
    
    return '❌ Trial Expirado';
}

/**
 * Redirecionar para checkout do Stripe
 */
redirectToUpgrade() {
    const checkoutUrl = 'https://buy.stripe.com/7sY8wQcpBcTrbY0cFZ00001';
    window.open(checkoutUrl, '_blank');
}
}
// Exportar instância única
window.SubscriptionModule = new SubscriptionModule();