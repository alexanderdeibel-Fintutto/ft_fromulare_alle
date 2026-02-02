import React from 'react';
import { Lock, Zap, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NoAccessGate({ templateName, onUnlock, isLoading = false }) {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="pt-8">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Premium-Vorlage freischalten
            </h3>
            <p className="text-gray-600">
              Die Vorlage "{templateName}" ist nur für Premium-Nutzer verfügbar
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {/* Pack All Option */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Alle Vorlagen freischalten</p>
                  <p className="text-sm text-gray-600">Unbegrenzter Zugriff auf alle Vorlagen ohne Wasserzeichen</p>
                </div>
              </div>
            </div>

            {/* Pack 5 Option */}
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">5er-Pack (5 Credits)</p>
                  <p className="text-sm text-gray-600">Nutze beliebige Vorlagen mit deinen 5 Credits</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onUnlock}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            {isLoading ? 'Wird weitergeleitet...' : 'Premium freischalten'}
          </Button>

          <p className="text-xs text-gray-500">
            ✓ Sichere Zahlung mit Stripe  •  ✓ Sofortiger Zugriff
          </p>
        </div>
      </CardContent>
    </Card>
  );
}