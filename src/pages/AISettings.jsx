import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bot, Sparkles, DollarSign, Key, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AIBudgetOverview from '../components/ai/AIBudgetOverview';
import AIUsageChart from '../components/ai/AIUsageChart';
import CacheEfficiencyStats from '../components/ai/CacheEfficiencyStats';

export default function AISettings() {
  const [settings, setSettings] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState('unknown');

  useEffect(() => {
    loadSettings();
    loadFeatures();
  }, []);

  async function loadSettings() {
    try {
      const data = await base44.entities.AISettings.list();
      if (data && data.length > 0) {
        setSettings(data[0]);
        setApiStatus(data[0].api_status || 'unknown');
      } else {
        // Defaults
        setSettings({
          provider: 'anthropic',
          default_model: 'claude-sonnet-4-20250514',
          is_enabled: true,
          monthly_budget_eur: 50,
          budget_warning_threshold: 80,
          enable_prompt_caching: true,
          enable_batch_processing: false,
          rate_limit_per_user_hour: 20,
          rate_limit_per_user_day: 100,
          allowed_features: ['chat', 'ocr', 'analysis', 'categorization'],
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  }

  async function loadFeatures() {
    try {
      const data = await base44.entities.AIFeatureConfig.list();
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      if (settings.id) {
        await base44.entities.AISettings.update(settings.id, settings);
        toast.success('Einstellungen gespeichert');
      } else {
        const created = await base44.entities.AISettings.create(settings);
        setSettings(created);
        toast.success('Einstellungen erstellt');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  async function testApiConnection() {
    setTesting(true);
    try {
      const response = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: 'Antworte nur mit: OK',
        userId: 'test@system.local',
        featureKey: 'system_test',
        maxTokens: 10,
      });

      if (response.data.success) {
        setApiStatus('active');
        
        // Update Settings
        const updated = { ...settings, api_status: 'active', last_api_check: new Date().toISOString() };
        if (settings.id) {
          await base44.entities.AISettings.update(settings.id, updated);
        }
        setSettings(updated);
        
        toast.success('API-Verbindung erfolgreich');
      } else {
        setApiStatus('error');
        toast.error('API-Verbindung fehlgeschlagen');
      }
    } catch (error) {
      console.error('API test failed:', error);
      setApiStatus('error');
      toast.error('API-Test fehlgeschlagen: ' + error.message);
    } finally {
      setTesting(false);
    }
  }

  async function updateFeature(featureId, updates) {
    try {
      await base44.entities.AIFeatureConfig.update(featureId, updates);
      loadFeatures();
      toast.success('Feature aktualisiert');
    } catch (error) {
      console.error('Error updating feature:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  }

  if (loading) {
    return <div className="p-8">Lade Einstellungen...</div>;
  }

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const modelOptions = [
    { value: 'claude-haiku-3-5-20241022', label: 'Haiku 3.5', description: 'Schnell & günstig - ideal für einfache Aufgaben' },
    { value: 'claude-sonnet-4-20250514', label: 'Sonnet 4 ⭐', description: 'Ausgewogen - beste Wahl für die meisten Aufgaben' },
    { value: 'claude-opus-4-20250514', label: 'Opus 4', description: 'Höchste Qualität - für komplexe Analysen' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="w-8 h-8" />
          KI-Einstellungen
        </h1>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>

      {/* Budget Overview */}
      <div className="mb-6">
        <AIBudgetOverview />
      </div>

      {/* Usage Chart */}
      <div className="mb-6">
        <AIUsageChart />
      </div>

      {/* Model Cost Comparison */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Modell-Kosten-Vergleich</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Modell</th>
                  <th className="text-right py-2 px-3">Input (€/1M)</th>
                  <th className="text-right py-2 px-3">Output (€/1M)</th>
                  <th className="text-right py-2 px-3">Cache Write (€/1M)</th>
                  <th className="text-right py-2 px-3">Cache Read (€/1M)</th>
                  <th className="text-left py-2 px-3">Anwendung</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Haiku 3.5</td>
                  <td className="text-right py-2 px-3">€0.0007</td>
                  <td className="text-right py-2 px-3">€0.0037</td>
                  <td className="text-right py-2 px-3">€0.0009</td>
                  <td className="text-right py-2 px-3">€0.00007</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">Schnelle, einfache Aufgaben</td>
                </tr>
                <tr className="border-b bg-blue-50">
                  <td className="py-2 px-3 font-medium">Sonnet 4 ⭐</td>
                  <td className="text-right py-2 px-3">€0.0028</td>
                  <td className="text-right py-2 px-3">€0.0138</td>
                  <td className="text-right py-2 px-3">€0.0035</td>
                  <td className="text-right py-2 px-3">€0.00028</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">Ausgewogen für die meisten Aufgaben</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Opus 4</td>
                  <td className="text-right py-2 px-3">€0.0138</td>
                  <td className="text-right py-2 px-3">€0.0690</td>
                  <td className="text-right py-2 px-3">€0.0173</td>
                  <td className="text-right py-2 px-3">€0.0014</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">Komplexe Analysen, höchste Qualität</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>💡 Preise in EUR (Umrechnung: 1 USD = 0.92 EUR)</p>
            <p>💡 Cache Read spart bis zu 90% der Input-Kosten</p>
            <p>💡 Cache Write kostet 25% mehr, amortisiert sich ab 2. Anfrage</p>
          </div>
        </CardContent>
      </Card>

      {/* Cache Efficiency Stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cache-Effizienz (letzte 30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <CacheEfficiencyStats />
        </CardContent>
      </Card>

      {/* Allgemeine Einstellungen */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚙️ Allgemeine Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>KI-Features aktiviert</Label>
              <p className="text-sm text-muted-foreground">Globaler An/Aus-Schalter</p>
            </div>
            <Switch
              checked={settings?.is_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, is_enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Standard-Modell</Label>
            <Select
              value={settings?.default_model}
              onValueChange={(value) => setSettings({ ...settings, default_model: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Prompt-Caching</Label>
              <p className="text-sm text-muted-foreground">Bis zu 90% Ersparnis bei wiederholten Prompts</p>
            </div>
            <Switch
              checked={settings?.enable_prompt_caching}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_prompt_caching: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Batch-Verarbeitung</Label>
              <p className="text-sm text-muted-foreground">Für nicht-zeitkritische Bulk-Operationen</p>
            </div>
            <Switch
              checked={settings?.enable_batch_processing}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_batch_processing: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget & Limits */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget & Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monatliches Budget (€)</Label>
              <Input
                type="number"
                value={settings?.monthly_budget_eur}
                onChange={(e) => setSettings({ ...settings, monthly_budget_eur: parseFloat(e.target.value) })}
                min="0"
                step="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Warnung bei (%)</Label>
              <Input
                type="number"
                value={settings?.budget_warning_threshold}
                onChange={(e) => setSettings({ ...settings, budget_warning_threshold: parseFloat(e.target.value) })}
                min="50"
                max="100"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="mb-3 block">Rate-Limit pro User</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Pro Stunde</Label>
                <Input
                  type="number"
                  value={settings?.rate_limit_per_user_hour}
                  onChange={(e) => setSettings({ ...settings, rate_limit_per_user_hour: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Pro Tag</Label>
                <Input
                  type="number"
                  value={settings?.rate_limit_per_user_day}
                  onChange={(e) => setSettings({ ...settings, rate_limit_per_user_day: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature-Konfiguration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Feature-Konfiguration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {features.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Keine Features konfiguriert
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Feature</th>
                    <th className="text-center py-2 px-2">Aktiv</th>
                    <th className="text-left py-2 px-2">Modell</th>
                    <th className="text-left py-2 px-2">Max Tokens</th>
                    <th className="text-left py-2 px-2">Min. Abo</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.id} className="border-b">
                      <td className="py-3 px-2 font-medium">{feature.display_name}</td>
                      <td className="py-3 px-2 text-center">
                        <Switch
                          checked={feature.is_enabled}
                          onCheckedChange={(checked) => updateFeature(feature.id, { is_enabled: checked })}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Select
                          value={feature.preferred_model || settings?.default_model}
                          onValueChange={(value) => updateFeature(feature.id, { preferred_model: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="claude-haiku-3-5-20241022">Haiku</SelectItem>
                            <SelectItem value="claude-sonnet-4-20250514">Sonnet</SelectItem>
                            <SelectItem value="claude-opus-4-20250514">Opus</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          value={feature.max_tokens}
                          onChange={(e) => updateFeature(feature.id, { max_tokens: parseInt(e.target.value) })}
                          className="w-24"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Select
                          value={feature.requires_subscription}
                          onValueChange={(value) => updateFeature(feature.id, { requires_subscription: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API-Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API-Konfiguration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label>Anthropic API-Key</Label>
                {getStatusIcon()}
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                sk-ant-••••••••••••••••
              </p>
              {settings?.last_api_check && (
                <p className="text-xs text-muted-foreground mt-1">
                  Letzter Check: {new Date(settings.last_api_check).toLocaleString('de-DE')}
                </p>
              )}
            </div>
          </div>

          <Button onClick={testApiConnection} disabled={testing} variant="outline">
            {testing ? 'Teste Verbindung...' : 'API-Verbindung testen'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}