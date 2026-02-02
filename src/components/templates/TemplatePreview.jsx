import React from 'react';
import { FileText, Check, AlertCircle } from 'lucide-react';

export default function TemplatePreview({ template, formData }) {
  if (!template || !formData) return null;
  
  const filledFields = Object.keys(formData).filter(key => formData[key]).length;
  const totalFields = Object.keys(template.schema.properties).length;
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  const isComplete = progress === 100;
  
  return (
    <div className={`rounded-xl p-6 border-2 transition-all ${
      isComplete 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isComplete ? 'bg-green-100' : 'bg-blue-100'
        }`}>
          {isComplete ? (
            <Check className="w-6 h-6 text-green-600" />
          ) : (
            <FileText className="w-6 h-6 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {isComplete ? 'Bereit zum Erstellen!' : 'Formular-Fortschritt'}
          </h3>
          <p className="text-sm text-gray-600">
            {filledFields} von {totalFields} Feldern ausgefüllt
          </p>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isComplete ? 'bg-green-600' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {!isComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">
            Fülle alle erforderlichen Felder aus, um das Dokument zu erstellen.
          </p>
        </div>
      )}
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {Object.entries(template.schema.properties).map(([key, prop]) => {
          const isRequired = template.schema.required?.includes(key);
          const isFilled = formData[key];
          
          return (
            <div key={key} className="flex items-start gap-2 text-sm">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isFilled ? 'bg-green-100' : 'bg-gray-200'
              }`}>
                {isFilled && <Check className="w-3 h-3 text-green-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className={isFilled ? 'text-gray-900' : 'text-gray-500'}>
                  {prop.description || key}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </span>
                {isFilled && (
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {String(formData[key]).slice(0, 50)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}