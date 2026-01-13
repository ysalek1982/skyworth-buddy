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
    const { test_email } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get SMTP settings
    const { data: settings } = await supabase
      .from("secure_settings")
      .select("key, value")
      .in("key", ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s) => {
      if (s.value) settingsMap[s.key] = s.value;
    });

    const smtpHost = settingsMap["SMTP_HOST"];
    const smtpPort = parseInt(settingsMap["SMTP_PORT"] || "587");
    const smtpUser = settingsMap["SMTP_USER"];
    const smtpPass = settingsMap["SMTP_PASS"];
    const smtpFrom = settingsMap["SMTP_FROM"];

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Configuración SMTP incompleta",
          missing: {
            host: !smtpHost,
            user: !smtpUser,
            pass: !smtpPass,
            from: !smtpFrom,
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientEmail = test_email || smtpFrom;

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
      to: recipientEmail,
      subject: "Prueba de conexión SMTP - Skyworth Goal Getter",
      content: "Este es un correo de prueba para verificar la configuración SMTP.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Prueba de conexión SMTP exitosa</h2>
          <p>Este correo confirma que la configuración SMTP está funcionando correctamente.</p>
          <p><strong>Servidor:</strong> ${smtpHost}:${smtpPort}</p>
          <p><strong>Remitente:</strong> ${smtpFrom}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Skyworth Goal Getter 2026</p>
        </div>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Correo de prueba enviado a ${recipientEmail}`,
        config: {
          host: smtpHost,
          port: smtpPort,
          from: smtpFrom,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error testing SMTP:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
