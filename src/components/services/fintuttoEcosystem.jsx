// DEPRECATED: Use backend functions instead
// 
// Example usage:
// import { base44 } from '@/api/base44Client';
// const pricing = await base44.functions.invoke('getAppPricing', { appName: 'vermietify' });

import { base44 } from '@/api/base44Client';

/**
 * FinTutto Ecosystem Integration
 * All operations moved to backend functions for security
 */

export const fintuttoEcosystem = {
  /**
   * App Pricing - use backend function instead
   */
  async getAppPricing(appName = null) {
    try {
      const { data } = await base44.functions.invoke('getAppPricing', { appName });
      return data;
    } catch (error) {
      console.error('Error fetching app pricing:', error);
      throw error;
    }
  },

  /**
   * Cross-Selling Recommendations
   */
  async getCrossSellRecommendations(userEmail) {
    try {
      const { data } = await base44.functions.invoke('getCrossSellRecommendations', { userEmail });
      return data;
    } catch (error) {
      console.error('Error fetching cross-sell recommendations:', error);
      throw error;
    }
  },

  /**
   * Buildings Summary (für Immobilien-Apps)
   */
  async getBuildingsSummary(userEmail = null) {
    try {
      const { data } = await base44.functions.invoke('getBuildingsSummary', { userEmail });
      return data;
    } catch (error) {
      console.error('Error fetching buildings summary:', error);
      throw error;
    }
  },

  /**
   * Meters with Readings (für Nebenkostenabrechnungen)
   */
  async getMetersWithReadings(buildingId = null) {
    try {
      const { data } = await base44.functions.invoke('getMetersWithReadings', { buildingId });
      return data;
    } catch (error) {
      console.error('Error fetching meters with readings:', error);
      throw error;
    }
  },

  /**
   * Get all FinTutto apps with user subscription status
   */
  async getEcosystemApps(userEmail) {
    try {
      const { data } = await base44.functions.invoke('getEcosystemApps', { userEmail });
      return data;
    } catch (error) {
      console.error('Error fetching ecosystem apps:', error);
      throw error;
    }
  },

  /**
   * Check if user has access to specific app
   */
  async checkAppAccess(userEmail, appName) {
    try {
      const { data } = await base44.functions.invoke('checkAppAccess', { userEmail, appName });
      return data?.has_access || false;
    } catch (error) {
      console.error('Error checking app access:', error);
      return false;
    }
  }
};

export default fintuttoEcosystem;