import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Setup Script: Erstellt fehlende Supabase Tabellen
 * Nur für Admin
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // SQL für neue Tabellen (wird manuell in Supabase ausgeführt)
    const sql = `
-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  workspace_name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  api_key VARCHAR NOT NULL UNIQUE,
  api_secret VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Integration Webhooks (für Cross-App Events)
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  webhook_url VARCHAR NOT NULL,
  event_types TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Event Log (für Webhooks & Audits)
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  event_type VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_building_created (building_id, created_at)
);

-- Cross-App Sync Log
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app VARCHAR NOT NULL,
  target_app VARCHAR NOT NULL,
  building_id UUID NOT NULL,
  tenant_id UUID,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  sync_date TIMESTAMP DEFAULT NOW()
);
    `;

    return Response.json({
      status: 'SQL_READY',
      message: 'Kopiere dieses SQL in Supabase SQL Editor und führe es aus',
      sql
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});