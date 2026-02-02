import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Star, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FormularCard({ formular }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{formular.icon}</span>
        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">{formular.rating}</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{formular.name}</h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{formular.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {formular.tags.map(tag => (
          <span 
            key={tag}
            className="inline-block bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-600 text-sm">
            <Download className="w-4 h-4" />
            <span>{formular.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>{formular.reviews}</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {formular.category}
        </span>
      </div>

      <Button 
        onClick={() => navigate(createPageUrl('Mietvertrag'))}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        Öffnen
      </Button>
    </div>
  );
}