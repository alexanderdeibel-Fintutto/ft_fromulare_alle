-- ============================================================================
-- FINTUTTO SERVICES REGISTRY - Zentrale Service-Verwaltung
-- ============================================================================

-- Haupttabelle: Welche Services existieren?
CREATE TABLE IF NOT EXISTS services_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT UNIQUE NOT NULL, -- 'letterxpress', 'schufa', etc.
  display_name TEXT NOT NULL,
  description TEXT,
  integration_type TEXT NOT NULL, -- 'base44_workspace' oder 'supabase_edge'
  base44_integration_name TEXT, -- Name in Base44 Workspace
  edge_function_name TEXT, -- Name der Supabase Edge Function
  is_active BOOLEAN DEFAULT true,
  apps_enabled TEXT[], -- ARRAY['vermietify', 'mieterapp', ...]
  pricing JSONB, -- {"key": value} für Preisgestaltung
  cost_per_call DECIMAL(10,4), -- Was kostet uns ein Aufruf?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Log: Wer nutzt welchen Service wie oft?
CREATE TABLE IF NOT EXISTS service_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL REFERENCES services_registry(service_key),
  app_name TEXT NOT NULL,
  user_id TEXT,
  operation TEXT, -- z.B. 'send_letter', 'check_schufa'
  status TEXT, -- 'success', 'failed', 'pending'
  cost DECIMAL(10,4),
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Configurations: API-Keys, Credentials
CREATE TABLE IF NOT EXISTS service_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL REFERENCES services_registry(service_key),
  config_key TEXT NOT NULL, -- 'api_key', 'partner_id', etc.
  config_value TEXT, -- encrypted in production
  is_encrypted BOOLEAN DEFAULT true,
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_key, config_key)
);

-- Insert Workspace Integrations (Base44)
INSERT INTO services_registry (service_key, display_name, integration_type, base44_integration_name, apps_enabled, is_active)
VALUES
  ('stripe', 'Stripe Payments', 'base44_workspace', 'stripe', ARRAY['vermietify', 'hausmeisterpro', 'mieterapp', 'calc', 'fintutto'], true),
  ('brevo', 'Brevo Email', 'base44_workspace', 'brevo', ARRAY['vermietify', 'hausmeisterpro', 'mieterapp', 'calc', 'fintutto'], true),
  ('openai', 'OpenAI GPT', 'base44_workspace', 'openai', ARRAY['vermietify', 'hausmeisterpro', 'mieterapp', 'calc', 'fintutto'], true),
  ('mapbox', 'Mapbox Maps', 'base44_workspace', 'mapbox', ARRAY['vermietify', 'hausmeisterpro', 'mieterapp'], true)
ON CONFLICT (service_key) DO NOTHING;

-- Insert Edge Function Services
INSERT INTO services_registry (service_key, display_name, integration_type, edge_function_name, apps_enabled, pricing, cost_per_call, is_active)
VALUES
  ('letterxpress', 'LetterXpress Postversand', 'supabase_edge', 'letterxpress-send', ARRAY['vermietify', 'mieterapp'], '{"brief": 1.49, "einschreiben": 4.99, "rueckschein": 6.99}', 0.70, true),
  ('schufa', 'SCHUFA BonitätsCheck', 'supabase_edge', 'schufa-check', ARRAY['vermietify', 'mieterapp'], '{"check": 29.95, "monitoring": 4.95}', 8.00, true),
  ('finapi', 'finAPI Banking', 'supabase_edge', 'finapi-sync', ARRAY['vermietify', 'fintutto'], '{}', 0.50, true),
  ('datev', 'DATEV Steuerexport', 'supabase_edge', 'datev-export', ARRAY['vermietify', 'fintutto'], '{}', 2.00, true)
ON CONFLICT (service_key) DO NOTHING;

-- Enable RLS
ALTER TABLE services_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_configs ENABLE ROW LEVEL SECURITY;

-- Policies (Admins können lesen/ändern, Apps können nur lesen)
CREATE POLICY "Anyone can read services_registry" ON services_registry FOR SELECT USING (true);
CREATE POLICY "Admins can modify services_registry" ON services_registry FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Anyone can insert usage log" ON service_usage_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read own usage" ON service_usage_log FOR SELECT USING (true);

CREATE POLICY "Admins can read configs" ON service_configs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can modify configs" ON service_configs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');