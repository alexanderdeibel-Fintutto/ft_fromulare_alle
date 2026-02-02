-- Cross-App Document Sharing Table
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quelle Dokument
  source_app TEXT NOT NULL,
  document_id TEXT NOT NULL,
  document_title TEXT,
  document_url TEXT,
  
  -- Empfänger
  shared_with_email TEXT NOT NULL,
  shared_with_app TEXT, -- Optional: nur für bestimmte App freigeben
  
  -- Freigabe-Details
  access_level TEXT CHECK (access_level IN ('view', 'download', 'edit')) DEFAULT 'download',
  shared_by_email TEXT NOT NULL,
  
  -- Zeitliche Kontrolle
  shared_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  -- Sicherheit
  password_hash TEXT, -- Optional: Hash des Passworts
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP,
  revoked_by TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_active_share UNIQUE (document_id, shared_with_email, source_app, shared_at)
);

CREATE INDEX idx_document_shares_shared_with_email ON document_shares(shared_with_email);
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id, source_app);
CREATE INDEX idx_document_shares_is_active ON document_shares(is_active);
CREATE INDEX idx_document_shares_expires_at ON document_shares(expires_at);

-- Audit Log für Cross-App Sharing
CREATE TABLE IF NOT EXISTS document_share_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES document_shares(id),
  source_app TEXT,
  target_app TEXT,
  action TEXT,
  actor_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_share_audit_share_id ON document_share_audit(share_id);
CREATE INDEX idx_document_share_audit_created_at ON document_share_audit(created_at);