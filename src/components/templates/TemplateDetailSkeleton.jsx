import React from 'react';

export default function TemplateDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-4 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
      
      <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full mb-6" />
        
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
          
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
          
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-12 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}