import React, { useState, useEffect } from 'react';
import { TrendingUp, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TaxConfiguration() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company_country: 'DE',
    vat_number: '',
    tax_jurisdiction: 'eu',
    eu_vat_enabled: false,
    reverse_charge_enabled: false,
    default_vat_rate: 19,
    auto_calculate_tax: true
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.TaxConfiguration.filter(
        { user_email: currentUser.email },
        null,
        1
      );

      if (data && data.length > 0) {
        const cfg = data[0];
        setConfig(cfg);
        setFormData(prev => ({
          ...prev,
          company_country: cfg.company_country || 'DE',
          vat_number: cfg.vat_number || '',
          tax_jurisdiction: cfg.tax_jurisdiction || 'eu',
          eu_vat_enabled: cfg.eu_vat_enabled || false,
          reverse_charge_enabled: cfg.reverse_charge_enabled || false,
          default_vat_rate: cfg.default_vat_rate || 19,
          auto_calculate_tax: cfg.auto_calculate_tax !== false
        }));
      }
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (config?.id) {
        await base44.entities.TaxConfiguration.update(config.id, formData);
      } else {
        await base44.entities.TaxConfiguration.create({
          user_email: user.email,
          ...formData
        });
      }
      toast.success('Tax-Konfiguration gespeichert');
      loadConfig();
    } catch (err) {
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <TrendingUp className="w-8 h-8" />
        Steuerkonfiguration
      </h1>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unternehmensland
          </label>
          <select
            value={formData.company_country}
            onChange={(e) => setFormData({ ...formData, company_country: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="DE">Deutschland</option>
            <option value="AT">Österreich</option>
            <option value="CH">Schweiz</option>
            <option value="FR">Frankreich</option>
            <option value="NL">Niederlande</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            VAT/USt-ID Nummer
          </label>
          <input
            type="text"
            value={formData.vat_number}
            onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
            className="w-full border rounded-lg p-2"
            placeholder="DE123456789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standard VAT-Satz (%)
          </label>
          <input
            type="number"
            value={formData.default_vat_rate}
            onChange={(e) => setFormData({ ...formData, default_vat_rate: parseFloat(e.target.value) })}
            className="w-full border rounded-lg p-2"
            step="0.1"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.eu_vat_enabled}
            onChange={(e) => setFormData({ ...formData, eu_vat_enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="text-gray-700">EU VAT-Meldung aktivieren</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.reverse_charge_enabled}
            onChange={(e) => setFormData({ ...formData, reverse_charge_enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="text-gray-700">Reverse Charge aktivieren (B2B)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.auto_calculate_tax}
            onChange={(e) => setFormData({ ...formData, auto_calculate_tax: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="text-gray-700">Steuern automatisch berechnen</span>
        </label>

        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  );
}