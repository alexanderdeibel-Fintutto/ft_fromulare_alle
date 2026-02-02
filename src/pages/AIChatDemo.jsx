import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AIChatWidget from '../components/ai/AIChatWidget';
import AIFeatureToggle from '../components/ai/AIFeatureToggle';

export default function AIChatDemo() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  return (
    <AIFeatureToggle featureKey="chat">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">KI-Chat Demo</h1>
            <p className="text-gray-600">
              Testen Sie den neuen KI-Assistenten mit Prompt-Caching und automatischem Kosten-Tracking
            </p>
          </div>

          <AIChatWidget user={user} />

          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><strong>Prompt Caching:</strong> Bis zu 90% Kostenersparnis bei wiederholten System-Prompts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><strong>Automatisches Tracking:</strong> Jede Anfrage wird in AIUsageLog protokolliert</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><strong>Budget-Kontrolle:</strong> Monatliches Limit mit automatischen Warnungen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><strong>Rate-Limiting:</strong> Schutz vor übermäßiger Nutzung (Standard: 20/Stunde)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><strong>Kosten-Transparenz:</strong> Exakte Kostenanzeige nach jeder Antwort</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AIFeatureToggle>
  );
}