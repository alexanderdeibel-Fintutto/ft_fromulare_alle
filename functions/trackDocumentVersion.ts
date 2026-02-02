import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      documentId,
      changeType,
      changeDescription,
      changedFields = []
    } = await req.json();

    if (!documentId || !changeType) {
      return Response.json(
        { error: 'documentId and changeType required' },
        { status: 400 }
      );
    }

    // Get current document
    const document = await base44.entities.GeneratedDocument.get(documentId);
    if (!document || document.user_email !== user.email) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get latest version number
    const versions = await base44.entities.DocumentVersion.filter(
      { document_id: documentId },
      '-version_number',
      1
    );

    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

    // Create version record
    const version = await base44.entities.DocumentVersion.create({
      document_id: documentId,
      version_number: nextVersion,
      file_url: document.file_url,
      docx_url: document.docx_url,
      change_type: changeType,
      change_description: changeDescription,
      changed_fields: changedFields,
      created_by: user.email,
      is_current: true
    });

    // Mark previous versions as not current
    if (versions.length > 0) {
      for (const v of versions) {
        await base44.entities.DocumentVersion.update(v.id, {
          is_current: false
        });
      }
    }

    return Response.json({
      success: true,
      version_id: version.id,
      version_number: nextVersion
    });
  } catch (error) {
    console.error('Track document version error:', error);
    return Response.json(
      { error: error.message || 'Failed to track version' },
      { status: 500 }
    );
  }
});