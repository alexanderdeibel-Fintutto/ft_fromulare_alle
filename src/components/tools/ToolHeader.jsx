import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ToolHeader({ toolName, toolDescription }) {
  return (
    <div className="mb-8">
      <a
        href={createPageUrl('Tool')}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Tools
      </a>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {toolName}
      </h1>
      {toolDescription && (
        <p className="text-gray-600">
          {toolDescription}
        </p>
      )}
    </div>
  );
}