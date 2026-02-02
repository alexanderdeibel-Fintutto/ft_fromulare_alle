import React, { useState, useEffect } from 'react';
import { Mail, Plus, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EmailCampaignBuilder() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_type: 'one_off',
    email_subject: '',
    email_body: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.EmailCampaign.filter(
        { creator_email: currentUser.email },
        '-created_at',
        50
      );

      setCampaigns(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await base44.functions.invoke('manageCampaign', {
        action: 'create',
        campaign_data: formData
      });

      toast.success('Campaign erstellt');
      setFormData({
        campaign_name: '',
        campaign_type: 'one_off',
        email_subject: '',
        email_body: ''
      });
      setShowCreate(false);
      loadCampaigns();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      await base44.functions.invoke('manageCampaign', {
        action: 'send',
        campaign_id: campaignId
      });

      toast.success('Campaign versendet');
      loadCampaigns();
    } catch (err) {
      toast.error('Fehler beim Versenden');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="w-8 h-8" />
          Email Campaign Builder
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Campaign
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Campaign Name"
            value={formData.campaign_name}
            onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <select
            value={formData.campaign_type}
            onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="one_off">One-Off</option>
            <option value="drip">Drip Sequence</option>
            <option value="automation">Automation</option>
            <option value="broadcast">Broadcast</option>
          </select>

          <input
            type="text"
            placeholder="Email Subject"
            value={formData.email_subject}
            onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <textarea
            placeholder="Email Body (HTML)"
            value={formData.email_body}
            onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
            rows="6"
            className="w-full border rounded-lg p-2 font-mono text-sm"
          />

          <div className="flex gap-3">
            <Button onClick={handleCreateCampaign} className="bg-green-600 hover:bg-green-700">
              Erstellen
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{campaign.campaign_name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {campaign.campaign_type} • {campaign.sent_count} versendet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Open: {campaign.open_rate?.toFixed(1)}% • Click: {campaign.click_rate?.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
                {campaign.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handleSendCampaign(campaign.id)}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Versenden
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}