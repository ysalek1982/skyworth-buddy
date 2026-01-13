import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    }

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
