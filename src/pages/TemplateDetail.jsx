import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useTemplate } from '../components/hooks/useTemplate';
import { useTemplateAccess } from '../components/hooks/useTemplateAccess';
import { useContextPrefill } from '../components/hooks/useContextPrefill';
import { useFormState } from '../components/hooks/useFormState';
import { base44 } from '@/api/base44Client';
import AppHeader from '../components/layout/AppHeader';
import ContextBanner from '../components/shared/ContextBanner';
import ContextDataDisplay from '../components/templates/ContextDataDisplay';
import PdfPreview from '../components/pdf/PdfPreview';
import WatermarkBanner from '../components/pdf/WatermarkBanner';
import DownloadButton from '../components/pdf/DownloadButton';
import PaymentModal from '../components/payment/PaymentModal';
import NoAccessGate from '../components/templates/NoAccessGate';
import DynamicForm from '../components/forms/DynamicForm';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

export default function TemplateDetail() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');

  const { template, loading: templateLoading } = useTemplate(slug);
  const { access } = useTemplateAccess(template?.id);
  const { mappedData: prefillData, sourceApp, contextType, contextId } = useContextPrefill();
  const { values, errors, touched, setValue, setFieldTouched, reset } = useFormState(prefillData);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [document, setDocument] = useState(null);

  const hasAccess = access?.has_access || false;
  const hasWatermark = !hasAccess;

  const handleFormChange = (fieldId, value) => {
    setValue(fieldId, value);
  };

  const handleFormBlur = (fieldId) => {
    setFieldTouched(fieldId);
  };

  const handleGeneratePdf = async () => {
    if (!template) return;
    
    // Prüfe Zugriff vor Generierung
    if (!hasAccess) {
      setShowPaymentModal(true);
      return;
    }

    setPdfLoading(true);
    try {
      const contextData = {
        type: contextType,
        id: contextId
      };

      const response = await base44.functions.invoke('generatePDF', {
        templateId: template.id,
        templateSlug: template.slug,
        templateName: template.name,
        formData: values,
        hasWatermark,
        sourceApp,
        contextData,
        propertyId: searchParams.get('property_id'),
        unitId: searchParams.get('unit_id'),
        tenantId: searchParams.get('tenant_id'),
        contractId: searchParams.get('contract_id')
      });

      if (response.data?.file_url) {
        setDocument(response.data);
        setPreviewUrl(response.data.file_url);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!document?.file_url) return;

    // Wenn Pack-5 mit Credits, verbrauche einen Credit vor Download
    if (access?.has_pack5_credits && access?.pack5_purchase_id) {
      try {
        const response = await base44.functions.invoke('consumeTemplate', {
          pack5_purchase_id: access.pack5_purchase_id,
          template_id: template.id,
          template_name: template.name
        });
        
        // Log für Analytics
        base44.analytics.track({
          eventName: 'template_credit_consumed',
          properties: {
            remaining_credits: response.data?.remaining_credits,
            template_id: template.id,
            template_name: template.name,
            purchase_id: access.pack5_purchase_id
          }
        });
      } catch (err) {
        console.error('Error consuming credit:', err);
        // Trotzdem Download erlauben - Credit-Problem sollte nicht Download blockieren
      }
    }

    // Download starten
    window.open(document.file_url, '_blank');
  };



  if (templateLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Vorlage nicht gefunden</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <a
          href={createPageUrl('FormulareIndex')}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Zurück zu Vorlagen
        </a>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {template.name}
          </h1>
          <p className="text-gray-600">
            {template.description}
          </p>
        </div>

        {/* Context Banner */}
        {sourceApp && (
          <ContextBanner sourceApp={sourceApp} />
        )}

        {/* Context Data Display */}
        <ContextDataDisplay 
          contextData={{
            property_id: searchParams.get('property_id'),
            unit_id: searchParams.get('unit_id'),
            tenant_id: searchParams.get('tenant_id'),
            contract_id: searchParams.get('contract_id')
          }}
        />

        {/* Watermark Banner */}
        {hasWatermark && (
          <WatermarkBanner />
        )}

        {!hasAccess ? (
          <div className="max-w-2xl">
            <NoAccessGate
              templateName={template.name}
              onUnlock={() => setShowPaymentModal(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div>
              <div className="bg-white rounded-xl p-6 border">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Formular ausfüllen
                </h2>

                {template.schema ? (
                  <DynamicForm
                    schema={template.schema}
                    values={values}
                    errors={errors}
                    touched={touched}
                    onChange={handleFormChange}
                    onBlur={handleFormBlur}
                    submitLabel="Vorschau generieren"
                    loading={pdfLoading}
                    onSubmit={handleGeneratePdf}
                  />
                ) : (
                  <p className="text-gray-600 text-sm">
                    Kein Formularschema verfügbar
                  </p>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Vorschau
              </h2>

              <PdfPreview loading={pdfLoading} previewUrl={previewUrl} />

              {document && (
                <div className="mt-4 space-y-3">
                  <DownloadButton
                    onClick={handleDownloadPdf}
                    disabled={!document.file_url}
                    label={hasWatermark ? 'PDF herunterladen (mit Wasserzeichen)' : 'PDF herunterladen'}
                  />

                  {!hasWatermark && (
                    <Button
                      onClick={async () => {
                        try {
                          const response = await base44.functions.invoke('generateDOCX', {
                            documentId: document.id
                          });
                          if (response.data?.file_url) {
                            window.open(response.data.file_url, '_blank');
                          }
                        } catch (err) {
                          console.error('DOCX download failed:', err);
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Als Word-Dokument (.docx) herunterladen
                    </Button>
                  )}

                  {hasWatermark && (
                    <Button
                      onClick={() => setShowPaymentModal(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Premium freischalten (PDF ohne Wasserzeichen + DOCX)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        templateId={template.id}
        templateName={template.name}
        templateSlug={template.slug}
      />
    </div>
  );
}