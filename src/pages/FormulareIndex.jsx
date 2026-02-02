import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useTemplates } from '../components/hooks/useTemplates';
import TemplateCard from '../components/templates/TemplateCard';
import AppHeader from '../components/layout/AppHeader';
import PackageOffer from '../components/templates/PackageOffer';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Alle Kategorien' },
  { id: 'mieter', label: 'Für Mieter' },
  { id: 'vermieter', label: 'Für Vermieter' }
];

export default function FormulareIndex() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { templates, loading } = useTemplates();

  const filtered = templates.filter(t => {
    const matchSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'all' || 
                         t.target_audience === activeCategory ||
                         t.target_audience === 'both';
    return matchSearch && matchCategory && t.is_active;
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Rechtssichere Dokumentvorlagen
          </h1>
          <p className="text-lg text-gray-600">
            Professionelle Mietrecht-Vorlagen, erstellt von Experten. Schnell, einfach, zuverlässig.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Vorlage suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-6 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:border-blue-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Keine Vorlagen gefunden</p>
          </div>
        ) : (
          <>
            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {filtered.map(template => (
                <button
                  key={template.id}
                  onClick={() => window.location.href = createPageUrl(`TemplateDetail?slug=${template.slug}`)}
                  className="text-left"
                >
                  <TemplateCard template={template} />
                </button>
              ))}
            </div>

            {/* Package Offer */}
            <PackageOffer templateCount={templates.length} />
          </>
        )}
      </main>
    </div>
  );
}