// ============================================================================
// SERVICE MANAGER - Zentrale Service-Verwaltung für alle Apps
// Verwendung: import { ServiceManager } from '@/services/service-manager'
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@latest';

export class ServiceManager {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Hole Service-Konfiguration
   */
  async getService(serviceKey) {
    const { data, error } = await this.supabase
      .from('services_registry')
      .select('*')
      .eq('service_key', serviceKey)
      .single();

    if (error) throw new Error(`Service not found: ${serviceKey}`);
    return data;
  }

  /**
   * Prüfe ob App den Service nutzen darf
   */
  async canAppUseService(appName, serviceKey) {
    const service = await this.getService(serviceKey);
    
    if (!service.is_active) {
      throw new Error(`Service ${serviceKey} is not active`);
    }

    if (!service.apps_enabled.includes(appName)) {
      throw new Error(`App ${appName} is not allowed to use ${serviceKey}`);
    }

    return true;
  }

  /**
   * Rufe Base44 Workspace Integration auf
   */
  async callWorkspaceIntegration(serviceKey, appName, operation, params) {
    await this.canAppUseService(appName, serviceKey);

    const service = await this.getService(serviceKey);

    // Hier würde base44.integrations.custom.call() aufgerufen
    // Für jetzt: Template
    
    const startTime = Date.now();
    try {
      // const result = await base44.integrations.custom.call(
      //   service.base44_integration_name,
      //   operation,
      //   params
      // );

      await this.logUsage(serviceKey, appName, operation, 'success', null, Date.now() - startTime);
      return result;
    } catch (error) {
      await this.logUsage(serviceKey, appName, operation, 'failed', error.message, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Rufe Supabase Edge Function auf
   */
  async callEdgeFunction(serviceKey, appName, payload) {
    await this.canAppUseService(appName, serviceKey);

    const service = await this.getService(serviceKey);
    const functionName = service.edge_function_name;

    const startTime = Date.now();
    try {
      const { data, error } = await this.supabase.functions.invoke(functionName, {
        body: {
          ...payload,
          app_name: appName,
          service_key: serviceKey
        }
      });

      if (error) throw error;

      await this.logUsage(serviceKey, appName, functionName, 'success', null, Date.now() - startTime);
      return data;
    } catch (error) {
      await this.logUsage(serviceKey, appName, functionName, 'failed', error.message, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Logs Service-Nutzung für Analytics
   */
  async logUsage(serviceKey, appName, operation, status, errorMsg, responseTimeMs) {
    const service = await this.getService(serviceKey);
    const cost = status === 'success' ? service.cost_per_call : 0;

    await this.supabase.from('service_usage_log').insert({
      service_key: serviceKey,
      app_name: appName,
      operation,
      status,
      cost,
      response_time_ms: responseTimeMs,
      metadata: { error: errorMsg }
    });
  }

  /**
   * Hole Service-Konfiguration (API-Keys, etc.)
   */
  async getServiceConfig(serviceKey, configKey) {
    const { data, error } = await this.supabase
      .from('service_configs')
      .select('config_value')
      .eq('service_key', serviceKey)
      .eq('config_key', configKey)
      .single();

    if (error) throw new Error(`Config not found: ${serviceKey}.${configKey}`);
    return data.config_value;
  }

  /**
   * Setze Service-Konfiguration (nur für Admins)
   */
  async setServiceConfig(serviceKey, configKey, configValue, isEncrypted = true) {
    const { error } = await this.supabase.from('service_configs').upsert({
      service_key: serviceKey,
      config_key: configKey,
      config_value: configValue,
      is_encrypted: isEncrypted
    });

    if (error) throw error;
  }

  /**
   * Liste alle verfügbaren Services für eine App
   */
  async listServicesForApp(appName) {
    const { data, error } = await this.supabase
      .from('services_registry')
      .select('*')
      .contains('apps_enabled', [appName])
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }
}

// Singleton Export
let serviceManager = null;

export function getServiceManager() {
  if (!serviceManager) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    serviceManager = new ServiceManager(supabaseUrl, supabaseKey);
  }
  return serviceManager;
}