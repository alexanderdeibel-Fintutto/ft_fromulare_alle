import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';

export default function SmartDateInput({
  label,
  value,
  onChange,
  hint,
  required,
  minDate,
  maxDate,
  quickSelect,
  format = 'dd.MM.yyyy'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(year, month - 1, day);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Quick select options
  const quickOptions = [
    { label: 'Heute', days: 0 },
    { label: '+1 Woche', days: 7 },
    { label: '+1 Monat', days: 30 },
    { label: '+3 Monate', days: 90 }
  ];

  const handleQuickSelect = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange?.(formatDate(date));
    setIsOpen(false);
  };

  const handleDateClick = (day) => {
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    onChange?.(formatDate(date));
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDay = getFirstDayOfMonth(displayMonth);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
      const isSelected = value === formatDate(date);
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`p-2 text-sm rounded hover:bg-blue-100 ${
            isSelected ? 'bg-blue-500 text-white font-bold' : ''
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <Input
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="dd.mm.yyyy"
            className="flex-1"
          />
          {value && (
            <button onClick={() => onChange?.(null)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Calendar Picker */}
        {isOpen && (
          <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-64">
            {/* Quick Select */}
            <div className="mb-4 flex flex-wrap gap-2">
              {quickOptions.map(opt => (
                <Button
                  key={opt.label}
                  onClick={() => handleQuickSelect(opt.days)}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1))}>
                ←
              </button>
              <span className="font-medium">
                {displayMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1))}>
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-2.5 p-1 hover:bg-gray-100 rounded"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}