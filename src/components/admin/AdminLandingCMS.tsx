import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Eye, 
  RotateCcw, 
  Type, 
  Calendar, 
  Image, 
  Settings2, 
  List,
  Loader2,
  Plus,
  X,
  ExternalLink,
  FileText
} from "lucide-react";
import { useLandingSettings, useUpdateLandingSettings, DEFAULT_LANDING_SETTINGS, LandingSettings } from "@/hooks/useLandingSettings";
import { toast } from "sonner";

export default function AdminLandingCMS() {
  const { data: settings, isLoading, error } = useLandingSettings();
  const updateSettings = useUpdateLandingSettings();
  
  // Local form state
  const [formData, setFormData] = useState<Partial<LandingSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const handleChange = (field: keyof LandingSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleThemeChange = (field: keyof typeof DEFAULT_LANDING_SETTINGS.theme, value: any) => {
    setFormData(prev => ({
      ...prev,
      theme: { ...prev.theme, [field]: value } as any
    }));
    setHasChanges(true);
  };

  const handleSectionsChange = (field: keyof typeof DEFAULT_LANDING_SETTINGS.sections, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      sections: { ...prev.sections, [field]: value } as any
    }));
    setHasChanges(true);
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...(formData.benefits || [])];
    newBenefits[index] = value;
    handleChange('benefits', newBenefits);
  };

  const addBenefit = () => {
    handleChange('benefits', [...(formData.benefits || []), '']);
  };

  const removeBenefit = (index: number) => {
    const newBenefits = (formData.benefits || []).filter((_, i) => i !== index);
    handleChange('benefits', newBenefits);
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...(formData.requirements || [])];
    newRequirements[index] = value;
    handleChange('requirements', newRequirements);
  };

  const addRequirement = () => {
    handleChange('requirements', [...(formData.requirements || []), '']);
  };

  const removeRequirement = (index: number) => {
    const newRequirements = (formData.requirements || []).filter((_, i) => i !== index);
    handleChange('requirements', newRequirements);
  };

  const handleSave = async () => {
    if (!formData.id) return;
    
    await updateSettings.mutateAsync({
      id: formData.id,
      campaign_name: formData.campaign_name,
      campaign_tagline: formData.campaign_tagline,
      cta_text: formData.cta_text,
      campaign_start_date: formData.campaign_start_date,
      campaign_end_date: formData.campaign_end_date,
      draw_date: formData.draw_date,
      prize_destination: formData.prize_destination,
      benefits: formData.benefits,
      requirements: formData.requirements,
      disclaimer: formData.disclaimer,
      hero_background_url: formData.hero_background_url,
      hero_banner_url: formData.hero_banner_url,
      logo_url: formData.logo_url,
      theme: formData.theme,
      sections: formData.sections,
      terms_conditions: formData.terms_conditions
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
      toast.info("Cambios descartados");
    }
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-effect border-white/10">
        <CardContent className="pt-6">
          <p className="text-destructive">Error al cargar la configuración</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">CMS Landing</h2>
          <p className="text-muted-foreground">Configura el contenido de la página principal</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
              Cambios sin guardar
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Vista previa
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Descartar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || updateSettings.isPending}>
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="content" className="data-[state=active]:bg-primary">
            <Type className="w-4 h-4 mr-2" />
            Contenido
          </TabsTrigger>
          <TabsTrigger value="dates" className="data-[state=active]:bg-primary">
            <Calendar className="w-4 h-4 mr-2" />
            Fechas
          </TabsTrigger>
          <TabsTrigger value="lists" className="data-[state=active]:bg-primary">
            <List className="w-4 h-4 mr-2" />
            Listas
          </TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-primary">
            <Image className="w-4 h-4 mr-2" />
            Imágenes
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary">
            <Settings2 className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="terms" className="data-[state=active]:bg-primary">
            <FileText className="w-4 h-4 mr-2" />
            T&C
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Textos principales</CardTitle>
              <CardDescription>Configura los textos que aparecen en el hero de la landing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">Nombre de la campaña *</Label>
                  <Input
                    id="campaign_name"
                    value={formData.campaign_name || ''}
                    onChange={(e) => handleChange('campaign_name', e.target.value)}
                    placeholder="EL SUEÑO DEL HINCHA SKYWORTH"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_tagline">Eslogan / Subtítulo *</Label>
                  <Textarea
                    id="campaign_tagline"
                    value={formData.campaign_tagline || ''}
                    onChange={(e) => handleChange('campaign_tagline', e.target.value)}
                    placeholder="Gánate 1 viaje a Monterrey..."
                    className="bg-white/5 border-white/10"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta_text">Texto del botón CTA *</Label>
                    <Input
                      id="cta_text"
                      value={formData.cta_text || ''}
                      onChange={(e) => handleChange('cta_text', e.target.value)}
                      placeholder="REGISTRAR COMPRA"
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prize_destination">Destino del premio</Label>
                    <Input
                      id="prize_destination"
                      value={formData.prize_destination || ''}
                      onChange={(e) => handleChange('prize_destination', e.target.value)}
                      placeholder="Monterrey"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-2">
                  <Label htmlFor="disclaimer">Texto legal / Disclaimer</Label>
                  <Textarea
                    id="disclaimer"
                    value={formData.disclaimer || ''}
                    onChange={(e) => handleChange('disclaimer', e.target.value)}
                    placeholder="Promoción válida hasta..."
                    className="bg-white/5 border-white/10"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dates Tab */}
        <TabsContent value="dates">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Fechas de la campaña</CardTitle>
              <CardDescription>Define las fechas importantes de la promoción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_start_date">Fecha de inicio</Label>
                  <Input
                    id="campaign_start_date"
                    type="date"
                    value={formData.campaign_start_date || ''}
                    onChange={(e) => handleChange('campaign_start_date', e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_end_date">Fecha de fin</Label>
                  <Input
                    id="campaign_end_date"
                    type="date"
                    value={formData.campaign_end_date || ''}
                    onChange={(e) => handleChange('campaign_end_date', e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="draw_date">Fecha del sorteo *</Label>
                  <Input
                    id="draw_date"
                    type="datetime-local"
                    value={formData.draw_date ? formData.draw_date.slice(0, 16) : ''}
                    onChange={(e) => handleChange('draw_date', e.target.value + ':00.000Z')}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  El contador de días se calcula automáticamente y se mostrará en la landing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lists Tab */}
        <TabsContent value="lists">
          <div className="grid gap-6">
            {/* Benefits */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  Beneficios del premio
                  <Button size="sm" variant="outline" onClick={addBenefit}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </CardTitle>
                <CardDescription>Lista de beneficios que incluye el premio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(formData.benefits || []).map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      placeholder={`Beneficio ${index + 1}`}
                      className="bg-white/5 border-white/10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBenefit(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  Requisitos principales
                  <Button size="sm" variant="outline" onClick={addRequirement}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </CardTitle>
                <CardDescription>Lista de requisitos para participar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(formData.requirements || []).map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={requirement}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      placeholder={`Requisito ${index + 1}`}
                      className="bg-white/5 border-white/10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRequirement(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Imágenes de la landing</CardTitle>
              <CardDescription>URLs de las imágenes principales (usa URLs públicas o de storage)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hero_background_url">Fondo del Hero (imagen estadio/cancha)</Label>
                <Input
                  id="hero_background_url"
                  value={formData.hero_background_url || ''}
                  onChange={(e) => handleChange('hero_background_url', e.target.value)}
                  placeholder="https://... o dejar vacío para usar la imagen por defecto"
                  className="bg-white/5 border-white/10"
                />
                {formData.hero_background_url && (
                  <div className="mt-2 rounded-lg overflow-hidden max-w-md">
                    <img 
                      src={formData.hero_background_url} 
                      alt="Preview fondo" 
                      className="w-full h-32 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo de la campaña (opcional)</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url || ''}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_banner_url">Banner/Afiche adicional (opcional)</Label>
                <Input
                  id="hero_banner_url"
                  value={formData.hero_banner_url || ''}
                  onChange={(e) => handleChange('hero_banner_url', e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid gap-6">
            {/* Sections visibility */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Visibilidad de secciones</CardTitle>
                <CardDescription>Activa o desactiva secciones de la landing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar sección de beneficios</Label>
                    <p className="text-sm text-muted-foreground">Lista de qué incluye el premio</p>
                  </div>
                  <Switch
                    checked={formData.sections?.showBenefits ?? true}
                    onCheckedChange={(checked) => handleSectionsChange('showBenefits', checked)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar sección de requisitos</Label>
                    <p className="text-sm text-muted-foreground">Lista de requisitos para participar</p>
                  </div>
                  <Switch
                    checked={formData.sections?.showRequirements ?? true}
                    onCheckedChange={(checked) => handleSectionsChange('showRequirements', checked)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar bot de ayuda</Label>
                    <p className="text-sm text-muted-foreground">Chat flotante de asistencia</p>
                  </div>
                  <Switch
                    checked={formData.sections?.showBot ?? true}
                    onCheckedChange={(checked) => handleSectionsChange('showBot', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Theme settings */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Tema visual</CardTitle>
                <CardDescription>Ajusta los colores y opacidad del overlay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Opacidad del overlay del hero: {Math.round((formData.theme?.overlayOpacity ?? 0.6) * 100)}%</Label>
                    <Slider
                      value={[(formData.theme?.overlayOpacity ?? 0.6) * 100]}
                      onValueChange={([value]) => handleThemeChange('overlayOpacity', value / 100)}
                      max={100}
                      min={0}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Menor opacidad = más visible la imagen de fondo
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-500">
                    Los colores primario y acento están definidos en el sistema de diseño. 
                    Para cambios avanzados de tema, contacta al equipo de desarrollo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Terms & Conditions Tab */}
        <TabsContent value="terms">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Términos y Condiciones
              </CardTitle>
              <CardDescription>
                Contenido HTML de los términos y condiciones que se muestran al hacer clic en el enlace del footer.
                Puedes usar etiquetas HTML como &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;table&gt;, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_conditions">Contenido HTML</Label>
                <Textarea
                  id="terms_conditions"
                  value={formData.terms_conditions || ''}
                  onChange={(e) => handleChange('terms_conditions', e.target.value)}
                  placeholder="<h2>Términos y Condiciones</h2>..."
                  className="bg-white/5 border-white/10 font-mono text-sm min-h-[400px]"
                  rows={20}
                />
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-400">
                  <strong>Tip:</strong> Puedes usar clases de Tailwind dentro del HTML. 
                  El contenido se renderiza con estilos predefinidos para h2, h3, h4, p, ul, ol, li, table, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
