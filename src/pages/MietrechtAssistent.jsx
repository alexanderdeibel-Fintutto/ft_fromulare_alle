import React from 'react';
import AppHeader from '../components/layout/AppHeader';
import MietrechtChat from '../components/mietrecht/MietrechtChat';

export default function MietrechtAssistent() {

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mietrecht-Assistent</h1>
          <p className="text-gray-600">Formulare finden und mietrechtliche Fragen klären</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <MietrechtChat 
            userType={null}
            appSource="fintutto"
            embedded={true}
          />
        </div>
      </main>
    </div>
  );
}