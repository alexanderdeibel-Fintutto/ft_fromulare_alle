import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AITestSuite() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  async function runTests(testType = null) {
    setRunning(true);
    setResults(null);

    try {
      const response = await base44.functions.invoke('testAICoreService', {
        testType
      });

      if (response.data?.success) {
        setResults(response.data);
        toast.success('Tests erfolgreich abgeschlossen');
      } else {
        toast.error('Tests fehlgeschlagen');
        setResults({ success: false, error: response.data?.error });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Fehler beim Ausführen der Tests');
      setResults({ success: false, error: error.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Core Service Test Suite</h1>
        <p className="text-muted-foreground">
          Teste alle Funktionen des aiCoreService
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={() => runTests('chat')}
          disabled={running}
          className="h-24 flex flex-col gap-2"
        >
          {running ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
          Basic Chat
        </Button>
        <Button
          onClick={() => runTests('caching')}
          disabled={running}
          className="h-24 flex flex-col gap-2"
        >
          {running ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
          Prompt Caching
        </Button>
        <Button
          onClick={() => runTests('rate_limit')}
          disabled={running}
          className="h-24 flex flex-col gap-2"
        >
          {running ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
          Rate Limiting
        </Button>
        <Button
          onClick={() => runTests('budget')}
          disabled={running}
          className="h-24 flex flex-col gap-2"
        >
          {running ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
          Budget Check
        </Button>
      </div>

      <Button
        onClick={() => runTests(null)}
        disabled={running}
        size="lg"
        className="w-full mb-8"
        variant="outline"
      >
        {running ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Tests laufen...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Alle Tests ausführen
          </>
        )}
      </Button>

      {results && (
        <div className="space-y-4">
          {results.success === false ? (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  Test fehlgeschlagen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">{results.error}</p>
              </CardContent>
            </Card>
          ) : (
            results.tests?.map((test, idx) => (
              <Card key={idx} className={test.success ? 'border-green-500' : 'border-red-500'}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {test.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      {test.name}
                    </div>
                    <Badge variant={test.success ? 'default' : 'destructive'}>
                      {test.success ? 'Passed' : 'Failed'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                    {JSON.stringify(test, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))
          )}

          {results.timestamp && (
            <p className="text-sm text-muted-foreground text-center">
              Getestet am: {new Date(results.timestamp).toLocaleString('de-DE')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}