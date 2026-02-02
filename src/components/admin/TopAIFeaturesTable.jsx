import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function TopAIFeaturesTable() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const logs = await base44.entities.AIUsageLog.list('-created_date', 10000);
      
      const featureStats = {};
      logs.forEach(log => {
        const feature = log.feature || 'unknown';
        if (!featureStats[feature]) {
          featureStats[feature] = { feature, totalCost: 0, totalRequests: 0 };
        }
        featureStats[feature].totalCost += log.cost_eur || 0;
        featureStats[feature].totalRequests += 1;
      });

      const sorted = Object.values(featureStats)
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 5);

      setFeatures(sorted);
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 AI-Features nach Kosten</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="text-right">Anfragen</TableHead>
                <TableHead className="text-right">Kosten</TableHead>
                <TableHead className="text-right">Ø Pro Anfrage</TableHead>
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
                  <TableCell className="text-right">
                    €{(f.totalCost / f.totalRequests).toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}