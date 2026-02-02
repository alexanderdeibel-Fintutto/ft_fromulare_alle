import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AIFeatureToggle from '../components/ai/AIFeatureToggle';

export default function AIFormBuilder() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedForm, setGeneratedForm] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateForm = async () => {
    if (!description.trim()) {
      toast.error('Please describe the form you need');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateFormSchema', {
        description: description,
      });

      if (response.data?.schema) {
        setGeneratedForm(response.data.schema);
        toast.success('Form generated successfully!');
      } else {
        toast.error('Failed to generate form');
      }
    } catch (error) {
      console.error('Error generating form:', error);
      toast.error('Error generating form');
    } finally {
      setLoading(false);
    }
  };

  const copySchema = () => {
    if (generatedForm) {
      navigator.clipboard.writeText(JSON.stringify(generatedForm, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Schema copied to clipboard');
    }
  };

  const renderFormPreview = (schema) => {
    if (!schema || !schema.properties) return null;

    return (
      <div className="space-y-4">
        {Object.entries(schema.properties).map(([key, field]) => (
          <div key={key} className="space-y-2">
            <label className="block font-medium text-sm">
              {field.title || key.replace(/_/g, ' ')}
              {schema.required?.includes(key) && <span className="text-red-600">*</span>}
            </label>
            {field.type === 'string' && !field.enum && (
              <Input placeholder={field.description} disabled className="bg-gray-50" />
            )}
            {field.type === 'string' && field.enum && (
              <select className="w-full px-3 py-2 border rounded bg-gray-50" disabled>
                <option value="">Select an option</option>
                {field.enum.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {field.type === 'number' && (
              <Input type="number" placeholder={field.description} disabled className="bg-gray-50" />
            )}
            {field.type === 'boolean' && (
              <input type="checkbox" disabled className="mt-2" />
            )}
            {field.type === 'array' && (
              <Input placeholder={`${field.description} (comma-separated)`} disabled className="bg-gray-50" />
            )}
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AIFeatureToggle featureKey="form_generation">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Form Generator</h1>
          <p className="text-gray-600">Describe your form and let AI generate a JSON schema automatically</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Side */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Describe Your Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Create a form for user registration with fields for email, password, full name, date of birth, country selection, and terms acceptance checkbox"
                className="min-h-40"
              />

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
                <p className="font-medium mb-2">Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Be specific about field types (email, password, date, etc.)</li>
                  <li>• Mention required vs optional fields</li>
                  <li>• Specify validation rules if needed</li>
                  <li>• List dropdown options explicitly</li>
                </ul>
              </div>

              <Button
                onClick={generateForm}
                disabled={loading || !description.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Form
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Side */}
          <div className="space-y-4">
            {generatedForm ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-64 text-xs">
                      {JSON.stringify(generatedForm, null, 2)}
                    </pre>
                    <Button
                      onClick={copySchema}
                      variant="outline"
                      className="w-full mt-4 gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Schema
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  className="w-full"
                >
                  Preview Form
                </Button>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p>Generated form schema will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Form Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-96 overflow-auto">
            <DialogHeader>
              <DialogTitle>Form Preview</DialogTitle>
            </DialogHeader>
            {generatedForm && renderFormPreview(generatedForm)}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </AIFeatureToggle>
  );
}