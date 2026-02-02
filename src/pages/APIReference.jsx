import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Code, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function APIReference() {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const endpoints = [
    {
      category: 'Workspace Integrations',
      color: 'bg-purple-500',
      apis: [
        {
          id: 'stripe',
          name: 'Stripe Payment',
          description: 'Checkout Session erstellen',
          code: `import { base44 } from '@/api/base44Client';

// Create Checkout Session
const checkout = await base44.functions.invoke('createStripeCheckout', {
  priceId: 'price_...',
  successUrl: 'https://...',
  cancelUrl: 'https://...'
});

// Redirect user
window.location.href = checkout.url;`
        },
        {
          id: 'brevo',
          name: 'Brevo Email',
          description: 'Email via Brevo senden',
          code: `import { base44 } from '@/api/base44Client';

await base44.integrations.Core.SendEmail({
  to: 'user@example.com',
  subject: 'Willkommen',
  body: '<h1>Hallo Welt</h1>',
  from_name: 'FinTuttO'
});`
        },
        {
          id: 'openai',
          name: 'OpenAI LLM',
          description: 'Dokument generieren mit AI',
          code: `import { base44 } from '@/api/base44Client';

const result = await base44.integrations.Core.InvokeLLM({
  prompt: 'Generiere einen Mietvertrag...',
  add_context_from_internet: true,
  response_json_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      content: { type: "string" }
    }
  }
});`
        }
      ]
    },
    {
      category: 'Edge Functions',
      color: 'bg-green-500',
      apis: [
        {
          id: 'letterxpress',
          name: 'LetterXpress',
          description: 'Brief versenden',
          code: `import { base44 } from '@/api/base44Client';

const result = await base44.functions.invoke('letterxpress-send', {
  letter_type: 'einschreiben',
  recipient_name: 'Max Mustermann',
  recipient_address: 'Musterstr. 1, 12345 Stadt',
  pdf_url: 'https://...',
  subject: 'Kündigung'
});

// Tracking ID erhalten
console.log(result.tracking_id);`
        },
        {
          id: 'schufa',
          name: 'SCHUFA Check',
          description: 'Bonitätsprüfung durchführen',
          code: `import { base44 } from '@/api/base44Client';

const result = await base44.functions.invoke('schufa-check', {
  person_type: 'natural',
  first_name: 'Max',
  last_name: 'Mustermann',
  date_of_birth: '1990-01-01',
  street: 'Musterstr. 1',
  postal_code: '12345',
  city: 'Berlin'
});

// Rating: A, B, C, D
console.log(result.rating, result.score);`
        },
        {
          id: 'docusign',
          name: 'DocuSign',
          description: 'Dokument zur Unterschrift senden',
          code: `import { base44 } from '@/api/base44Client';

const result = await base44.functions.invoke('docusign-send', {
  document_url: 'https://...',
  signers: [
    { email: 'user@example.com', name: 'Max Mustermann' }
  ],
  subject: 'Bitte unterschreiben Sie den Mietvertrag'
});

// Envelope ID für Tracking
console.log(result.envelope_id);`
        }
      ]
    },
    {
      category: 'Database Operations',
      color: 'bg-yellow-500',
      apis: [
        {
          id: 'db-create',
          name: 'Datensatz erstellen',
          description: 'Neue Immobilie anlegen',
          code: `import { base44 } from '@/api/base44Client';

const property = await base44.entities.properties.create({
  address: 'Musterstr. 1, 12345 Berlin',
  type: 'apartment',
  size_sqm: 85,
  monthly_rent: 1200,
  status: 'available'
});`
        },
        {
          id: 'db-query',
          name: 'Daten abfragen',
          description: 'Verfügbare Wohnungen finden',
          code: `import { base44 } from '@/api/base44Client';

const available = await base44.entities.properties.filter(
  { status: 'available' },
  '-created_date',
  10
);`
        },
        {
          id: 'db-realtime',
          name: 'Real-time Updates',
          description: 'Live auf Änderungen hören',
          code: `import { base44 } from '@/api/base44Client';

const unsubscribe = base44.entities.properties.subscribe((event) => {
  if (event.type === 'create') {
    console.log('Neue Immobilie:', event.data);
  }
});

// Später: unsubscribe();`
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Reference</h1>
          <p className="text-gray-600 mt-2">Vollständige Dokumentation aller Services & Integrationen</p>
        </div>

        {/* Categories */}
        {endpoints.map((category, i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded ${category.color}`} />
              <h2 className="text-2xl font-bold">{category.category}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {category.apis.map((api) => (
                <Card key={api.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Code className="w-5 h-5" />
                          {api.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{api.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(api.code, api.id)}
                        className="gap-2"
                      >
                        {copiedCode === api.id ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedCode === api.id ? 'Kopiert!' : 'Kopieren'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {api.code}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Error Handling */}
        <Card>
          <CardHeader>
            <CardTitle>Error Handling</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`try {
  const result = await base44.functions.invoke('service-name', payload);
  console.log(result);
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else if (error.status === 500) {
    console.error('Server error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>LetterXpress:</strong> 100 calls/hour</p>
              <p><strong>SCHUFA:</strong> 20 calls/hour</p>
              <p><strong>DocuSign:</strong> 30 calls/hour</p>
              <p><strong>Stripe:</strong> Unlimited (Stripe limits apply)</p>
              <p><strong>OpenAI:</strong> 20 calls/hour</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}