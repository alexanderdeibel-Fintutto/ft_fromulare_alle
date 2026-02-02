import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Route, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function APIGatewayDashboard() {
  const [user, setUser] = useState(null);
  const [newRoute, setNewRoute] = useState({
    path: '',
    method: 'GET',
    target_service: '',
    requires_auth: true,
  });
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const { data: routes } = useQuery({
    queryKey: ['apiRoutes'],
    queryFn: async () => {
      return await base44.entities.APIGatewayRoute.list('-created_date');
    },
    enabled: !!user,
  });

  const createRouteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.APIGatewayRoute.create(newRoute);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiRoutes'] });
      setNewRoute({ path: '', method: 'GET', target_service: '', requires_auth: true });
      setShowDialog(false);
      toast.success('Route created');
    },
  });

  const toggleRouteMutation = useMutation({
    mutationFn: async ({ id, is_enabled }) => {
      await base44.entities.APIGatewayRoute.update(id, { is_enabled: !is_enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiRoutes'] });
      toast.success('Route updated');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const enabledRoutes = routes?.filter(r => r.is_enabled).length || 0;
  const authRoutes = routes?.filter(r => r.requires_auth).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">API Gateway</h1>
            <p className="text-gray-600 mt-2">Manage API routes</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Route</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Path</label>
                  <Input
                    value={newRoute.path}
                    onChange={(e) => setNewRoute({...newRoute, path: e.target.value})}
                    placeholder="/api/v1/users"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Method</label>
                  <Select value={newRoute.method} onValueChange={(v) => setNewRoute({...newRoute, method: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Target Service</label>
                  <Input
                    value={newRoute.target_service}
                    onChange={(e) => setNewRoute({...newRoute, target_service: e.target.value})}
                    placeholder="user-service"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Requires Authentication</label>
                  <Switch checked={newRoute.requires_auth} onCheckedChange={(v) => setNewRoute({...newRoute, requires_auth: v})} />
                </div>

                <Button onClick={() => createRouteMutation.mutate()} disabled={!newRoute.path.trim()} className="w-full">
                  Create Route
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Route className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{routes?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Routes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Route className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{enabledRoutes}</p>
                  <p className="text-sm text-gray-600">Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Route className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{authRoutes}</p>
                  <p className="text-sm text-gray-600">Protected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {routes?.map(route => (
            <Card key={route.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{route.method}</Badge>
                      <span className="font-mono font-semibold">{route.path}</span>
                    </div>
                    <p className="text-sm text-gray-600">Target: {route.target_service}</p>
                    {route.requires_auth && (
                      <Badge className="mt-2 bg-blue-100 text-blue-800">Auth Required</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={route.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {route.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleRouteMutation.mutate({ id: route.id, is_enabled: route.is_enabled })}>
                      Toggle
                    </Button>
                  </div>
                </div>

                {(route.rate_limit || route.cache_ttl) && (
                  <div className="flex gap-4 mt-3">
                    {route.rate_limit && (
                      <div className="p-2 bg-orange-50 rounded text-sm">
                        Rate Limit: {route.rate_limit}/min
                      </div>
                    )}
                    {route.cache_ttl && (
                      <div className="p-2 bg-purple-50 rounded text-sm">
                        Cache: {route.cache_ttl}s
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}