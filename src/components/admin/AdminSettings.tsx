import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, TestTube, Bot, MessageSquare, Mail, Settings2 } from 'lucide-react';

interface SecureSetting {
  id: string;
  key: string;
  value: string | null;
  is_enabled: boolean;
}

const settingsKeys = {
  gemini: ['GEMINI_API_KEY', 'GEMINI_MODEL', 'BOT_ENABLED'],
  whatsapp: ['WHATSAPP_PROVIDER', 'WHATSAPP_API_URL', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_ENABLED'],
  smtp: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'EMAIL_ENABLED']
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, SecureSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('secure_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, SecureSetting> = {};
      const formValues: Record<string, string> = {};

      (data || []).forEach(setting => {
        settingsMap[setting.key] = setting;
        // Para keys tipo *_ENABLED, usar is_enabled como 'true'/'false'
        if (setting.key.endsWith('_ENABLED')) {
          formValues[setting.key] = setting.is_enabled ? 'true' : 'false';
        } else {
          formValues[setting.key] = setting.value || '';
        }
      });

      // Initialize missing settings
      const allKeys = [...settingsKeys.gemini, ...settingsKeys.whatsapp, ...settingsKeys.smtp];
      allKeys.forEach(key => {
        if (formValues[key] === undefined) {
          formValues[key] = key.endsWith('_ENABLED') ? 'false' : '';
        }
      });

      setSettings(settingsMap);
      setForm(formValues);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: 'gemini' | 'whatsapp' | 'smtp') => {
    setSaving(true);
    try {
      const keys = settingsKeys[category];

      for (const key of keys) {
        const existingSetting = settings[key];
        const value = form[key];
        const isEnabled = key.endsWith('_ENABLED') ? value === 'true' : true;

        if (existingSetting) {
          await supabase
            .from('secure_settings')
            .update({ 
              value: key.endsWith('_ENABLED') ? null : value,
              is_enabled: key.endsWith('_ENABLED') ? value === 'true' : existingSetting.is_enabled
            })
            .eq('id', existingSetting.id);
        } else {
          await supabase
            .from('secure_settings')
            .insert({ 
              key, 
              value: key.endsWith('_ENABLED') ? null : value,
              is_enabled: key.endsWith('_ENABLED') ? value === 'true' : true
            });
        }
      }

      toast.success('Configuración guardada');
      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (type: 'gemini' | 'whatsapp' | 'smtp') => {
    setTesting(type);
    try {
      const functionName = `test-${type}`;
      
      // Prepare body based on the test type
      let body: Record<string, string> = {};
      if (type === 'smtp') {
        body = { test_email: form.SMTP_FROM || 'test@example.com' };
      } else if (type === 'whatsapp') {
        body = { test: 'true' };
      } else if (type === 'gemini') {
        body = { test: 'true' };
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Conexión ${type.toUpperCase()} exitosa`);
      } else {
        toast.error(data?.error || `Error en conexión ${type.toUpperCase()}`);
      }
    } catch (error: any) {
      console.error(`Error testing ${type}:`, error);
      toast.error(error.message || `Error al probar ${type}`);
    } finally {
      setTesting(null);
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const isEnabled = (key: string) => {
    return form[key] === 'true';
  };

  const toggleEnabled = (key: string) => {
    setForm(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configuración</h2>
        <p className="text-muted-foreground">Integraciones y API keys</p>
      </div>

      <Tabs defaultValue="gemini" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gemini" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Gemini AI
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email SMTP
          </TabsTrigger>
        </TabsList>

        {/* Gemini Settings */}
        <TabsContent value="gemini">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Configuración Gemini AI
                  </CardTitle>
                  <CardDescription>API de Google Gemini para el chatbot</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="bot-enabled">Bot habilitado</Label>
                  <Switch
                    id="bot-enabled"
                    checked={isEnabled('BOT_ENABLED')}
                    onCheckedChange={() => toggleEnabled('BOT_ENABLED')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key">API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  value={form.GEMINI_API_KEY || ''}
                  onChange={(e) => updateForm('GEMINI_API_KEY', e.target.value)}
                  placeholder="AIza..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini-model">Modelo</Label>
                <Input
                  id="gemini-model"
                  value={form.GEMINI_MODEL || ''}
                  onChange={(e) => updateForm('GEMINI_MODEL', e.target.value)}
                  placeholder="gemini-1.5-flash"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('gemini')} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => handleTest('gemini')} disabled={testing === 'gemini'}>
                  {testing === 'gemini' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                  Probar Conexión
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Configuración WhatsApp
                  </CardTitle>
                  <CardDescription>API de WhatsApp Business para notificaciones</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="wa-enabled">WhatsApp habilitado</Label>
                  <Switch
                    id="wa-enabled"
                    checked={isEnabled('WHATSAPP_ENABLED')}
                    onCheckedChange={() => toggleEnabled('WHATSAPP_ENABLED')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wa-provider">Provider</Label>
                  <Input
                    id="wa-provider"
                    value={form.WHATSAPP_PROVIDER || ''}
                    onChange={(e) => updateForm('WHATSAPP_PROVIDER', e.target.value)}
                    placeholder="meta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa-url">API URL</Label>
                  <Input
                    id="wa-url"
                    value={form.WHATSAPP_API_URL || ''}
                    onChange={(e) => updateForm('WHATSAPP_API_URL', e.target.value)}
                    placeholder="https://graph.facebook.com/v18.0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-token">Token</Label>
                <Input
                  id="wa-token"
                  type="password"
                  value={form.WHATSAPP_TOKEN || ''}
                  onChange={(e) => updateForm('WHATSAPP_TOKEN', e.target.value)}
                  placeholder="Token de acceso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-phone">Phone ID</Label>
                <Input
                  id="wa-phone"
                  value={form.WHATSAPP_PHONE_ID || ''}
                  onChange={(e) => updateForm('WHATSAPP_PHONE_ID', e.target.value)}
                  placeholder="ID del número de teléfono"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('whatsapp')} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => handleTest('whatsapp')} disabled={testing === 'whatsapp'}>
                  {testing === 'whatsapp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                  Probar Conexión
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Settings */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configuración SMTP
                  </CardTitle>
                  <CardDescription>Servidor de correo para notificaciones</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="email-enabled">Email habilitado</Label>
                  <Switch
                    id="email-enabled"
                    checked={isEnabled('EMAIL_ENABLED')}
                    onCheckedChange={() => toggleEnabled('EMAIL_ENABLED')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Host</Label>
                  <Input
                    id="smtp-host"
                    value={form.SMTP_HOST || ''}
                    onChange={(e) => updateForm('SMTP_HOST', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Puerto</Label>
                  <Input
                    id="smtp-port"
                    value={form.SMTP_PORT || ''}
                    onChange={(e) => updateForm('SMTP_PORT', e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuario</Label>
                  <Input
                    id="smtp-user"
                    value={form.SMTP_USER || ''}
                    onChange={(e) => updateForm('SMTP_USER', e.target.value)}
                    placeholder="usuario@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">Contraseña</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    value={form.SMTP_PASS || ''}
                    onChange={(e) => updateForm('SMTP_PASS', e.target.value)}
                    placeholder="Contraseña de aplicación"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-from">Email remitente</Label>
                <Input
                  id="smtp-from"
                  value={form.SMTP_FROM || ''}
                  onChange={(e) => updateForm('SMTP_FROM', e.target.value)}
                  placeholder="noreply@skyworth.com"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave('smtp')} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => handleTest('smtp')} disabled={testing === 'smtp'}>
                  {testing === 'smtp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                  Probar Conexión
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
