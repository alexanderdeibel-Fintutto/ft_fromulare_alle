import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook für Persona-Awareness
 * Lädt die passende KI-Persona basierend auf User-Typ
 */
export function useAIPersona() {
  const [persona, setPersona] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (!user) return;

    // User-Typ ermitteln (aus Custom Claims oder User-Metadata)
    const userType = user.user_metadata?.user_type || 'landlord';
    const userTier = user.user_metadata?.subscription_tier || 'free';

    // Persona basierend auf User-Typ auswählen
    let selectedPersona = {
      id: 'default',
      tone: 'friendly',
      formality: 'sie',
      upgrade_sensitivity: 'medium',
    };

    if (userType === 'landlord' || userType === 'vermieter') {
      selectedPersona = {
        id: userTier === 'pro' ? 'vermieter_pro' : 'vermieter_free',
        name: userTier === 'pro' ? 'Vermieter Pro' : 'Vermieter Free',
        tone: userTier === 'pro' ? 'professional' : 'friendly',
        formality: 'sie',
        upgrade_sensitivity: userTier === 'pro' ? 'low' : 'high',
      };
    } else if (userType === 'tenant' || userType === 'mieter') {
      selectedPersona = {
        id: 'mieter',
        name: 'Mieter',
        tone: 'friendly',
        formality: 'du',
        upgrade_sensitivity: 'medium',
      };
    } else if (userType === 'caretaker' || userType === 'hausmeister') {
      selectedPersona = {
        id: 'hausmeister',
        name: 'Hausmeister',
        tone: 'professional',
        formality: 'sie',
        upgrade_sensitivity: 'low',
      };
    } else if (userType === 'manager' || userType === 'hausverwaltung') {
      selectedPersona = {
        id: 'hausverwaltung',
        name: 'Hausverwaltung',
        tone: 'professional',
        formality: 'sie',
        upgrade_sensitivity: 'low',
      };
    }

    setPersona(selectedPersona);
  }, [user]);

  return { persona, user };
}

/**
 * Helper Funktion für Persona-bezogene Nachrichten
 */
export function getPersonaGreeting(persona) {
  const greetings = {
    vermieter_pro: 'Guten Tag! Wie kann ich Sie bei Ihrer Immobilienverwaltung unterstützen?',
    vermieter_free: 'Hallo! Ich helfe dir gerne bei deinen Vermietungsfragen.',
    mieter: 'Hallo! Wie kann ich dir heute helfen?',
    hausmeister: 'Guten Tag! Woran kann ich Sie unterstützen?',
    hausverwaltung: 'Guten Tag! Wie kann ich Ihre Verwaltung unterstützen?',
    default: 'Hallo! Wie kann ich dir helfen?',
  };

  return greetings[persona?.id] || greetings.default;
}

/**
 * Helper Funktion für Persona-bezogene Upgrade-Hinweise
 */
export function shouldShowUpgradeHint(persona) {
  if (!persona) return false;

  const chance = {
    high: 0.8,
    medium: 0.4,
    low: 0.1,
  }[persona.upgrade_sensitivity] || 0.4;

  return Math.random() < chance;
}