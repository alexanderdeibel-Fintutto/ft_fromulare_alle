import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Test Batch Generation Function
 * Testet die Batch-Generierung mit Beispieldaten
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sample data for testing
    const testDataRows = [
      {
        mietFirstName: 'Max',
        mietLastName: 'Müller',
        mietEmail: 'max.mueller@example.com',
        mietPhone: '+49123456789',
        wohnAddress: 'Musterstraße 1',
        wohnCity: 'Berlin',
        wohnRooms: 3,
        wohnFurnished: 'unfurnished',
        mietMonthly: 1200,
        mietNebenkosten: 200,
        mietDeposit: 3600,
        mietStartDate: '2024-02-01',
        mietDuration: '12_months',
        mietPets: false
      },
      {
        mietFirstName: 'Anna',
        mietLastName: 'Schmidt',
        mietEmail: 'anna.schmidt@example.com',
        mietPhone: '+49987654321',
        wohnAddress: 'Beispielweg 5',
        wohnCity: 'München',
        wohnRooms: 2,
        wohnFurnished: 'partly_furnished',
        wohnFurnitureDesc: 'Küche und Bett möbliert',
        mietMonthly: 1500,
        mietNebenkosten: 150,
        mietDeposit: 4500,
        mietStartDate: '2024-03-01',
        mietDuration: '6_months',
        mietPets: true,
        mietPetsDesc: '1 Katze'
      },
      {
        mietFirstName: 'Peter',
        mietLastName: 'Weber',
        mietEmail: 'peter.weber@example.com',
        mietPhone: '+49555555555',
        wohnAddress: 'Teststraße 99',
        wohnCity: 'Hamburg',
        wohnRooms: 4,
        wohnFurnished: 'unfurnished',
        mietMonthly: 2000,
        mietNebenkosten: 300,
        mietDeposit: 6000,
        mietStartDate: '2024-04-01',
        mietDuration: '12_months',
        mietPets: false
      }
    ];

    // Call batch generation function
    const response = await base44.functions.invoke('batchFormGenerator', {
      templateId: 'mietvertrag',
      templateName: 'Mietvertrag',
      dataRows: testDataRows
    });

    return Response.json({
      test: true,
      message: 'Test-Batch-Generierung gestartet',
      inputRows: testDataRows.length,
      result: response.data
    });

  } catch (error) {
    console.error('Test batch generation error:', error);
    return Response.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});