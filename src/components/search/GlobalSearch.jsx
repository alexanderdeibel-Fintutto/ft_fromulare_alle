import React, { useState, useEffect } from 'react';
import { Search, FileText, Calculator, Zap, ArrowRight, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const allItems = [
    // Formulare
    { type: 'formular', icon: FileText, title: 'Mietvertrag', page: 'Mietvertrag', keywords: ['vertrag', 'miete', 'wohnung'] },
    { type: 'formular', icon: FileText, title: 'Kündigung', page: 'Kuendigung', keywords: ['kündigung', 'beenden', 'mietvertrag'] },
    { type: 'formular', icon: FileText, title: 'Übergabeprotokoll', page: 'Uebergabeprotokoll', keywords: ['übergabe', 'wohnung', 'protokoll'] },
    { type: 'formular', icon: FileText, title: 'Mahnung', page: 'Mahnung', keywords: ['mahnung', 'zahlung', 'miete'] },
    { type: 'formular', icon: FileText, title: 'Nebenkostenabrechnung', page: 'Nebenkostenabrechnung', keywords: ['nebenkosten', 'abrechnung', 'heizung'] },
    
    // Rechner
    { type: 'rechner', icon: Calculator, title: 'Rendite-Rechner', page: 'RenditeRechner', keywords: ['rendite', 'gewinn', 'investment'] },
    { type: 'rechner', icon: Calculator, title: 'Finanzierungs-Rechner', page: 'FinanzierungsRechner', keywords: ['finanzierung', 'kredit', 'darlehen'] },
    { type: 'rechner', icon: Calculator, title: 'Bewertungs-Rechner', page: 'BewertungsRechner', keywords: ['bewertung', 'wert', 'immobilie'] },
    { type: 'rechner', icon: Calculator, title: 'Kaufnebenkosten', page: 'KaufnebenkostenRechner', keywords: ['kaufnebenkosten', 'notar', 'grunderwerbsteuer'] },
    { type: 'rechner', icon: Calculator, title: 'Mieterhöhung', page: 'MieterhöhungsRechner', keywords: ['mieterhöhung', 'mietspiegel', 'erhöhung'] },
    
    // Integrationen
    { type: 'integration', icon: Zap, title: 'LetterXpress - Brief versenden', page: 'Tool', query: '?tool=letterxpress', keywords: ['brief', 'post', 'einschreiben'] },
    { type: 'integration', icon: Zap, title: 'SCHUFA Check', page: 'Tool', query: '?tool=schufa', keywords: ['schufa', 'bonität', 'check'] },
    { type: 'integration', icon: Zap, title: 'finAPI Sync', page: 'Tool', query: '?tool=finapi', keywords: ['finapi', 'bank', 'konto'] }
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = allItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery) ||
      item.keywords.some(kw => kw.includes(searchQuery))
    );

    setResults(filtered.slice(0, 8));
  }, [query]);

  const handleSelect = (item) => {
    const url = item.query
      ? `${createPageUrl(item.page)}${item.query}`
      : createPageUrl(item.page);
    window.location.href = url;
    onClose();
  };

  const typeColors = {
    formular: 'text-blue-600 bg-blue-50',
    rechner: 'text-green-600 bg-green-50',
    integration: 'text-purple-600 bg-purple-50'
  };

  const typeLabels = {
    formular: 'Formular',
    rechner: 'Rechner',
    integration: 'Integration'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <Input
            type="text"
            placeholder="Suche nach Formularen, Rechnern, Integrationen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="border-0 focus:ring-0 text-lg"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query.trim() && (
            <div className="p-8 text-center text-gray-500">
              <p>Keine Ergebnisse gefunden für "{query}"</p>
            </div>
          )}

          {results.length === 0 && !query.trim() && (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">Suche nach Formularen, Rechnern oder Integrationen</p>
              <p className="text-sm">Tipp: Probieren Sie "mietvertrag", "rendite" oder "schufa"</p>
            </div>
          )}

          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{typeLabels[item.type]}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>Drücken Sie ESC zum Schließen</span>
          <span>⌘K oder Strg+K zum Öffnen</span>
        </div>
      </div>
    </div>
  );
}