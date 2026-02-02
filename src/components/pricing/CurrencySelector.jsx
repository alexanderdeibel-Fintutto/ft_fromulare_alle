import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CurrencySelector({ onCurrencyChange, defaultCurrency = 'EUR' }) {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const data = await base44.entities.Currency.filter(
        { active: true },
        'sort_order',
        10
      );
      setCurrencies(data);
    } catch (err) {
      console.error('Error loading currencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (code) => {
    setSelectedCurrency(code);
    onCurrencyChange?.(code);
  };

  if (loading || currencies.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <select
        value={selectedCurrency}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code}
          </option>
        ))}
      </select>
    </div>
  );
}