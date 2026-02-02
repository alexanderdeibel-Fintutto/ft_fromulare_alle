import React, { useState, useEffect } from 'react';
import { Palette, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminBrandingStudio() {
  const [user, setUser] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    is_custom_branding: false,
    company_name: '',
    primary_color: '#4F46E5',
    secondary_color: '#7C3AED',
    logo_url: '',
    custom_domain: '',
    remove_branding: false
  });

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.BrandingConfig.filter(
        { user_email: currentUser.email },
        null,
        1
      );

      if (data && data.length > 0) {
        const config = data[0];
        setBranding(config);
        setFormData(prev => ({
          ...prev,
          is_custom_branding: config.is_custom_branding,
          company_name: config.company_name || '',
          primary_color: config.primary_color || '#4F46E5',
          secondary_color: config.secondary_color || '#7C3AED',
          logo_url: config.logo_url || '',
          custom_domain: config.custom_domain || '',
          remove_branding: config.remove_branding || false
        }));
      }
    } catch (err) {
      toast.error('Fehler beim Laden der Branding-Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (branding?.id) {
        await base44.entities.BrandingConfig.update(branding.id, formData);
      } else {
        await base44.entities.BrandingConfig.create({
          user_email: user.email,
          ...formData
        });
      }
      toast.success('Branding aktualisiert');
      loadBranding();
    } catch (err) {
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <Palette className="w-8 h-8" />
        Branding Studio
      </h1>

      {/* Preview */}
      <div className="bg-white rounded-lg border p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">Vorschau</h2>
        <div
          style={{
            backgroundColor: formData.primary_color,
            color: 'white'
          }}
          className="rounded-lg p-6 mb-4"
        >
          <div className="flex items-center gap-4 mb-4">
            {formData.logo_url && (
              <img src={formData.logo_url} alt="Logo" className="h-12 w-12 rounded" />
            )}
            <h3 className="text-2xl font-bold">{formData.company_name || 'FinTuttO'}</h3>
          </div>
          <p>Dies ist eine Vorschau deiner Custom Branding</p>
        </div>

        <div className="flex gap-4">
          <button
            style={{ backgroundColor: formData.primary_color }}
            className="text-white px-6 py-2 rounded-lg font-medium"
          >
            Primär
          </button>
          <button
            style={{ backgroundColor: formData.secondary_color }}
            className="text-white px-6 py-2 rounded-lg font-medium"
          >
            Sekundär
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-bold mb-6">Einstellungen</h2>

        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_custom_branding}
              onChange={(e) => setFormData({ ...formData, is_custom_branding: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-gray-700">Custom Branding aktivieren</span>
          </label>

          {formData.is_custom_branding && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firmenname
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primärfarbe
                  </label>
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sekundärfarbe
                  </label>
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Domain
                </label>
                <input
                  type="text"
                  placeholder="forms.mycompany.com"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.remove_branding}
                  onChange={(e) => setFormData({ ...formData, remove_branding: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-gray-700">FinTuttO Branding entfernen</span>
              </label>
            </>
          )}
        </div>

        <Button onClick={handleSave} className="mt-6 bg-blue-600 hover:bg-blue-700 w-full">
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  );
}