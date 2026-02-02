═══════════════════════════════════════════════════════════════════════════════
  CROSS-APP DOCUMENT SHARING
  Dokument-Freigabe zwischen Usern
═══════════════════════════════════════════════════════════════════════════════

TABELLE: document_shares
─────────────────────────────────────────────────────────────────────────────

Struktur:
  - id (UUID): Primary Key
  - document_id (UUID): Referenz zum Dokument
  - shared_with_user_id (UUID): Empfänger User ID
  - shared_by (UUID): Absender User ID
  - access_level (ENUM): 'view' | 'download' | 'edit'
  - shared_at (TIMESTAMP): Zeitstempel der Freigabe
  - expires_at (TIMESTAMP, nullable): Gültigkeitsdauer
  - password (STRING, nullable): Optional für sichere Links

─────────────────────────────────────────────────────────────────────────────

OPERATIONEN:
─────────────────────────────────────────────────────────────────────────────

1. DOKUMENT FREIGEBEN
   ──────────────────
   await supabase.from('document_shares').insert({
     document_id: doc.id,
     shared_with_user_id: recipientUserId,
     access_level: 'download',  // 'view', 'download', 'edit'
     shared_by: currentUser.id
   });

2. FREIGEGEBENE DOKUMENTE LADEN
   ────────────────────────────
   const { data } = await supabase
     .from('document_shares')
     .select('*, documents(*)')
     .eq('shared_with_user_id', currentUser.id);

3. FREIGABE WIDERRUFEN
   ────────────────────
   await supabase
     .from('document_shares')
     .delete()
     .eq('document_id', doc.id)
     .eq('shared_with_user_id', recipientUserId);

4. ZUGRIFF PRÜFEN
   ──────────────
   const { data } = await supabase
     .from('document_shares')
     .select('access_level')
     .eq('document_id', doc.id)
     .eq('shared_with_user_id', currentUser.id)
     .single();
   
   // Zugriff erlaubt wenn data.access_level vorhanden

─────────────────────────────────────────────────────────────────────────────

ACCESS LEVELS:
─────────────────────────────────────────────────────────────────────────────

'view'
  - Nur anschauen
  - Keine Downloads
  - Kein Export

'download'
  - Anschauen
  - Download / PDF Export
  - Kein Bearbeiten

'edit'
  - Vollständiger Zugriff
  - Bearbeiten möglich
  - Eigene Copies erstellen

─────────────────────────────────────────────────────────────────────────────

KOMPONENTEN ZUM IMPLEMENTIEREN:
─────────────────────────────────────────────────────────────────────────────

☐ DocumentShareButton
  - Button zum Freigeben
  - Recipient-Auswahl
  - Access Level Dropdown

☐ SharedDocumentsList
  - Liste freigegebener Dokumente
  - Mit Absender-Info
  - Zugriff Level anzeigen

☐ DocumentAccessChecker
  - Hook zur Zugriffsprüfung
  - Returns: hasAccess, accessLevel, loading

☐ SharePermissionsManager
  - Freigaben verwalten
  - Widerrufen
  - Expiration setzen

─────────────────────────────────────────────────────────────────────────────

SICHERHEIT:
─────────────────────────────────────────────────────────────────────────────

✓ Row Level Security (RLS) aktivieren
  - Users sehen nur ihre eigenen Shares
  - Admin sehen alle

✓ Access Control prüfen
  - Vor Download/Edit prüfen
  - Expiration validieren

✓ Audit Logging
  - Wer hat mit wem geteilt
  - Wann zugegriffen
  - Welche Aktion

═══════════════════════════════════════════════════════════════════════════════