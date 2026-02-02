import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function CrossSellBanner({ triggerEvent, triggerPage }) {
  const [recommendation, setRecommendation] = useState(null);
  const [showing, setShowing] = useState(true);

  useEffect(() => {
    loadRecommendation();
  }, [triggerEvent, triggerPage]);

  const loadRecommendation = async () => {
    try {
      const response = await base44.functions.invoke('getCrossSellRecommendation', {
        triggerEvent,
        triggerPage
      });
      if (response.data?.recommendation) {
        setRecommendation(response.data.recommendation);
        setShowing(true);
      }
    } catch (err) {
      console.error('Load recommendation failed:', err);
    }
  };

  const handleDismiss = async () => {
    setShowing(false);
    // Track dismissal if recommendation exists
    if (recommendation) {
      try {
        await base44.functions.invoke('trackCrossSellEvent', {
          action: 'dismiss'
        });
      } catch (err) {
        console.error('Track dismiss failed:', err);
      }
    }
  };

  const handleClick = async () => {
    if (recommendation) {
      try {
        await base44.functions.invoke('trackCrossSellEvent', {
          action: 'click'
        });
      } catch (err) {
        console.error('Track click failed:', err);
      }
    }
  };

  if (!showing || !recommendation) return null;

  const colors = {
    high: 'bg-amber-50 border-amber-200',
    medium: 'bg-blue-50 border-blue-200',
    low: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 flex items-center justify-between ${colors[recommendation.priority]}`}>
      <div>
        <p className="text-sm font-medium text-gray-900">
          {recommendation.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleClick}
          size="sm"
          className="gap-1 bg-blue-600 hover:bg-blue-700"
        >
          {recommendation.cta}
          <ArrowRight className="w-3 h-3" />
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-black/5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}