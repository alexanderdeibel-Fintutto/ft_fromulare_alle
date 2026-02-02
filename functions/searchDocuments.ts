import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const documentType = url.searchParams.get('type');
    const dateFrom = url.searchParams.get('from');
    const dateTo = url.searchParams.get('to');
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    // Fetch all user documents
    let documents = await base44.entities.GeneratedDocument.filter(
      { user_email: user.email, is_deleted: false },
      '-created_date',
      500
    );

    // Filter by query (title, document_type, template_id)
    if (query) {
      const lowerQuery = query.toLowerCase();
      documents = documents.filter(doc =>
        doc.title?.toLowerCase().includes(lowerQuery) ||
        doc.document_type?.toLowerCase().includes(lowerQuery) ||
        doc.template_id?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by document type
    if (documentType) {
      documents = documents.filter(doc => doc.document_type === documentType);
    }

    // Filter by date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      documents = documents.filter(doc => new Date(doc.created_date) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      documents = documents.filter(doc => new Date(doc.created_date) <= to);
    }

    return Response.json({
      success: true,
      results: documents.slice(0, limit),
      total: documents.length,
      query: query
    });
  } catch (error) {
    console.error('Search documents error:', error);
    return Response.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
});