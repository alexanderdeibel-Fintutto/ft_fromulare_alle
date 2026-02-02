import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntegrationSetup from '../components/integrations/IntegrationSetup';
import IntegrationsList from '../components/integrations/IntegrationsList';
import { Settings, Zap } from 'lucide-react';

export default function IntegrationManager() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIntegrationAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Integration Manager</h1>
          </div>
          <p className="text-gray-600">Connect your workflow with external services</p>
        </div>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList>
            <TabsTrigger value="setup">Setup Integrations</TabsTrigger>
            <TabsTrigger value="active">Active Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Add New Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <IntegrationSetup onIntegrationAdded={handleIntegrationAdded} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <IntegrationsList key={refreshKey} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Google Drive & Dropbox</h4>
              <p>Documents generated from workflows will be automatically uploaded to your cloud storage.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Asana & Jira</h4>
              <p>When a workflow completes, automatically create tasks or issues in your project management tool.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Lexoffice & Sevdesk</h4>
              <p>Processed invoices are automatically sent to your accounting software.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}