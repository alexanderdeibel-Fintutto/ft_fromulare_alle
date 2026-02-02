import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Download, ShoppingCart, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('templates');

  const { data: items = [] } = useQuery({
    queryKey: ['marketplace', category, searchTerm],
    queryFn: async () => {
      if (category === 'templates') {
        return base44.asServiceRole.entities.MarketplaceTemplate.filter({
          is_published: true
        }) || [];
      } else {
        return base44.asServiceRole.entities.MarketplacePlugin.filter({
          is_published: true
        }) || [];
      }
    }
  });

  const handlePurchase = async (item) => {
    if (item.price_cents === 0) {
      toast.success('Kostenlos hinzugefügt');
      return;
    }

    try {
      const response = await base44.functions.invoke('purchaseMarketplaceItem', {
        item_id: item.id,
        item_type: category === 'templates' ? 'template' : 'plugin'
      });

      toast.success('Kaufvorgang eingeleitet');
    } catch (error) {
      toast.error('Fehler beim Kauf');
    }
  };

  const filtered = items.filter(item => {
    const title = (item.title || item.name || '').toLowerCase();
    return title.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <Card key={item.id} className="p-4 flex flex-col">
                  {item.preview_image && (
                    <img
                      src={item.preview_image}
                      alt={item.title}
                      className="w-full h-40 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 flex-1">{item.description}</p>

                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {item.rating?.toFixed(1) || 'Neu'}
                    </span>
                    <span className="text-xs text-gray-500">({item.review_count})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-indigo-600">
                      {item.price_cents === 0 ? 'Kostenlos' : `€${(item.price_cents / 100).toFixed(2)}`}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(item)}
                      className="gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {item.price_cents === 0 ? 'Hinzufügen' : 'Kaufen'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="plugins" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <Card key={item.id} className="p-4 flex flex-col">
                  {item.icon_url && (
                    <img
                      src={item.icon_url}
                      alt={item.name}
                      className="w-12 h-12 rounded mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 flex-1">{item.description}</p>

                  <div className="flex items-center gap-1 mb-3">
                    <Download className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">{item.installs} Installationen</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-indigo-600">
                      {item.price_cents === 0 ? 'Kostenlos' : `€${(item.price_cents / 100).toFixed(2)}`}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(item)}
                      className="gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {item.price_cents === 0 ? 'Installieren' : 'Kaufen'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}