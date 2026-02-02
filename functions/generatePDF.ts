import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';
import html2canvas from 'npm:html2canvas@1.4.1';

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

    const { 
      templateId, 
      templateSlug, 
      templateName, 
      formData, 
      hasWatermark,
      sourceApp,
      contextData,
      propertyId,
      unitId,
      tenantId,
      contractId
    } = await req.json();

    // Fetch template
    const templates = await base44.asServiceRole.entities.DocumentTemplate.filter(
      { id: templateId },
      undefined,
      1
    );
    const template = templates?.[0];

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check access
    if (!hasWatermark) {
      const purchases = await base44.asServiceRole.entities.TemplatePurchase.filter(
        { user_email: user.email, status: 'completed' },
        '-created_date',
        100
      );

      const hasAccess = purchases.some(p =>
        p.package_type === 'pack_all' ||
        p.template_id === templateId ||
        (p.package_type === 'pack_5' && p.credits_remaining > 0)
      );

      if (!hasAccess) {
        return Response.json(
          { error: 'Access denied. Please purchase this template.' },
          { status: 403 }
        );
      }
    }

    // Generate optimized print PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true // Optimiertes PDF für bessere Dateigröße
    });

    // Create optimizer instance
    const { PDFPrintOptimizer } = await import('./PDFPrintOptimizer.js');
    const optimizer = new PDFPrintOptimizer(pdf);

    // Add header with optimization
    optimizer.addPrintHeader({
      imageUrl: template.header_image_url,
      title: template.name,
      subtitle: template.header_text,
      date: new Date().toLocaleDateString('de-DE'),
      referenceNumber: formData.referenceNumber || formData.documentNumber
    });

    // Add form data as optimized sections
    const groupedData = groupFormDataBySection(formData);
    
    Object.entries(groupedData).forEach(([section, fields]) => {
      if (section !== '_ungrouped') {
        optimizer.addSection(formatSectionTitle(section));
      }

      Object.entries(fields).forEach(([key, value]) => {
        // Skip empty fields
        if (!value) return;

        // Format key as label
        const label = formatFieldLabel(key);
        optimizer.addFormField(label, value, { boxed: false, inline: false });
      });

      optimizer.currentY += 3; // Extra space between sections
    });

    // Add signature lines if it's a contract
    if (template.slug?.includes('vertrag') || template.slug?.includes('contract')) {
      optimizer.addSection('Unterschriften');
      optimizer.addSignatureLine('Mieter/in');
      optimizer.addSignatureLine('Vermieter/in', false);
    }

    // Add footer with optimization
    optimizer.addFooter(template.footer_text || 'FinTuttO - Intelligente Immobilienverwaltung', {
      pageNumbers: true,
      lineAbove: true
    });

    // Add watermark if draft
    if (hasWatermark) {
      optimizer.addDraftWatermark();
    }

    // Convert optimized PDF to blob and upload
    const pdfBlob = optimizer.getBlob();
    const fileName = `${templateSlug}-${Date.now()}.pdf`;

    const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfBlob });

    // Save document record
    const doc = await base44.entities.GeneratedDocument.create({
      user_email: user.email,
      template_id: templateId,
      document_type: templateSlug,
      title: templateName,
      file_url,
      file_name: fileName,
      input_data: formData,
      has_watermark: hasWatermark,
      is_favorite: false,
      source_app: sourceApp || 'ft_formulare',
      context_data: contextData || {},
      property_id: propertyId || null,
      unit_id: unitId || null,
      tenant_id: tenantId || null,
      contract_id: contractId || null,
      sync_status: 'pending'
    });

    return Response.json({
      success: true,
      file_url,
      file_name: fileName,
      id: doc.id
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json(
      { error: error.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
});

// Helper: Format field label from key
function formatFieldLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

// Helper: Format section title
function formatSectionTitle(section) {
  return section
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper: Group form data by section (underscore prefix = section)
function groupFormDataBySection(data) {
  const grouped = { _ungrouped: {} };

  Object.entries(data).forEach(([key, value]) => {
    if (!value) return;

    const parts = key.split('_');
    if (parts.length > 1 && parts[0].length > 2) {
      // Potential section prefix
      const section = parts[0];
      if (!grouped[section]) grouped[section] = {};
      grouped[section][key] = value;
    } else {
      grouped._ungrouped[key] = value;
    }
  });

  return grouped;
}