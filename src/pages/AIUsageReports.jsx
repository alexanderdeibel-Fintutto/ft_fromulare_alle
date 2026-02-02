import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function AIUsageReports() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  async function loadReports() {
    setLoading(true);
    try {
      const logs = await base44.entities.AIUsageLog.filter(
        { 
          created_date: { 
            $gte: startDate,
            $lte: endDate
          }
        },
        '-created_date',
        10000
      );

      const featureData = {};
      logs.forEach(log => {
        const feature = log.feature || 'unknown';
        if (!featureData[feature]) {
          featureData[feature] = {
            feature,
            totalRequests: 0,
            totalCost: 0,
            totalTokens: 0,
            avgResponseTime: 0,
            successRate: 0,
            successCount: 0
          };
        }
        featureData[feature].totalRequests++;
        featureData[feature].totalCost += log.cost_eur || 0;
        featureData[feature].totalTokens += (log.input_tokens || 0) + (log.output_tokens || 0);
        featureData[feature].avgResponseTime += log.response_time_ms || 0;
        if (log.success) featureData[feature].successCount++;
      });

      const processed = Object.values(featureData).map(f => ({
        ...f,
        avgCostPerRequest: (f.totalCost / f.totalRequests).toFixed(4),
        avgResponseTime: Math.round(f.avgResponseTime / f.totalRequests),
        successRate: Math.round((f.successCount / f.totalRequests) * 100)
      }));

      setFeatures(processed.sort((a, b) => b.totalCost - a.totalCost));
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV() {
    const headers = ['Feature', 'Anfragen', 'Gesamtkosten', 'Ø Kosten/Anfrage', 'Erfolgsrate', 'Ø Antwortzeit'];
    const rows = features.map(f => [
      f.feature,
      f.totalRequests,
      f.totalCost.toFixed(2),
      f.avgCostPerRequest,
      f.successRate + '%',
      f.avgResponseTime + 'ms'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI-Nutzungsberichte</h1>
        <p className="text-muted-foreground">Detaillierte Analysen pro AI-Feature</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-sm font-medium mb-2 block">Von:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Bis:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={exportCSV} disabled={loading} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSV Exportieren
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature-Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead className="text-right">Anfragen</TableHead>
                    <TableHead className="text-right">Kosten</TableHead>
                    <TableHead className="text-right">Ø/Anfrage</TableHead>
                    <TableHead className="text-right">Erfolgsrate</TableHead>
                    <TableHead className="text-right">Ø Antwortzeit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((f) => (
                    <TableRow key={f.feature}>
                      <TableCell className="font-medium">{f.feature}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{f.totalRequests}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{f.totalCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">€{f.avgCostPerRequest}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={f.successRate >= 95 ? 'default' : 'secondary'}>
                          {f.successRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{f.avgResponseTime}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}