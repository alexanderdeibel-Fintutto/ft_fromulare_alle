import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import CrossSellModal from './CrossSellModal';
import CrossSellBanner from './CrossSellBanner';
import CrossSellToast from './CrossSellToast';

const CrossSellContext = createContext(null);

export function CrossSellProvider({ children, appSource = 'vermietify' }) {
  const [recommendation, setRecommendation] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Event-Handler für Cross-Sell Trigger
  const triggerCrossSell = useCallback(async (eventType, eventData = {}) => {
    try {
      const response = await base44.functions.invoke('getCrossSellRecommendation', {
        event_type: eventType,
        event_data: eventData,
        current_page: window.location.pathname,
        app_source: appSource
      });

      if (response.data?.show_recommendation) {
        setRecommendation(response.data);
        setEventId(response.data.event_id);
        
        // Timing beachten
        if (response.data.timing?.delay_seconds) {
          setTimeout(() => setIsVisible(true), response.data.timing.delay_seconds * 1000);
        } else if (response.data.timing?.show_immediately !== false) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('CrossSell Error:', error);
    }
  }, [appSource]);

  // Klick tracken
  const handleClick = useCallback(async () => {
    if (eventId) {
      try {
        await base44.functions.invoke('trackCrossSellEvent', {
          event_id: eventId,
          action: 'click'
        });
      } catch (e) {
        console.error('Track click failed:', e);
      }
    }
    
    // Zur CTA URL navigieren
    if (recommendation?.messaging?.cta_url) {
      window.location.href = recommendation.messaging.cta_url;
    }
    
    setIsVisible(false);
    setRecommendation(null);
  }, [eventId, recommendation]);

  // Dismiss tracken
  const handleDismiss = useCallback(async () => {
    if (eventId) {
      try {
        await base44.functions.invoke('trackCrossSellEvent', {
          event_id: eventId,
          action: 'dismiss'
        });
      } catch (e) {
        console.error('Track dismiss failed:', e);
      }
    }
    
    setIsVisible(false);
    setRecommendation(null);
  }, [eventId]);

  // Globale Event-Listener
  useEffect(() => {
    const handleLimitReached = (e) => triggerCrossSell('limit_reached', e.detail);
    const handleFeatureBlocked = (e) => triggerCrossSell('feature_blocked', e.detail);
    const handleSuccess = (e) => triggerCrossSell('success', e.detail);

    window.addEventListener('fintutto:limit_reached', handleLimitReached);
    window.addEventListener('fintutto:feature_blocked', handleFeatureBlocked);
    window.addEventListener('fintutto:success', handleSuccess);

    return () => {
      window.removeEventListener('fintutto:limit_reached', handleLimitReached);
      window.removeEventListener('fintutto:feature_blocked', handleFeatureBlocked);
      window.removeEventListener('fintutto:success', handleSuccess);
    };
  }, [triggerCrossSell]);

  // Render Empfehlung basierend auf Placement
  const renderRecommendation = () => {
    if (!isVisible || !recommendation) return null;

    const placement = recommendation.placement?.location || 'modal';

    switch (placement) {
      case 'modal':
        return (
          <CrossSellModal 
            recommendation={recommendation}
            onAccept={handleClick}
            onDismiss={handleDismiss}
            isVisible={isVisible}
          />
        );
      case 'banner':
        return (
          <CrossSellBanner 
            recommendation={recommendation}
            onAccept={handleClick}
            onDismiss={handleDismiss}
            isVisible={isVisible}
          />
        );
      case 'toast':
        return (
          <CrossSellToast 
            recommendation={recommendation}
            onAccept={handleClick}
            onDismiss={handleDismiss}
            isVisible={isVisible}
          />
        );
      default:
        return (
          <CrossSellModal 
            recommendation={recommendation}
            onAccept={handleClick}
            onDismiss={handleDismiss}
            isVisible={isVisible}
          />
        );
    }
  };

  return (
    <CrossSellContext.Provider value={{ triggerCrossSell }}>
      {children}
      {renderRecommendation()}
    </CrossSellContext.Provider>
  );
}

export const useCrossSell = () => {
  const context = useContext(CrossSellContext);
  if (!context) {
    throw new Error('useCrossSell must be used within a CrossSellProvider');
  }
  return context;
};