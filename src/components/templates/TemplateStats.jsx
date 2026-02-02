// components/templates/TemplateStats.jsx
import React from 'react';
import { TrendingUp, Users, Clock, Star } from 'lucide-react';

export default function TemplateStats({ template }) {
  // Mock stats - würde in Produktion von Supabase kommen
  const stats = {
    downloads: Math.floor(Math.random() * 5000) + 500,
    avgRating: (4 + Math.random()).toFixed(1),
    avgTime: Math.floor(Math.random() * 5) + 3,
    trending: Math.random() > 0.5
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">{stats.downloads}</div>
        <div className="text-xs text-gray-600">Downloads</div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4 text-center">
        <Star className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">{stats.avgRating}</div>
        <div className="text-xs text-gray-600">Bewertung</div>
      </div>

      <div className="bg-green-50 rounded-lg p-4 text-center">
        <Clock className="w-5 h-5 text-green-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">~{stats.avgTime} Min</div>
        <div className="text-xs text-gray-600">Zeitersparnis</div>
      </div>

      {stats.trending && (
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-2" />
          <div className="text-sm font-bold text-gray-900">Trending</div>
          <div className="text-xs text-gray-600">Beliebt</div>
        </div>
      )}
    </div>
  );
}