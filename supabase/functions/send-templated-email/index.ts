import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@example.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESET_REDIRECT_URL = Deno.env.get("RESET_REDIRECT_URL") ??
  "https://receituariopro.com.br/auth.html?reset=true";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  template: string;
  data?: Record<string, string>;
}

const TEMPLATE_MAP: Record<string, { file: string; subject: string }> = {
  welcome: {
    file: "welcome.html",
    subject: "🎉 Bem-vindo ao Receituário Pro!",
  },
  trial_expiring: {
    file: "trial_expiring.html",
    subject: "⏰ Seu trial está acabando",
  },
  plan_expired: { file: "plan_expired.html", subject: "🚫 Seu plano expirou" },
  password_reset: {
    file: "password_reset.html",
    subject: "🔐 Redefinição de senha",
  },
  approval: {
    file: "approval.html",
    subject: "✅ Cadastro Aprovado - Receituário Pro",
  },
  rejection: {
    file: "rejection.html",
    subject: "❌ Cadastro Reprovado - Receituário Pro",
  },
};

function renderTemplate(content: string, data: Record<string, string>): string {
  return content.replace(/{{(\w+)}}/g, (_, key) => data[key] ?? "");
}

async function generateResetLink(email: string): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate-link`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "recovery",
      email,
      options: { redirect_to: RESET_REDIRECT_URL },
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message || "Failed to generate reset link");
  }
  return json.action_link as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { ...corsHeaders, "Access-Control-Allow-Methods": "POST" },
    });
  }
  try {
    const { to, template, data = {} } = await req.json() as EmailRequest;

    const info = TEMPLATE_MAP[template];
    if (!info) {
      throw new Error("Invalid template");
    }

    const templateUrl = new URL(`./templates/${info.file}`, import.meta.url);
    let html = await Deno.readTextFile(templateUrl);

    const finalData = { ...data };

    if (template === "password_reset") {
      finalData.reset_link = await generateResetLink(to);
    }

    html = renderTemplate(html, finalData);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: info.subject,
        html,
      }),
    });

    const result = await resendRes.json();
    if (!resendRes.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Templated email error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
