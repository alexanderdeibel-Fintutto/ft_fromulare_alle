import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DunningManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'retry',
    trigger_days_overdue: 7,
    max_attempts: 5
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.DunningRule.filter(
        { user_email: currentUser.email },
        null,
        50
      );

      setRules(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!formData.rule_name) {
      toast.error('Rule name required');
      return;
    }

    try {
      await base44.entities.DunningRule.create({
        user_email: user.email,
        ...formData,
        is_active: true
      });

      toast.success('Rule created');
      setFormData({ rule_name: '', rule_type: 'retry', trigger_days_overdue: 7, max_attempts: 5 });
      setShowCreate(false);
      loadRules();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          Dunning Management
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Rule Name"
            value={formData.rule_name}
            onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <select
            value={formData.rule_type}
            onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="retry">Retry Payment</option>
            <option value="pause_service">Pause Service</option>
            <option value="cancel">Cancel</option>
            <option value="escalate">Escalate</option>
          </select>

          <input
            type="number"
            placeholder="Trigger after days overdue"
            value={formData.trigger_days_overdue}
            onChange={(e) => setFormData({ ...formData, trigger_days_overdue: parseInt(e.target.value) })}
            className="w-full border rounded-lg p-2"
          />

          <div className="flex gap-3">
            <Button onClick={handleCreateRule} className="flex-1 bg-green-600 hover:bg-green-700">
              Create
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {rule.rule_name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Type: {rule.rule_type} | Trigger: {rule.trigger_days_overdue} days
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {rule.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}