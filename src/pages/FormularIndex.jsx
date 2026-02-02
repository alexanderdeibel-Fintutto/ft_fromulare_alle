import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { FORMULARE_CONFIG, getAllCategories, getAllTags, searchFormulare } from '../components/config/formulareConfig';
import FormularCard from '../components/formulare/FormularCard';
import { Button } from '@/components/ui/button';

export default function FormularIndex() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle Kategorien');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('rating');

  const allCategories = getAllCategories();
  const allTags = getAllTags();

  // Filter und Search Logic
  const filteredFormulare = useMemo(() => {
    let result = searchFormulare(searchQuery);

    if (selectedCategory !== 'Alle Kategorien') {
      result = result.filter(f => f.category === selectedCategory);
    }

    if (selectedTags.length > 0) {
      result = result.filter(f => 
        selectedTags.some(tag => f.tags.includes(tag))
      );
    }

    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [searchQuery, selectedCategory, selectedTags, sortBy]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Rechtssichere Dokumentvorlagen
          </h1>
          <p className="text-lg text-gray-600">
            Professionelle Mietrecht–Vorlagen, erstellt von Experten. Schnell, einfach, zuverlässig.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Vorlage suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <Filter className="inline w-4 h-4 mr-2" />
              Kategorien
            </label>
            <div className="flex flex-wrap gap-2">
              {['Alle Kategorien', ...allCategories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-semibold text-gray-900 mb-2">
              Sortieren nach
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Beste Bewertung</option>
              <option value="downloads">Meiste Downloads</option>
              <option value="name">Alphabetisch</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-600">
          {filteredFormulare.length} {filteredFormulare.length === 1 ? 'Vorlage' : 'Vorlagen'} gefunden
        </div>

        {/* Grid */}
        {filteredFormulare.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFormulare.map(formular => (
              <FormularCard key={formular.id} formular={formular} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">Keine Vorlagen gefunden</p>
            <p className="text-gray-500 text-sm mt-2">Versuche eine andere Suche oder Filter</p>
          </div>
        )}
      </div>
    </div>
  );
}