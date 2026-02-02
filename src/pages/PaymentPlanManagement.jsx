import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, CheckCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaymentPlanManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.PaymentPlan.filter(
        { user_email: currentUser.email },
        '-created_at',
        50
      );

      setPlans(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const activePlans = plans.filter(p => p.status === 'active').length;
  const completedPlans = plans.filter(p => p.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
        <CreditCard className="w-8 h-8" />
        Payment Plans
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total Plans</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{plans.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{activePlans}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{completedPlans}</p>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map(plan => {
          const totalInstallments = plan.installment_count || 0;
          const completedInstallments = plan.installments?.filter(i => i.status === 'paid').length || 0;
          const progress = (completedInstallments / totalInstallments) * 100;

          return (
            <div key={plan.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  €{(plan.total_amount_cents / 100).toFixed(2)}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  plan.status === 'active' ? 'bg-green-100 text-green-800' :
                  plan.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {plan.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {completedInstallments} of {totalInstallments} installments paid ({progress.toFixed(0)}%)
              </p>

              <div className="w-full h-2 bg-gray-200 rounded-full mb-3">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {plan.installments && (
                <div className="text-xs text-gray-600 space-y-1">
                  {plan.installments.slice(0, 2).map((inst, idx) => (
                    <p key={idx}>
                      {inst.status === 'paid' ? '✓' : '○'} Installment {inst.installment_number}: €{(inst.amount_cents / 100).toFixed(2)} - {inst.due_date}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}