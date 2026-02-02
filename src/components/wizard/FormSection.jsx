import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FormSection({ title, children, defaultOpen = true, collapsible = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-4">
      <div
        className={`px-6 py-4 flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {collapsible && (
          <button type="button" className="text-gray-500">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}