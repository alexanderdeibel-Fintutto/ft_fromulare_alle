import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AppHeader from '../components/layout/AppHeader';
import { Loader } from 'lucide-react';

export default function TemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    target_audience: 'both',
    category: '',
    pricing_model: 'free',
    price_cents: 0,
    is_active: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = await base44.entities.DocumentTemplate.list('-created_date');
      setTemplates(allTemplates || []);
    } catch (err) {
      console.error('Load templates failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name und Slug erforderlich');
      return;
    }

    try {
      if (editingTemplate) {
        await base44.entities.DocumentTemplate.update(editingTemplate.id, formData);
        toast.success('Vorlage aktualisiert');
      } else {
        await base44.entities.DocumentTemplate.create({
          ...formData,
          schema: {
            type: 'object',
            properties: {}
          }
        });
        toast.success('Vorlage erstellt');
      }
      setShowForm(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        target_audience: 'both',
        category: '',
        pricing_model: 'free',
        price_cents: 0,
        is_active: true
      });
      loadTemplates();
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      slug: template.slug,
      description: template.description || '',
      target_audience: template.target_audience || 'both',
      category: template.category || '',
      pricing_model: template.pricing_model || 'free',
      price_cents: template.price_cents || 0,
      is_active: template.is_active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Vorlage wirklich löschen?')) return;

    try {
      await base44.entities.DocumentTemplate.delete(templateId);
      loadTemplates();
      toast.success('Vorlage gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleToggleActive = async (template) => {
    try {
      await base44.entities.DocumentTemplate.update(template.id, {
        is_active: !template.is_active
      });
      loadTemplates();
      toast.success(template.is_active ? 'Vorlage deaktiviert' : 'Vorlage aktiviert');
    } catch (err) {
      toast.error('Fehler');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vorlagen-Verwaltung</h1>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setShowForm(!showForm);
            }}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Neue Vorlage
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Kündigungsschreiben"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="z.B. kuendigung-mietvertrag"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurze Beschreibung der Vorlage"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="z.B. Mietrecht"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zielgruppe
                </label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="both">Beide</option>
                  <option value="mieter">Mieter</option>
                  <option value="vermieter">Vermieter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preismodell
                </label>
                <select
                  value={formData.pricing_model}
                  onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="free">Kostenlos</option>
                  <option value="single">Einzelkauf</option>
                  <option value="pack_included">In Paket enthalten</option>
                </select>
              </div>
              {formData.pricing_model === 'single' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preis (in Cent)
                  </label>
                  <Input
                    type="number"
                    value={formData.price_cents}
                    onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) })}
                    placeholder="z.B. 299 für 2,99€"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                {editingTemplate ? 'Aktualisieren' : 'Erstellen'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Templates Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-600">Noch keine Vorlagen</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Preismodell
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {templates.map(template => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500">{template.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {template.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="capitalize">{template.pricing_model || 'free'}</span>
                      {template.price_cents > 0 && (
                        <span className="ml-1 text-gray-600">
                          ({(template.price_cents / 100).toFixed(2)}€)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          template.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {template.is_active ? 'Aktiv' : 'Inaktiv'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}