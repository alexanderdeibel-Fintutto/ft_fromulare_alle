import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartFormBuilder from '../components/forms/SmartFormBuilder';
import BatchFormGenerator from '../components/forms/BatchFormGenerator';
import { toast } from 'sonner';
import { FileText, Zap, Copy } from 'lucide-react';

/**
 * Optimized Form Builder Page
 * Demonstriert alle neuen Optimierungen:
 * - Auto-Prefill, Conditional Fields
 * - Multi-Step Wizard
 * - Real-Time Validierung
 * - Auto-Save Draft
 * - Live PDF Preview
 * - Batch Generation
 */

export default function OptimizedFormBuilder() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const user = await base44.auth.me();
      setUserData(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  // Example template schema with all optimizations
  const exampleTemplateSchema = {
    type: 'object',
    properties: {
      // Mieter-Sektion
      mietFirstName: {
        type: 'string',
        label: 'Vorname Mieter/in',
        prefill: 'firstName',
        required: true,
        suggestions: 'historical'
      },
      mietLastName: {
        type: 'string',
        label: 'Nachname Mieter/in',
        prefill: 'lastName',
        required: true
      },
      mietEmail: {
        type: 'email',
        label: 'E-Mail',
        prefill: 'userEmail',
        required: true
      },
      mietPhone: {
        type: 'phone',
        label: 'Telefon',
        required: false
      },

      // Wohnungs-Sektion
      wohnAddress: {
        type: 'text',
        label: 'Adresse',
        prefill: 'propertyAddress',
        required: true
      },
      wohnCity: {
        type: 'text',
        label: 'Stadt',
        prefill: 'propertyCity',
        required: true
      },
      wohnRooms: {
        type: 'number',
        label: 'Zimmer',
        minimum: 1,
        maximum: 20,
        required: true
      },
      wohnFurnished: {
        type: 'select',
        label: 'Möblierung',
        enum: ['unfurnished', 'partly_furnished', 'furnished'],
        required: true
      },
      wohnFurnitureDesc: {
        type: 'textarea',
        label: 'Möbelbeschreibung',
        rows: 3,
        placeholder: 'Beschreiben Sie die Möbel und Ausstattung',
        // Conditional: nur sichtbar wenn wohnFurnished != 'unfurnished'
        conditions: [
          { dependsOn: 'wohnFurnished', value: 'unfurnished', operator: 'not_equals' }
        ]
      },

      // Miet-Sektion
      mietMonthly: {
        type: 'currency',
        label: 'Monatliche Miete',
        format: 'currency',
        minimum: 0,
        required: true
      },
      mietNebenkosten: {
        type: 'currency',
        label: 'Nebenkosten',
        format: 'currency',
        minimum: 0,
        default: 0
      },
      mietTotal: {
        type: 'currency',
        label: 'Gesamtbetrag',
        format: 'currency',
        // Automatische Berechnung
        compute: (data) => (Number(data.mietMonthly) || 0) + (Number(data.mietNebenkosten) || 0),
        dependsOn: ['mietMonthly', 'mietNebenkosten'],
        disabled: true
      },
      mietDeposit: {
        type: 'currency',
        label: 'Kaution',
        format: 'currency',
        hint: 'z.B. 2x Monatsmiete',
        required: true
      },

      // Vertragsbedingungen
      mietStartDate: {
        type: 'date',
        label: 'Mietbeginn',
        required: true
      },
      mietDuration: {
        type: 'select',
        label: 'Mietdauer',
        enum: ['3_months', '6_months', '12_months', 'unlimited'],
        required: true
      },
      mietPets: {
        type: 'checkbox',
        label: 'Haustiere erlaubt?'
      },
      mietPetsDesc: {
        type: 'textarea',
        label: 'Haustier-Details',
        placeholder: 'Art, Größe, Anzahl der Haustiere',
        conditions: [
          { dependsOn: 'mietPets', value: true, operator: 'equals' }
        ]
      }
    }
  };

  // Example multi-step configuration
  const formSteps = [
    {
      title: 'Mieter/in-Informationen',
      description: 'Geben Sie Ihre persönlichen Daten ein',
      fields: ['mietFirstName', 'mietLastName', 'mietEmail', 'mietPhone'],
      summary: 'Ihre Kontaktinformationen werden für die Vertragserstellung verwendet.'
    },
    {
      title: 'Wohnungsdetails',
      description: 'Informationen zur Wohnung',
      fields: ['wohnAddress', 'wohnCity', 'wohnRooms', 'wohnFurnished', 'wohnFurnitureDesc'],
      summary: 'Diese Details helfen bei der genauen Dokumentation der Wohnung.'
    },
    {
      title: 'Mietbedingungen',
      description: 'Miete und Vertragsbedingungen',
      fields: ['mietMonthly', 'mietNebenkosten', 'mietTotal', 'mietDeposit', 'mietStartDate', 'mietDuration', 'mietPets', 'mietPetsDesc'],
      summary: 'Überprüfen Sie alle Beträge und Bedingungen sorgfältig.'
    }
  ];

  async function handleFormSubmit(formData) {
    try {
      // Generate PDF
      const response = await base44.functions.invoke('generatePDF', {
        templateId: 'mietvertrag',
        templateSlug: 'mietvertrag',
        templateName: 'Mietvertrag',
        formData: formData
      });

      toast.success('Dokument generiert! PDF bereit zum Download.');
      
      // Open PDF
      if (response.data?.file_url) {
        window.open(response.data.file_url, '_blank');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Fehler beim Generieren des Dokuments');
    }
  }

  async function handleBatchGeneration(rowData) {
    return await base44.functions.invoke('generatePDF', {
      templateId: 'mietvertrag',
      templateSlug: 'mietvertrag',
      templateName: 'Mietvertrag',
      formData: rowData
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-600" />
          Optimierte Formularverwaltung
        </h1>
        <p className="text-muted-foreground">
          Auto-Prefill • Conditional Fields • Multi-Step • Auto-Save • Live Preview • Batch Generation
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="smart-form" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-2">
          <TabsContent value="smart-form" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Smart Form
          </TabsContent>
          <TabsContent value="batch" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Batch Generator
          </TabsContent>
        </TabsList>

        {/* Smart Form Tab */}
        <TabsContent value="smart-form" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <SmartFormBuilder
              templateSchema={exampleTemplateSchema}
              templateName="Mietvertrag"
              templateSteps={formSteps}
              userData={userData}
              contextData={{
                property: {
                  address: 'Musterstraße 1',
                  city: 'Berlin',
                  postal_code: '10115'
                }
              }}
              onSubmit={handleFormSubmit}
              onCancel={() => toast.info('Formular abgebrochen')}
            />
          </div>
        </TabsContent>

        {/* Batch Generator Tab */}
        <TabsContent value="batch" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <BatchFormGenerator
              templateSchema={exampleTemplateSchema}
              templateName="Mietvertrag"
              onGenerateBatch={handleBatchGeneration}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-semibold text-blue-900 mb-1">✨ Auto-Prefill</p>
          <p className="text-sm text-blue-800">Felder automatisch aus Benutzerdaten füllen</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="font-semibold text-green-900 mb-1">🔄 Conditional Logic</p>
          <p className="text-sm text-green-800">Felder basierend auf Eingaben ein/aus</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="font-semibold text-purple-900 mb-1">💾 Auto-Save</p>
          <p className="text-sm text-purple-800">Automatisches Speichern von Entwürfen</p>
        </div>
      </div>
    </div>
  );
}