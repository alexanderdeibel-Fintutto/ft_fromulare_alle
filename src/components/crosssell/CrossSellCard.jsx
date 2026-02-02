import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/components/utils/supabase';

export default function CrossSellCard({ app, pricing }) {
  const popularTier = pricing?.find(p => p.is_popular);
  
  return (
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {app.name}
          </h3>
          {popularTier && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              ab {formatPrice(popularTier.monthly_price_cents)}/Monat
            </p>
          )}
        </div>
        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {app.description}
      </p>
      
      <div className="flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
        Mehr erfahren
        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </a>
  );
}