import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function EmailTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [formData, setFormData] = useState({
        template_name: '',
        template_type: 'custom',
        subject: '',
        html_body: '',
        text_body: '',
        is_default: false,
        is_active: true
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            if (user.role !== 'admin') {
                toast.error('Nur Admins dürfen dies sehen');
                return;
            }

            const allTemplates = await base44.asServiceRole.entities.EmailTemplate.list(
                '-created_date'
            );
            setTemplates(allTemplates);
        } catch (error) {
            toast.error('Templates konnten nicht geladen werden');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!formData.template_name || !formData.subject || !formData.html_body) {
            toast.error('Name, Betreff und HTML erforderlich');
            return;
        }

        try {
            if (editingTemplate) {
                await base44.asServiceRole.entities.EmailTemplate.update(
                    editingTemplate.id,
                    {
                        ...formData,
                        last_modified_by: currentUser.email
                    }
                );
                toast.success('Template aktualisiert');
            } else {
                await base44.asServiceRole.entities.EmailTemplate.create({
                    ...formData,
                    created_by: currentUser.email
                });
                toast.success('Template erstellt');
            }

            setShowForm(false);
            setEditingTemplate(null);
            resetForm();
            loadTemplates();
        } catch (error) {
            toast.error('Speichern fehlgeschlagen');
        }
    };

    const resetForm = () => {
        setFormData({
            template_name: '',
            template_type: 'custom',
            subject: '',
            html_body: '',
            text_body: '',
            is_default: false,
            is_active: true
        });
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!confirm('Template wirklich löschen?')) return;

        try {
            await base44.asServiceRole.entities.EmailTemplate.delete(templateId);
            toast.success('Template gelöscht');
            loadTemplates();
        } catch (error) {
            toast.error('Löschen fehlgeschlagen');
        }
    };

    if (loading) return <div className="p-8 text-center">Lädt...</div>;

    if (currentUser?.role !== 'admin') {
        return <div className="p-8 text-center text-red-600">Zugriff verweigert</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Email Templates</h1>
                    <Button
                        onClick={() => {
                            setShowForm(!showForm);
                            setEditingTemplate(null);
                            resetForm();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Neuer Template
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <Card className="mb-8 bg-blue-50 border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle>
                                {editingTemplate ? 'Template bearbeiten' : 'Neuer Email Template'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    placeholder="Template Name"
                                    value={formData.template_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, template_name: e.target.value })
                                    }
                                />
                                <select
                                    value={formData.template_type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, template_type: e.target.value })
                                    }
                                    className="px-3 py-2 border rounded"
                                >
                                    <option value="custom">Benutzerdefiniert</option>
                                    <option value="welcome">Welcome</option>
                                    <option value="alert">Alert</option>
                                    <option value="document">Document</option>
                                    <option value="payment">Payment</option>
                                </select>
                            </div>

                            <Input
                                placeholder="Email Betreff"
                                value={formData.subject}
                                onChange={(e) =>
                                    setFormData({ ...formData, subject: e.target.value })
                                }
                            />

                            <div>
                                <label className="text-sm font-semibold block mb-2">
                                    HTML Body (mit {`{{variable}}`} für dynamische Werte)
                                </label>
                                <textarea
                                    placeholder="<html>...</html>"
                                    value={formData.html_body}
                                    onChange={(e) =>
                                        setFormData({ ...formData, html_body: e.target.value })
                                    }
                                    className="w-full p-3 border rounded font-mono text-sm h-48"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold block mb-2">Text Body</label>
                                <textarea
                                    placeholder="Plain text version"
                                    value={formData.text_body}
                                    onChange={(e) =>
                                        setFormData({ ...formData, text_body: e.target.value })
                                    }
                                    className="w-full p-3 border rounded h-24"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={(e) =>
                                        setFormData({ ...formData, is_default: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-semibold">Standard Template</span>
                            </label>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSaveTemplate}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Speichern
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingTemplate(null);
                                        resetForm();
                                    }}
                                >
                                    Abbrechen
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Templates Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {templates.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-gray-600">
                                Keine Templates erstellt.
                            </CardContent>
                        </Card>
                    ) : (
                        templates.map((template) => (
                            <Card key={template.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="font-bold text-lg">
                                                    {template.template_name}
                                                </p>
                                                {template.is_default && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                                        Standard
                                                    </span>
                                                )}
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold capitalize">
                                                    {template.template_type}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-2">
                                                <strong>Betreff:</strong> {template.subject}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                <strong>erstellt von:</strong> {template.created_by}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setPreviewTemplate(template)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingTemplate(template);
                                                    setFormData(template);
                                                    setShowForm(true);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteTemplate(template.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Preview Modal */}
                {previewTemplate && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto"
                        onClick={() => setPreviewTemplate(null)}
                    >
                        <Card
                            className="max-w-2xl w-full max-h-[90vh] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CardHeader>
                                <CardTitle>Preview: {previewTemplate.template_name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-1">
                                        Betreff
                                    </p>
                                    <p className="bg-gray-100 p-3 rounded">
                                        {previewTemplate.subject}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-1">
                                        HTML Body
                                    </p>
                                    <iframe
                                        className="w-full border rounded h-80 bg-white"
                                        srcDoc={previewTemplate.html_body}
                                        title="HTML Preview"
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => setPreviewTemplate(null)}
                                >
                                    Schließen
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}