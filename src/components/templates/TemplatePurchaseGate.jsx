import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function TemplatePurchaseGate({ productId, children, onCheckout }) {
  return (
    <Card className="p-8 border-l-4 border-l-blue-500">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 rounded-full p-3">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Premium Template</h3>
          <p className="text-gray-600 mb-4">
            Um diese Vorlage zu nutzen, musst du sie zunächst erwerben.
          </p>
          <Button 
            onClick={() => onCheckout?.()} 
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            Jetzt erwerben
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}