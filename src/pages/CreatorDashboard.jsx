import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Download, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatorDashboard() {
  const [loading, setLoading] = useState(false);

  const { data: earnings = [], refetch } = useQuery({
    queryKey: ['creatorEarnings'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.asServiceRole.entities.CreatorEarnings.filter({
        creator_email: user.email
      }) || [];
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['creatorTransactions'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.asServiceRole.entities.MarketplaceTransaction.filter({
        creator_email: user.email
      }) || [];
    }
  });

  const totalEarnings = earnings.reduce((sum, e) => sum + (e.total_earnings_cents || 0), 0);
  const pendingEarnings = earnings.reduce((sum, e) => sum + (e.pending_earnings_cents || 0), 0);
  const totalWithdrawn = earnings.reduce((sum, e) => sum + (e.withdrawn_earnings_cents || 0), 0);

  const handlePayout = async (earningId) => {
    setLoading(true);
    try {
      const earning = earnings.find(e => e.id === earningId);
      await base44.functions.invoke('processCreatorPayout', {
        item_id: earning.item_id,
        item_type: earning.item_type
      });
      await refetch();
      toast.success('Auszahlung eingeleitet');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Auszahlung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { month: 'Jan', earnings: 240 },
    { month: 'Feb', earnings: 320 },
    { month: 'Mär', earnings: 280 },
    { month: 'Apr', earnings: 450 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamtverdienste</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(totalEarnings / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(pendingEarnings / 100).toFixed(2)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausgezahlt</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(totalWithdrawn / 100).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="earnings">
          <TabsList>
            <TabsTrigger value="earnings">Verdienste</TabsTrigger>
            <TabsTrigger value="chart">Statistiken</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="mt-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Items & Verdienste</h2>
              <div className="space-y-4">
                {earnings.map(earning => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {earning.item_type === 'template' ? 'Template' : 'Plugin'} #{earning.item_id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Ausstehend: €{(earning.pending_earnings_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handlePayout(earning.id)}
                      disabled={loading || earning.pending_earnings_cents < 2000}
                      size="sm"
                      className="gap-2"
                    >
                      {loading && <Loader className="w-4 h-4 animate-spin" />}
                      Auszahlen
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="chart" className="mt-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Verdienste im Zeitverlauf</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="earnings" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}