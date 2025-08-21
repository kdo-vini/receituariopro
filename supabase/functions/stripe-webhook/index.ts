// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    console.log(`Processing webhook event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Extrair informações da sessão
        const customerEmail = session.customer_email
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        
        // Buscar usuário pelo email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', customerEmail)
          .single()
        
        if (userError || !user) {
          console.error('User not found:', customerEmail)
          return new Response('User not found', { status: 404 })
        }
        
        // Determinar o plano baseado no price_id ou amount
        const amount = session.amount_total || 0
        const plan = 'essential' // Sempre essential após pagamento
        const billingPeriod = amount > 4000 ? 'yearly' : 'monthly' // 348 = yearly, 39 = monthly
        
        // Calcular datas do período
        const now = new Date()
        const currentPeriodEnd = new Date()
        if (billingPeriod === 'yearly') {
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
        } else {
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
        }
        
        // Atualizar ou criar subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            plan: plan,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_start: now.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            trial_ends_at: null, // Remove trial
            updated_at: now.toISOString()
          }, {
            onConflict: 'user_id'
          })
        
        if (subError) {
          console.error('Error updating subscription:', subError)
          return new Response('Error updating subscription', { status: 500 })
        }
        
        console.log(`Subscription updated for user ${user.id}`)
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Atualizar status da subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          console.error('Error updating subscription status:', error)
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Marcar subscription como cancelada
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          console.error('Error canceling subscription:', error)
        }
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Marcar como past_due
        if (invoice.subscription) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription)
          
          if (error) {
            console.error('Error updating to past_due:', error)
          }
        }
        break
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
    
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    )
  }
})

// Deploy command:
// supabase functions deploy stripe-webhook --no-verify-jwt
// 
// Set secrets:
// supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
// supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx