import React, { useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FileUploadField({ value, schema, onChange }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState(value?.name || '');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ url: file_url, name: file.name });
      setFileName(file.name);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setFileName('');
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          ) : fileName ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <File className="w-5 h-5" />
              {fileName}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-6 h-6 text-gray-400 mx-auto" />
              <span className="text-sm text-gray-600">Datei hochladen</span>
            </div>
          )}
          <input
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            accept={schema.accept || '*'}
            className="hidden"
          />
        </div>
      </label>
      {fileName && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
        >
          <X className="w-3 h-3" />
          Entfernen
        </button>
      )}
    </div>
  );
}