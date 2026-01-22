import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate premium ticket HTML for each coupon
function generateTicketsHTML(couponsString: string): string {
  if (!couponsString) return "";
  
  const coupons = couponsString.split(",").map((c) => c.trim()).filter(Boolean);
  
  return coupons
    .map(
      (coupon, index) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
<tr>
<td style="background:linear-gradient(135deg,#FFD700 0%,#FFA500 100%);border-radius:8px;padding:3px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:6px;">
<tr>
<td style="padding:15px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="40" style="vertical-align:middle;">
<div style="width:36px;height:36px;background:linear-gradient(135deg,#FFD700,#FFA500);border-radius:50%;text-align:center;line-height:36px;font-size:16px;font-weight:bold;color:#1a1a2e;">${index + 1}</div>
</td>
<td style="padding-left:15px;vertical-align:middle;">
<p style="margin:0;font-size:11px;color:#FFD700;text-transform:uppercase;letter-spacing:1px;">Ticket #${index + 1}</p>
<p style="margin:5px 0 0;font-size:18px;font-weight:bold;color:#ffffff;font-family:monospace;letter-spacing:2px;">${coupon}</p>
</td>
<td width="30" style="vertical-align:middle;text-align:right;">
<span style="font-size:24px;">🎟️</span>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>`
    )
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, template_type, variables } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get settings
    const { data: settings } = await supabase
      .from("secure_settings")
      .select("key, value, is_enabled")
      .in("key", ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "EMAIL_ENABLED"]);

    const settingsMap: Record<string, { value: string | null; is_enabled: boolean }> = {};
    settings?.forEach((s) => {
      settingsMap[s.key] = { value: s.value, is_enabled: s.is_enabled };
    });

    if (!settingsMap["EMAIL_ENABLED"]?.is_enabled) {
      console.log("Email disabled, skipping send");
      return new Response(
        JSON.stringify({ success: false, message: "Email está deshabilitado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpHost = settingsMap["SMTP_HOST"]?.value;
    const smtpPort = parseInt(settingsMap["SMTP_PORT"]?.value || "587");
    const smtpUser = settingsMap["SMTP_USER"]?.value;
    const smtpPass = settingsMap["SMTP_PASS"]?.value;
    const smtpFrom = settingsMap["SMTP_FROM"]?.value;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return new Response(
        JSON.stringify({ error: "Configuración SMTP incompleta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get template
    const { data: template } = await supabase
      .from("notification_templates")
      .select("subject, body")
      .eq("type", "email")
      .eq("name", template_type)
      .eq("is_active", true)
      .single();

    let emailSubject = subject || template?.subject || "Notificación Skyworth";
    let emailBody = template?.body || "Gracias por participar en Skyworth Goal Getter 2026.";

    // Replace placeholders
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, "g");
        emailSubject = emailSubject.replace(regex, String(value));
        emailBody = emailBody.replace(regex, String(value));
      });

      // Generate premium tickets HTML if cupones variable exists
      if (variables.cupones) {
        const ticketsHTML = generateTicketsHTML(String(variables.cupones));
        emailBody = emailBody.replace("<!-- TICKETS_PLACEHOLDER -->", ticketsHTML);
      }
    }

    console.log("Sending email to:", to, "template:", template_type);

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    await client.send({
      from: smtpFrom,
      to: to,
      subject: emailSubject,
      content: emailBody,
      html: emailBody,
    });

    await client.close();

    console.log("Email sent successfully to:", to);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
