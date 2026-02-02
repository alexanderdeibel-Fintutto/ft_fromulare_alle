import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Plus, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportBuilder() {
  const [user, setUser] = useState(null);
  const [newReport, setNewReport] = useState({
    report_name: '',
    report_type: 'usage',
    data_sources: [],
    format: 'json',
  });
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  const { data: reports } = useQuery({
    queryKey: ['reports', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.AdvancedReport.filter({
        user_email: user.email,
      }, '-created_date', 20);
    },
    enabled: !!user?.email,
  });

  const createReportMutation = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      await base44.functions.invoke('generateReport', {
        report_name: newReport.report_name,
        report_type: newReport.report_type,
        data_sources: newReport.data_sources,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setNewReport({ report_name: '', report_type: 'usage', data_sources: [], format: 'json' });
      setShowDialog(false);
      setGenerating(false);
      toast.success('Report created');
    },
    onError: () => {
      setGenerating(false);
      toast.error('Failed to create report');
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.AdvancedReport.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report deleted');
    },
    onError: () => toast.error('Failed to delete report'),
  });

  const handleExport = async (reportId, format) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      await base44.functions.invoke('exportReport', {
        report_id: reportId,
        format: format,
      });

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const reportTypes = ['usage', 'analytics', 'compliance', 'financial', 'custom'];
  const dataSources = ['documents', 'users', 'shares', 'api_calls', 'storage'];
  const formats = ['json', 'csv', 'pdf', 'xlsx'];

  const toggleDataSource = (source) => {
    setNewReport(prev => ({
      ...prev,
      data_sources: prev.data_sources.includes(source)
        ? prev.data_sources.filter(s => s !== source)
        : [...prev.data_sources, source]
    }));
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Report Builder</h1>
            <p className="text-gray-600 mt-2">Create and export advanced reports</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Report Name</label>
                  <Input
                    value={newReport.report_name}
                    onChange={(e) => setNewReport({...newReport, report_name: e.target.value})}
                    placeholder="e.g., Monthly Usage Report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <Select value={newReport.report_type} onValueChange={(value) => setNewReport({...newReport, report_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Data Sources</label>
                  <div className="grid grid-cols-2 gap-3">
                    {dataSources.map(source => (
                      <label key={source} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newReport.data_sources.includes(source)}
                          onChange={() => toggleDataSource(source)}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{source.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Export Format</label>
                  <Select value={newReport.format} onValueChange={(value) => setNewReport({...newReport, format: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map(fmt => (
                        <SelectItem key={fmt} value={fmt}>
                          {fmt.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => createReportMutation.mutate()}
                  disabled={!newReport.report_name.trim() || newReport.data_sources.length === 0 || generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Create Report'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {reports && reports.length > 0 ? (
            reports.map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{report.report_name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{report.report_type}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {report.data_sources?.map(source => (
                        <span key={source} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {formats.map(fmt => (
                      <Button
                        key={fmt}
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(report.id, fmt)}
                        className="gap-1"
                      >
                        <Download className="w-3 h-3" />
                        {fmt.toUpperCase()}
                      </Button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteReportMutation.mutate(report.id)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="lg:col-span-2">
              <CardContent className="pt-6 text-center text-gray-500">
                No reports created yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}