import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader, Plus, Settings, Lock, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function EnterpriseSettings() {
  const [showSSODialog, setShowSSODialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [ssoData, setSsoData] = useState({
    organization_name: '',
    sso_provider: 'saml',
    idp_url: '',
    client_id: '',
    client_secret: '',
    domain_restriction: '',
    auto_create_users: true,
    force_sso: false
  });

  const [contractData, setContractData] = useState({
    contract_name: '',
    contract_type: 'custom',
    content: '',
    effective_date: '',
    expiry_date: ''
  });

  const { data: ssoConfig } = useQuery({
    queryKey: ['ssoConfig'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const result = await base44.asServiceRole.entities.SSOConfiguration.filter({
        organization_email: user.email
      });
      return result?.[0] || null;
    }
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.asServiceRole.entities.EnterpriseContract.filter({
        organization_email: user.email
      }) || [];
    }
  });

  const handleSaveSSO = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('configureSSOProvider', {
        ...ssoData,
        domain_restriction: ssoData.domain_restriction.split(',').filter(d => d.trim())
      });
      setShowSSODialog(false);
      toast.success('SSO konfiguriert');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('createCustomContract', contractData);
      setShowContractDialog(false);
      setContractData({
        contract_name: '',
        contract_type: 'custom',
        content: '',
        effective_date: '',
        expiry_date: ''
      });
      toast.success('Vertrag erstellt');
    } catch (error) {
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Enterprise Settings</h1>

        <Tabs defaultValue="sso">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sso" className="gap-2">
              <Lock className="w-4 h-4" />
              SSO
            </TabsTrigger>
            <TabsTrigger value="sla" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              SLA
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2">
              <FileText className="w-4 h-4" />
              Verträge
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Settings className="w-4 h-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          {/* SSO Tab */}
          <TabsContent value="sso" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowSSODialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                SSO konfigurieren
              </Button>
            </div>

            {ssoConfig && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{ssoConfig.organization_name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Provider</p>
                    <p className="font-medium text-gray-900 capitalize">{ssoConfig.sso_provider}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium text-green-600">Aktiv</p>
                  </div>
                  <div>
                    <p className="text-gray-600">IDP URL</p>
                    <p className="font-medium text-gray-900 truncate">{ssoConfig.idp_url}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Auto-Create</p>
                    <p className="font-medium text-gray-900">{ssoConfig.auto_create_users ? 'Ja' : 'Nein'}</p>
                  </div>
                </div>
              </Card>
            )}

            <Dialog open={showSSODialog} onOpenChange={setShowSSODialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>SSO konfigurieren</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Organisationsname</label>
                    <Input
                      value={ssoData.organization_name}
                      onChange={(e) => setSsoData({ ...ssoData, organization_name: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider</label>
                    <select
                      value={ssoData.sso_provider}
                      onChange={(e) => setSsoData({ ...ssoData, sso_provider: e.target.value })}
                      disabled={loading}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="saml">SAML</option>
                      <option value="oauth">OAuth</option>
                      <option value="openid">OpenID Connect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">IDP URL</label>
                    <Input
                      value={ssoData.idp_url}
                      onChange={(e) => setSsoData({ ...ssoData, idp_url: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Client ID</label>
                    <Input
                      value={ssoData.client_id}
                      onChange={(e) => setSsoData({ ...ssoData, client_id: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Client Secret</label>
                    <Input
                      type="password"
                      value={ssoData.client_secret}
                      onChange={(e) => setSsoData({ ...ssoData, client_secret: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Erlaubte Domänen (kommagetrennt)</label>
                    <Input
                      value={ssoData.domain_restriction}
                      onChange={(e) => setSsoData({ ...ssoData, domain_restriction: e.target.value })}
                      placeholder="company.com, partner.com"
                      disabled={loading}
                    />
                  </div>
                  <Button onClick={handleSaveSSO} disabled={loading} className="w-full gap-2">
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Speichern
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* SLA Tab */}
          <TabsContent value="sla" className="mt-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">SLA-Verwaltung</h3>
              <p className="text-gray-600">Definiere Service Level Agreements für deine Organisation</p>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowContractDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Vertrag erstellen
              </Button>
            </div>

            <div className="space-y-3">
              {contracts.map(contract => (
                <Card key={contract.id} className="p-4">
                  <h4 className="font-medium text-gray-900">{contract.contract_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Version {contract.version} • Status: <span className="capitalize font-medium">{contract.status}</span>
                  </p>
                </Card>
              ))}
            </div>

            <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Vertrag erstellen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vertragsname</label>
                    <Input
                      value={contractData.contract_name}
                      onChange={(e) => setContractData({ ...contractData, contract_name: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Inhalt</label>
                    <Textarea
                      value={contractData.content}
                      onChange={(e) => setContractData({ ...contractData, content: e.target.value })}
                      rows={6}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Gültig ab</label>
                      <Input
                        type="date"
                        value={contractData.effective_date}
                        onChange={(e) => setContractData({ ...contractData, effective_date: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gültig bis</label>
                      <Input
                        type="date"
                        value={contractData.expiry_date}
                        onChange={(e) => setContractData({ ...contractData, expiry_date: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateContract} disabled={loading} className="w-full gap-2">
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Erstellen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="mt-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Audit Reports</h3>
              <p className="text-gray-600">Generiere detaillierte Audit-Berichte für Compliance</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}