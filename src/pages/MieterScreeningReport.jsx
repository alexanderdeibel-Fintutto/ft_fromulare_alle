import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import LoadingState from '@/components/feedback/LoadingState';

export default function MieterScreeningReport() {
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!applicationId.trim()) {
      setError('Bitte geben Sie eine Bewerbungs-ID ein');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('calculate-tenant-score', {
        application_id: applicationId,
        app: 'vermietify'
      });

      if (response.data.success) {
        setResult(response.data.report);
        await base44.analytics.track({
          eventName: 'tenant_scored',
          properties: { application_id: applicationId }
        });
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'EMPFOHLEN': return 'text-green-600';
      case 'BEDINGT_EMPFOHLEN': return 'text-yellow-600';
      case 'MIT_VORBEHALT': return 'text-orange-600';
      case 'NICHT_EMPFOHLEN': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'EMPFOHLEN': return 'bg-green-50 border-green-200';
      case 'BEDINGT_EMPFOHLEN': return 'bg-yellow-50 border-yellow-200';
      case 'MIT_VORBEHALT': return 'bg-orange-50 border-orange-200';
      case 'NICHT_EMPFOHLEN': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'EMPFOHLEN': return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'BEDINGT_EMPFOHLEN': return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'MIT_VORBEHALT': return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'NICHT_EMPFOHLEN': return <AlertCircle className="w-6 h-6 text-red-600" />;
      default: return null;
    }
  };

  if (result) {
    const radarData = result.kategorien.map(k => ({
      name: k.name,
      value: (k.punkte / k.max_punkte) * 100,
      fullmark: 100
    }));

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Mieter-Screening-Report</h1>
                <p className="text-gray-600 mt-2">Detaillierte Bewertung des Mietbewerbers</p>
              </div>
              <Button onClick={() => window.print()} variant="outline">
                Drucken
              </Button>
            </div>
          </div>

          {/* Bewerberdaten */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bewerber</p>
                  <p className="font-bold">{result.bewerber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Objekt</p>
                  <p className="font-bold">{result.objekt}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Erstellt</p>
                  <p className="font-bold text-sm">{new Date(result.erstellt_am).toLocaleDateString('de-DE')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gesamtbewertung */}
          <Card className={`mb-6 border-2 ${getStatusBg(result.gesamt.status)}`}>
            <CardHeader className={`bg-gradient-to-r ${result.gesamt.status === 'EMPFOHLEN' ? 'from-green-600 to-emerald-600' : result.gesamt.status === 'BEDINGT_EMPFOHLEN' ? 'from-yellow-600 to-orange-600' : result.gesamt.status === 'MIT_VORBEHALT' ? 'from-orange-600 to-red-600' : 'from-red-600 to-rose-600'} text-white`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Gesamtbewertung</CardTitle>
                <div className="text-right">
                  <p className="text-4xl font-bold">{result.gesamt.punkte}</p>
                  <p className="text-lg opacity-90">/ {result.gesamt.max_punkte}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(result.gesamt.status)}
                    <div>
                      <p className="text-sm text-gray-600">Empfehlung</p>
                      <p className={`font-bold text-lg ${getStatusColor(result.gesamt.status)}`}>
                        {result.gesamt.status}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bewertung</p>
                  <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full ${result.gesamt.prozent >= 85 ? 'bg-green-500' : result.gesamt.prozent >= 70 ? 'bg-yellow-500' : result.gesamt.prozent >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${result.gesamt.prozent}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2 font-bold">{result.gesamt.prozent}%</p>
                </div>
              </div>
              <p className="mt-6 text-gray-700">{result.gesamt.empfehlung}</p>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Kategorienvergleich</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#ccc" />
                  <PolarAngleAxis dataKey="name" stroke="#666" />
                  <PolarRadiusAxis stroke="#666" />
                  <Radar name="Bewertung %" dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                  <Tooltip formatter={(value) => `${value.toFixed(0)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Kategorien */}
          <div className="space-y-4">
            {result.kategorien.map((kat, idx) => (
              <Card key={idx}>
                <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{kat.name}</CardTitle>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{kat.punkte}</p>
                      <p className="text-sm text-gray-600">/ {kat.max_punkte}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Bewertung</span>
                      <span className={`text-sm font-bold ${kat.status === 'sehr_gut' ? 'text-green-600' : kat.status === 'gut' ? 'text-green-500' : kat.status === 'normal' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {kat.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${kat.status === 'sehr_gut' ? 'bg-green-500' : kat.status === 'gut' ? 'bg-green-400' : kat.status === 'normal' ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${(kat.punkte / kat.max_punkte) * 100}%` }}
                      />
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {kat.details.map((detail, didx) => (
                      <li key={didx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-indigo-500">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Bericht generiert am {new Date().toLocaleDateString('de-DE')} um {new Date().toLocaleTimeString('de-DE')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Mieter-Screening-Report</h1>
          <p className="text-gray-600 mt-2">Umfassende Bewertung des Mietbewerbers</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Bewerbung eingeben
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bewerbungs-ID *</label>
                <input
                  type="text"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="z.B. APP-2026-001234"
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Eindeutige ID der Mietbewerbung</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-900">
                  ℹ️ Der Report aggregiert alle verfügbaren Daten: SCHUFA-Score, Einkommen, Vorvermieter-Referenz und Selbstauskunft.
                </p>
              </div>

              {loading ? (
                <LoadingState message="Report wird erstellt..." />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                >
                  Report anzeigen
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}