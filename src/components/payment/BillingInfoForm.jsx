import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COUNTRIES = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'BE', name: 'Belgien' },
  { code: 'FR', name: 'Frankreich' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'IT', name: 'Italien' },
  { code: 'ES', name: 'Spanien' },
  { code: 'PL', name: 'Polen' },
  { code: 'SE', name: 'Schweden' },
];

export default function BillingInfoForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    address: '',
    zip: '',
    city: '',
    country: 'DE',
    tax_id: '',
    is_business: false
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.full_name?.trim()) newErrors.full_name = 'Name erforderlich';
    if (!form.email?.trim()) newErrors.email = 'E-Mail erforderlich';
    if (!form.address?.trim()) newErrors.address = 'Adresse erforderlich';
    if (!form.zip?.trim()) newErrors.zip = 'PLZ erforderlich';
    if (!form.city?.trim()) newErrors.city = 'Stadt erforderlich';
    if (form.is_business && !form.tax_id?.trim()) {
      newErrors.tax_id = 'USt-ID erforderlich für Business';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <Input
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder="Max Mustermann"
          className={errors.full_name ? 'border-red-500' : ''}
        />
        {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail *
        </label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="max@example.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Straße & Hausnummer *
        </label>
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Musterstraße 123"
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PLZ *
          </label>
          <Input
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
            placeholder="10115"
            className={errors.zip ? 'border-red-500' : ''}
          />
          {errors.zip && <p className="text-red-600 text-xs mt-1">{errors.zip}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stadt *
          </label>
          <Input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Berlin"
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Land *
        </label>
        <Select value={form.country} onValueChange={(val) => setForm({ ...form, country: val })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_business}
            onChange={(e) => setForm({ ...form, is_business: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Dies ist eine Business/Unternehmens-Adresse</span>
        </label>
      </div>

      {form.is_business && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            USt-ID / VAT-ID *
          </label>
          <Input
            value={form.tax_id}
            onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
            placeholder="DE123456789"
            className={errors.tax_id ? 'border-red-500' : ''}
          />
          {errors.tax_id && <p className="text-red-600 text-xs mt-1">{errors.tax_id}</p>}
          <p className="text-xs text-gray-500 mt-2">
            Mit gültiger USt-ID: Keine Umsatzsteuer (Reverse Charge)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Wird verarbeitet...' : 'Mit Stripe zahlen'}
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={() => {
            if (validate()) {
              document.getElementById('paypal-trigger').click();
            }
          }}
          className="w-full bg-[#0070BA] hover:bg-[#005ea6]"
        >
          Mit PayPal zahlen
        </Button>
      </div>
    </form>
  );
}