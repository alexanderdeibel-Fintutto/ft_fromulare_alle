
/**
 * FinTutto App Configuration
 * Zentrale Konfiguration für FinTutto Ökosystem Integration
 */

export const APP_CONFIG = {
  // App Identity
  appId: 'fintutto_hub', // Eindeutige App-ID im Ökosystem
  appName: 'FinTutto Hub',
  appDescription: 'Zentrale Verwaltungsplattform für Immobilien',
  
  // User Type für diese App
  userType: 'landlord', // landlord, tenant, caretaker, manager
  
  // Messaging & Communication Settings
  messaging: {
    enabled: true,
    features: {
      directMessages: true,      // 1:1 Chats zwischen Usern
      taskComments: true,        // Kommentare bei Aufgaben
      documentDiscussions: true, // Diskussionen bei Dokumenten
      groupChats: true,          // Gruppen-Chats (meist nur Vermieter)
      broadcasts: true,          // Broadcast-Nachrichten (nur Vermieter)
      voiceMessages: false,      // Voice Messages (optional)
      videoCall: false           // Video Calls (optional)
    },
    notifications: {
      inApp: true,
      email: true,
      push: false // Push Notifications (später)
    }
  },
  
  // FinTutto Ecosystem Integration
  ecosystem: {
    supabaseIntegration: true,
    crossAppSharing: true,
    centralizedPricing: true,
    sharedKnowledgeBase: true
  },
  
  // Feature Flags
  features: {
    aiAssistant: true,
    advancedReporting: true,
    multiTenant: true,
    whiteLabel: false
  }
};

export default APP_CONFIG;
