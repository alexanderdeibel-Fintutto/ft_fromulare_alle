// components/templates/RecommendedTemplates.jsx
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import TemplateCard from './TemplateCard';

export default function RecommendedTemplates({ currentTemplate, allTemplates = [], userDocuments = [] }) {
  const navigate = useNavigate();

  // Einfacher Empfehlungsalgorithmus
  const getRecommendations = () => {
    if (!currentTemplate) return [];

    // 1. Templates der gleichen Zielgruppe
    const sameAudience = allTemplates.filter(t => 
      t.id !== currentTemplate.id &&
      t.target_audience === currentTemplate.target_audience
    );

    // 2. Templates mit ähnlichen Tags
    const similarTags = allTemplates.filter(t => {
      if (t.id === currentTemplate.id) return false;
      const currentTags = currentTemplate.tags || [];
      const templateTags = t.tags || [];
      return templateTags.some(tag => currentTags.includes(tag));
    });

    // 3. Häufig zusammen genutzte Templates
    const userTemplateTypes = [...new Set(userDocuments.map(d => d.document_type))];
    const frequentlyUsedTogether = allTemplates.filter(t =>
      t.id !== currentTemplate.id &&
      !userTemplateTypes.includes(t.slug)
    );

    // Kombiniere und dedupliziere
    const recommendations = [
      ...sameAudience.slice(0, 2),
      ...similarTags.slice(0, 2),
      ...frequentlyUsedTogether.slice(0, 2)
    ];

    // Dedupliziere basierend auf ID
    const unique = recommendations.filter((t, idx, arr) => 
      arr.findIndex(x => x.id === t.id) === idx
    );

    return unique.slice(0, 3);
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Das könnte dich auch interessieren</h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {recommendations.map(template => (
          <div
            key={template.id}
            onClick={() => {
              const url = `${createPageUrl('TemplateDetail')}?slug=${template.slug}`;
              navigate(url);
            }}
            className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border border-gray-200 group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{template.icon || '📄'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                  {template.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {template.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}