import React from 'react';
import AuthGuard from '../components/AuthGuard';
import RealtimePropertiesExample from '../components/examples/RealtimePropertiesExample';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Database, RefreshCw } from 'lucide-react';

export default function RealtimeDemo() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Realtime Updates Demo
            </h1>
            <p className="text-gray-600">
              Alle Daten aktualisieren sich automatisch bei Änderungen in der Datenbank
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Echtzeit</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Änderungen werden sofort ohne Neuladen angezeigt
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Supabase</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Nutzt Supabase Realtime Subscriptions
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Auto-Sync</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Alle Geräte bleiben automatisch synchronisiert
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <RealtimePropertiesExample />
        </div>
      </div>
    </AuthGuard>
  );
}