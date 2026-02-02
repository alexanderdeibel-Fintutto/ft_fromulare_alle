import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'npm:docx@8.5.0';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await req.json();

    if (!documentId) {
      return Response.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Get document
    const document = await base44.asServiceRole.entities.GeneratedDocument.get(documentId);
    if (!document || document.user_email !== user.email) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access (no watermark = has access)
    if (document.has_watermark) {
      return Response.json({ error: 'Premium required for DOCX download' }, { status: 403 });
    }

    // Get template
    const template = await base44.asServiceRole.entities.DocumentTemplate.get(document.template_id);
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create DOCX
    const sections = [];

    // Header
    if (template.header_text) {
      sections.push(
        new Paragraph({
          text: template.header_text,
          heading: HeadingLevel.HEADING_1
        })
      );
    }

    // Title
    sections.push(
      new Paragraph({
        text: template.name,
        heading: HeadingLevel.HEADING_2
      })
    );

    // Form data
    Object.entries(document.input_data || {}).forEach(([key, value]) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${key}: `, bold: true }),
            new TextRun({ text: String(value || '') })
          ]
        })
      );
      sections.push(new Paragraph({ text: '' })); // Empty line
    });

    // Footer
    if (template.footer_text) {
      sections.push(
        new Paragraph({
          text: template.footer_text,
          italics: true
        })
      );
    }

    const doc = new Document({
      sections: [{ children: sections }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    const fileName = `${template.slug}-${Date.now()}.docx`;

    // Upload DOCX
    const { file_url } = await base44.integrations.Core.UploadFile({ file: buffer });

    // Update document with DOCX URL
    await base44.asServiceRole.entities.GeneratedDocument.update(documentId, {
      docx_url: file_url
    });

    return Response.json({
      success: true,
      file_url,
      file_name: fileName
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    return Response.json(
      { error: error.message || 'DOCX generation failed' },
      { status: 500 }
    );
  }
});