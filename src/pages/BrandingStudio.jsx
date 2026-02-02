import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function BrandingStudio() {
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({
    company_name: '',
    logo_url: '',
    primary_color: '#4F46E5',
    secondary_color: '#7C3AED',
    custom_domain: '',
    footer_text: '',
    custom_css: ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      const existing = await base44.asServiceRole.entities.BrandingConfig.filter({
        user_email: user.email
      });

      if (existing.length > 0) {
        await base44.entities.BrandingConfig.update(existing[0].id, branding);
      } else {
        await base44.entities.BrandingConfig.create({
          ...branding,
          user_email: user.email
        });
      }
      
      toast.success('Branding gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBranding({ ...branding, logo_url: file_url });
      toast.success('Logo hochgeladen');
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">White-Label Studio</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-4">Vorschau</h2>
          <div
            className="p-4 rounded-lg text-white space-y-3"
            style={{ backgroundColor: branding.primary_color }}
          >
            {branding.logo_url && (
              <img src={branding.logo_url} alt="Logo" className="h-12 w-auto" />
            )}
            <p className="font-bold">{branding.company_name || 'Company Name'}</p>
            <p className="text-sm opacity-90">{branding.footer_text || 'Footer text'}</p>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Unternehmensname
            </label>
            <Input
              value={branding.company_name}
              onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={loading}
              className="block w-full text-sm"
            />
            {branding.logo_url && (
              <p className="text-xs text-gray-500 mt-1">✓ Logo hochgeladen</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Primärfarbe
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  disabled={loading}
                  className="w-12 h-10 rounded"
                />
                <Input
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Sekundärfarbe
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  disabled={loading}
                  className="w-12 h-10 rounded"
                />
                <Input
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Custom Domain (optional)
            </label>
            <Input
              placeholder="shares.company.com"
              value={branding.custom_domain}
              onChange={(e) => setBranding({ ...branding, custom_domain: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Footer Text
            </label>
            <Input
              value={branding.footer_text}
              onChange={(e) => setBranding({ ...branding, footer_text: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Custom CSS
            </label>
            <Textarea
              value={branding.custom_css}
              onChange={(e) => setBranding({ ...branding, custom_css: e.target.value })}
              placeholder=".custom-class { color: red; }"
              rows={4}
              disabled={loading}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Speichern
          </Button>
        </Card>
      </div>
    </div>
  );
}