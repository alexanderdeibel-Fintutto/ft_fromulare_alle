import React from 'react';

/**
 * Form Layout Components
 * Structure and organization for form fields
 */

export function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          <div className="mt-4 border-b border-gray-200" />
        </div>
      )}
      {children}
    </div>
  );
}

export function FormGrid({ columns = 2, gap = 'gap-6', children, className = '' }) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  }[columns] || 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} ${gap} ${className}`}>
      {children}
    </div>
  );
}

export function FormRow({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  );
}

export function FormColumn({ children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

export function FormDivider({ className = '' }) {
  return <hr className={`my-6 border-gray-200 ${className}`} />;
}

export function FormActions({ children, className = '', align = 'right' }) {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[align] || 'justify-end';

  return (
    <div className={`flex ${alignClass} gap-3 pt-6 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function FormDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-600 ${className}`}>
      {children}
    </p>
  );
}