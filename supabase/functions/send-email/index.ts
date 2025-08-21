// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const DOMAIN = Deno.env.get('DOMAIN') ?? 'https://receituariopro.com.br'

interface EmailRequest {
  type: 'welcome' | 'reset' | 'trial_ending' | 'subscription_confirmed'
  to: string
  data: Record<string, any>
}

serve(async (req) => {
  try {
    const { type, to, data } = await req.json() as EmailRequest
    
    let subject = ''
    let html = ''
    
    switch (type) {
      case 'welcome':
        subject = '🎉 Bem-vindo ao Receituário Pro!'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bem-vindo ao Receituário Pro!</h1>
              </div>
              <div class="content">
                <h2>Olá, ${data.name}! 👋</h2>
                <p>Sua conta foi criada com sucesso e você já tem acesso ao <strong>trial gratuito de 30 dias</strong> com todos os recursos disponíveis!</p>
                
                <h3>🎁 O que você tem no seu trial:</h3>
                <ul>
                  <li>✅ Receituários ilimitados</li>
                  <li>✅ Todos os templates disponíveis</li>
                  <li>✅ Assinatura digital</li>
                  <li>✅ Exportação em PDF e imagem</li>
                  <li>✅ Histórico completo</li>
                  <li>✅ Suporte prioritário</li>
                </ul>
                
                <p><strong>Por favor, confirme seu email clicando no botão abaixo:</strong></p>
                
                <center>
                  <a href="${data.confirmLink}" class="button">Confirmar Email e Acessar</a>
                </center>
                
                <p style="color: #666; font-size: 14px;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                  <code>${data.confirmLink}</code>
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p><strong>Próximos passos:</strong></p>
                <ol>
                  <li>Confirme seu email</li>
                  <li>Complete seu perfil com logo e assinatura</li>
                  <li>Crie seu primeiro receituário digital</li>
                </ol>
                
                <p>Qualquer dúvida, responda este email!</p>
                
                <p>Atenciosamente,<br>
                <strong>Equipe Receituário Pro</strong></p>
              </div>
              <div class="footer">
                <p>© 2024 Receituário Pro - Todos os direitos reservados</p>
                <p>Este email foi enviado para ${to}</p>
              </div>
            </div>
          </body>
          </html>
        `
        break
        
      case 'reset':
        subject = '🔐 Redefinir Senha - Receituário Pro'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Redefinir Senha</h1>
              </div>
              <div class="content">
                <h2>Olá! 👋</h2>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no Receituário Pro.</p>
                
                <center>
                  <a href="${data.resetLink}" class="button">Redefinir Minha Senha</a>
                </center>
                
                <div class="warning">
                  <strong>⚠️ Importante:</strong><br>
                  • Este link expira em 1 hora<br>
                  • Se você não solicitou esta alteração, ignore este email<br>
                  • Sua senha atual continuará funcionando
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                  <code>${data.resetLink}</code>
                </p>
                
                <p>Atenciosamente,<br>
                <strong>Equipe Receituário Pro</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
        break
        
      case 'trial_ending':
        subject = '⏰ Seu trial expira em 3 dias!'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ed8936 0%, #f56565 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .price-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Seu Trial Está Acabando!</h1>
              </div>
              <div class="content">
                <h2>Olá, ${data.name}! 👋</h2>
                <p>Seu período de trial gratuito do Receituário Pro expira em <strong>3 dias</strong>.</p>
                
                <p><strong>Não perca o acesso aos seus receituários!</strong></p>
                
                <div class="price-box">
                  <h3>🎁 Oferta Especial</h3>
                  <p><strong>Plano Anual:</strong> R$ 29/mês (economia de 25%)<br>
                  <strong>Plano Mensal:</strong> R$ 39/mês</p>
                </div>
                
                <center>
                  <a href="${DOMAIN}/app.html" class="button">Fazer Upgrade Agora</a>
                </center>
                
                <p>Continue aproveitando:</p>
                <ul>
                  <li>✅ Receituários ilimitados</li>
                  <li>✅ Assinatura digital com validade jurídica</li>
                  <li>✅ Histórico completo de pacientes</li>
                  <li>✅ Suporte prioritário</li>
                </ul>
                
                <p>Atenciosamente,<br>
                <strong>Equipe Receituário Pro</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
        break
        
      case 'subscription_confirmed':
        subject = '✅ Pagamento Confirmado - Receituário Pro'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .invoice { background: white; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Pagamento Confirmado!</h1>
              </div>
              <div class="content">
                <h2>Obrigado, ${data.name}! 🎉</h2>
                <p>Seu pagamento foi processado com sucesso e sua assinatura do <strong>Plano Essencial</strong> está ativa!</p>
                
                <div class="invoice">
                  <h3>Detalhes da Assinatura:</h3>
                  <p><strong>Plano:</strong> ${data.plan}<br>
                  <strong>Valor:</strong> ${data.amount}<br>
                  <strong>Próxima cobrança:</strong> ${data.nextBilling}<br>
                  <strong>Status:</strong> ✅ Ativo</p>
                </div>
                
                <center>
                  <a href="${DOMAIN}/app.html" class="button">Acessar Sistema</a>
                </center>
                
                <p><strong>Nota Fiscal:</strong> Será enviada em até 24h para este email.</p>
                
                <p>Qualquer dúvida sobre sua assinatura, entre em contato!</p>
                
                <p>Atenciosamente,<br>
                <strong>Equipe Receituário Pro</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
        break
    }
    
    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Receituário Pro <noreply@receituariopro.com.br>',
        to: [to],
        subject: subject,
        html: html
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email')
    }
    
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
    
  } catch (error) {
    console.error('Email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})