import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentUploadForm({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('other');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const allowedFormats = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
  const maxSizeKB = 10000; // 10MB

  function handleFileSelect(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!allowedFormats.includes(selectedFile.type)) {
      toast.error('Nur PDF, PNG, JPG und TIFF Dateien werden unterstützt');
      return;
    }

    // Validate file size
    if (selectedFile.size / 1024 > maxSizeKB) {
      toast.error(`Datei zu groß. Maximum: ${maxSizeKB}KB`);
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) {
      toast.error('Bitte wählen Sie eine Datei aus');
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      // Get current user
      const user = await base44.auth.me();

      // Create document record
      const documentRecord = {
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.name.split('.').pop().toLowerCase(),
        file_size_kb: Math.round(file.size / 1024),
        user_email: user.email,
        document_category: category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        notes: notes,
        processing_status: 'pending',
        is_searchable: true
      };

      const createdDoc = await base44.entities.OCRDocument.create(documentRecord);

      toast.success('Dokument hochgeladen! OCR-Verarbeitung wird gestartet...');

      // Trigger OCR processing asynchronously
      setTimeout(async () => {
        try {
          await base44.functions.invoke('processDocumentOCR', { documentId: createdDoc.id });
        } catch (error) {
          console.error('Error triggering OCR:', error);
        }
      }, 1000);

      // Reset form
      setFile(null);
      setCategory('other');
      setTags('');
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete(createdDoc);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen der Datei');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Dokument hochladen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-center cursor-pointer"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <FileCheck className="w-5 h-5" />
                <span>{file.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <p className="font-medium text-gray-700">Datei auswählen oder hierher ziehen</p>
                <p className="text-sm text-gray-500">PDF, PNG, JPG, TIFF • Max 10MB</p>
              </div>
            )}
          </button>
        </div>

        {/* Category Select */}
        <div>
          <label className="text-sm font-medium block mb-2">Dokumenttyp</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">Vertrag</SelectItem>
              <SelectItem value="invoice">Rechnung</SelectItem>
              <SelectItem value="receipt">Beleg</SelectItem>
              <SelectItem value="letter">Brief</SelectItem>
              <SelectItem value="form">Formular</SelectItem>
              <SelectItem value="other">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags Input */}
        <div>
          <label className="text-sm font-medium block mb-2">Tags (kommagetrennt)</label>
          <Input
            placeholder="z.B. wichtig, miete, 2025"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium block mb-2">Notizen</label>
          <Input
            placeholder="Optionale Notizen zu diesem Dokument"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Das Dokument wird automatisch mit KI-OCR verarbeitet. Extrahierter Text und Schlüsselwörter sind danach durchsuchbar.
          </p>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Wird hochgeladen...' : 'Dokument hochladen'}
        </Button>
      </CardContent>
    </Card>
  );
}