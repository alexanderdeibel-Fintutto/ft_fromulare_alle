import React, { useState, useEffect } from 'react';
import { Palette, Globe, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function WhiteLabelStudio() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    logo_url: '',
    primary_color: '#4F46E5',
    secondary_color: '#7C3AED',
    custom_domain: '',
    footer_text: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.WhiteLabelConfig.filter(
        { reseller_email: currentUser.email },
        null,
        1
      );

      if (data && data.length > 0) {
        setConfig(data[0]);
        setFormData(data[0]);
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
        await base44.entities.WhiteLabelConfig.update(config.id, formData);
      } else {
        await base44.entities.WhiteLabelConfig.create({
          reseller_email: user.email,
          ...formData,
          is_white_label_enabled: true,
          remove_branding: true
        });
      }
      toast.success('White Label Config gespeichert');
      loadConfig();
    } catch (err) {
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <Palette className="w-8 h-8" />
        White Label Studio
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Firmenname</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primärfarbe</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-12 h-10 border rounded"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="flex-1 border rounded-lg p-2 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sekundärfarbe</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="w-12 h-10 border rounded"
              />
              <input
                type="text"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="flex-1 border rounded-lg p-2 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain</label>
            <input
              type="text"
              value={formData.custom_domain}
              onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
              placeholder="app.mycompany.com"
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
            <textarea
              value={formData.footer_text}
              onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              rows="3"
              className="w-full border rounded-lg p-2"
            />
          </div>

          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>

        <div>
          <h2 className="font-bold text-gray-900 mb-4">Vorschau</h2>
          <div
            className="rounded-lg border p-8 space-y-4"
            style={{ backgroundColor: `${formData.primary_color}20` }}
          >
            {formData.logo_url && (
              <img src={formData.logo_url} alt="Logo" className="h-12" />
            )}
            <h1 className="text-2xl font-bold" style={{ color: formData.primary_color }}>
              {formData.company_name || 'Your Company'}
            </h1>
            <p className="text-gray-600">Dies ist eine Vorschau deines White Label Designs</p>
            <button
              className="px-6 py-2 rounded text-white font-medium"
              style={{ backgroundColor: formData.primary_color }}
            >
              Action Button
            </button>
            <div className="text-xs text-gray-500 pt-4 border-t">
              {formData.footer_text || '© Your Company 2026'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}