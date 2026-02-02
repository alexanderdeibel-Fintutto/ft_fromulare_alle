-- ============================================================================
-- FINTUTTO COMPLETE DATABASE SCHEMA
-- Zentrale Tabellen für alle Services & Apps
-- ============================================================================

-- ============================================================================
-- 1. IMMOBILIEN MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'DE',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  property_type TEXT, -- 'apartment', 'house', 'commercial'
  living_area DECIMAL(10,2),
  rooms INTEGER,
  year_built INTEGER,
  rent DECIMAL(10,2),
  purchase_price DECIMAL(12,2),
  openimmo_id TEXT UNIQUE,
  immoscout_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. LETTERDIENSTE
-- ============================================================================

CREATE TABLE IF NOT EXISTS letter_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  letter_type TEXT NOT NULL, -- 'brief', 'einschreiben', 'rueckschein'
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  subject TEXT,
  pdf_url TEXT,
  letterxpress_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'created', 'processed', 'delivered', 'failed'
  tracking_url TEXT,
  tracking_number TEXT,
  cost DECIMAL(10,2),
  paid BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. BONITÄTSPRÜFUNG (SCHUFA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS schufa_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  person_type TEXT, -- 'natural', 'business'
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  postal_code TEXT,
  city TEXT,
  email TEXT,
  schufa_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  score INTEGER,
  rating TEXT, -- 'A', 'B', 'C', 'D'
  cost DECIMAL(10,2),
  paid BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. BANKING (finAPI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finapi_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  finapi_user_id TEXT,
  account_id TEXT,
  transaction_id TEXT UNIQUE,
  amount DECIMAL(12,2),
  purpose TEXT,
  counterparty_name TEXT,
  counterparty_iban TEXT,
  booking_date DATE,
  value_date DATE,
  category TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finapi_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  finapi_user_id TEXT UNIQUE,
  account_id TEXT UNIQUE,
  account_name TEXT,
  iban TEXT,
  bank_name TEXT,
  balance DECIMAL(12,2),
  currency TEXT DEFAULT 'EUR',
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. STEUER & BUCHHALTUNG (DATEV)
-- ============================================================================

CREATE TABLE IF NOT EXISTS datev_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  format TEXT, -- 'csv', 'xml'
  records_count INTEGER,
  status TEXT DEFAULT 'pending',
  file_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. IMMOBILIENBÖRSEN SYNC
-- ============================================================================

CREATE TABLE IF NOT EXISTS openimmo_syncs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  action TEXT, -- 'export', 'import'
  properties_count INTEGER,
  status TEXT,
  xml_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immoscout24_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id),
  immoscout_id TEXT UNIQUE,
  title TEXT,
  status TEXT,
  listing_url TEXT,
  external_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. ZÄHLERSTÄNDE & NEBENKOSTEN (TECHEM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS techem_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  meter_number TEXT,
  reading_value DECIMAL(12,3),
  reading_date DATE,
  unit TEXT, -- 'kWh', 'm³'
  sync_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  period TEXT, -- '2026-01'
  type TEXT, -- 'heating', 'water', 'electricity'
  consumption DECIMAL(12,3),
  cost DECIMAL(10,2),
  unit TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS techem_syncs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  property_id UUID,
  sync_type TEXT,
  readings_count INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. E-SIGNATUR (DOCUSIGN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS docusign_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  document_type TEXT, -- 'rental_agreement', 'lease_termination'
  envelope_id TEXT UNIQUE,
  status TEXT, -- 'sent', 'signed', 'completed', 'declined'
  signers_count INTEGER,
  signers JSONB,
  document_url TEXT,
  webhook_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS docusign_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  envelope_id TEXT REFERENCES docusign_signatures(envelope_id),
  event_type TEXT, -- 'envelope-sent', 'envelope-completed', 'recipient-signed'
  signer_email TEXT,
  timestamp TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. AFFILIATE & PROVISIONEN
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  tracking_id TEXT UNIQUE,
  affiliate TEXT, -- 'verivox', 'check24'
  product_type TEXT, -- 'strom', 'gas', 'versicherung'
  affiliate_url TEXT,
  user_postal_code TEXT,
  household_size INTEGER,
  status TEXT DEFAULT 'active',
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  tracking_id TEXT,
  affiliate TEXT,
  product_type TEXT,
  conversion_amount DECIMAL(12,2),
  commission DECIMAL(10,2),
  partner_id TEXT,
  status TEXT, -- 'pending', 'approved', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. TENANT & MIETER MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  move_in_date DATE,
  move_out_date DATE,
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  deposit_returned BOOLEAN DEFAULT false,
  status TEXT, -- 'active', 'moved_out', 'blocked'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. ZAHLUNGEN & RECHNUNGEN
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  stripe_payment_id TEXT UNIQUE,
  service_key TEXT, -- 'letterxpress', 'schufa', etc.
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  status TEXT, -- 'pending', 'succeeded', 'failed'
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_id TEXT,
  invoice_number TEXT UNIQUE,
  amount DECIMAL(10,2),
  status TEXT, -- 'draft', 'sent', 'paid', 'overdue'
  due_date DATE,
  items JSONB, -- Array von {description, amount, quantity}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. WETTER & LOKALINFORMATIONEN
-- ============================================================================

CREATE TABLE IF NOT EXISTS weather_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  date DATE,
  temperature_min DECIMAL(5,2),
  temperature_max DECIMAL(5,2),
  precipitation DECIMAL(5,2),
  wind_speed DECIMAL(5,2),
  condition TEXT, -- 'sunny', 'rainy', 'snowy'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. ANALYTICS & USAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL,
  app_name TEXT NOT NULL,
  user_id TEXT,
  operation TEXT,
  status TEXT, -- 'success', 'failed', 'pending'
  cost DECIMAL(10,4),
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  event_type TEXT, -- 'page_view', 'button_click', 'service_call'
  user_id TEXT,
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES für Performance
-- ============================================================================

CREATE INDEX idx_properties_user ON properties(user_id);
CREATE INDEX idx_properties_app ON properties(app_name);
CREATE INDEX idx_letter_orders_status ON letter_orders(status);
CREATE INDEX idx_letter_orders_app ON letter_orders(app_name);
CREATE INDEX idx_schufa_orders_status ON schufa_orders(status);
CREATE INDEX idx_finapi_transactions_user ON finapi_transactions(finapi_user_id);
CREATE INDEX idx_techem_readings_property ON techem_readings(property_id);
CREATE INDEX idx_docusign_status ON docusign_signatures(status);
CREATE INDEX idx_affiliate_conversions_app ON affiliate_conversions(app_name);
CREATE INDEX idx_service_usage_log_service ON service_usage_log(service_key);
CREATE INDEX idx_service_usage_log_app ON service_usage_log(app_name);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_id);
CREATE INDEX idx_tenants_property ON tenants(property_id);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE schufa_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE finapi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users können ihre eigenen Daten sehen
CREATE POLICY "Users see own data" ON properties FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users insert own data" ON properties FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users update own data" ON properties FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Admins können alles sehen
CREATE POLICY "Admins see all" ON properties FOR ALL USING (auth.jwt() ->> 'role' = 'admin');