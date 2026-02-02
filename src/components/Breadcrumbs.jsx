import React from 'react';
import { ChevronRight } from 'lucide-react';
import InternalLink from './InternalLink';

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm py-4 px-4 bg-gray-50 rounded-lg mb-6">
      <InternalLink to="Home" className="text-blue-600 hover:underline">
        Home
      </InternalLink>
      
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.link ? (
            <InternalLink to={item.link} className="text-blue-600 hover:underline">
              {item.label}
            </InternalLink>
          ) : (
            <span className="text-gray-600">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}