import React, { useState, useEffect } from 'react';
import { Star, Trash2, Edit2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import AppHeader from '../components/layout/AppHeader';
import { Loader } from 'lucide-react';

export default function SavedCalculations() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadCalculations();
  }, [filterFavorites]);

  const loadCalculations = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getUserCalculations', {
        favorites: filterFavorites
      });
      if (response.data?.success) {
        setCalculations(response.data.calculations);
      }
    } catch (err) {
      console.error('Load calculations failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (calculationId, isFavorite) => {
    try {
      await base44.functions.invoke('updateCalculation', {
        calculationId: calculationId,
        isFavorite: !isFavorite
      });
      loadCalculations();
      toast.success(isFavorite ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleDelete = async (calculationId) => {
    if (!window.confirm('Berechnung wirklich löschen?')) return;

    try {
      await base44.functions.invoke('deleteCalculation', {
        calculationId
      });
      loadCalculations();
      toast.success('Berechnung gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleSaveEdit = async (calculationId) => {
    try {
      await base44.functions.invoke('updateCalculation', {
        calculationId: calculationId,
        ...editData
      });
      setEditingId(null);
      setEditData({});
      loadCalculations();
      toast.success('Berechnung aktualisiert');
    } catch (err) {
      toast.error('Fehler beim Speichern');
    }
  };

  const filtered = calculations.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tool_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gespeicherte Berechnungen</h1>

        {/* Controls */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suchen..."
                className="pl-10"
              />
            </div>

            <Button
              onClick={() => setFilterFavorites(!filterFavorites)}
              variant={filterFavorites ? 'default' : 'outline'}
              className="gap-2"
            >
              <Star className="w-4 h-4" />
              Nur Favoriten
            </Button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-600">Keine Berechnungen gefunden</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(calc => (
              <div
                key={calc.id}
                className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow"
              >
                {editingId === calc.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.name || calc.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Name"
                    />
                    <textarea
                      value={editData.description || calc.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      placeholder="Beschreibung"
                      className="w-full border rounded px-3 py-2 text-sm"
                      rows="3"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveEdit(calc.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Speichern
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditData({});
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {calc.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {calc.tool_name}
                        </p>
                        {calc.description && (
                          <p className="text-sm text-gray-700 mt-2">
                            {calc.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleFavorite(calc.id, calc.is_favorite)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              calc.is_favorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(calc.id);
                            setEditData(calc);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(calc.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Results Summary */}
                    <div className="bg-gray-50 rounded p-4 mt-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">ERGEBNISSE</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(calc.result_data || {})
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-gray-600 capitalize">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {typeof value === 'number'
                                  ? value.toFixed(2)
                                  : value}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Tags */}
                    {calc.tags?.length > 0 && (
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {calc.tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-4">
                      Erstellt: {new Date(calc.created_date).toLocaleDateString('de-DE')}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}