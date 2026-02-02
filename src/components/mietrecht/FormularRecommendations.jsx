import React from 'react';
import { FileText, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function FormularRecommendations({ 
  forms, 
  userTier = 'free',
  onUpgradeClick 
}) {
  const navigate = useNavigate();
  const isPro = userTier === 'pro' || userTier === 'business';

  const handleFormClick = (formId, isFree) => {
    if (!isFree && !isPro) {
      onUpgradeClick?.();
    } else {
      navigate(createPageUrl('TemplateDetail', `?template=${formId}`));
    }
  };

  if (!forms || forms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <FileText className="w-4 h-4" />
        <span>Passende Formulare für dich:</span>
      </div>

      {forms.map(form => {
        const canAccess = form.is_free || isPro;
        
        return (
          <div
            key={form.id}
            className={`bg-white rounded-lg border p-4 transition-all ${
              canAccess 
                ? 'hover:shadow-md cursor-pointer' 
                : 'opacity-75'
            }`}
            onClick={() => handleFormClick(form.id, form.is_free)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {form.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {form.description}
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                {form.is_free ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Kostenlos ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded">
                    <Sparkles className="w-3 h-3" />
                    Pro
                  </span>
                )}
              </div>
            </div>

            <Button
              variant={canAccess ? "default" : "outline"}
              size="sm"
              className={`w-full mt-2 ${
                canAccess 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {canAccess ? (
                <>Formular öffnen →</>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1" />
                  Upgrade für Zugriff
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}