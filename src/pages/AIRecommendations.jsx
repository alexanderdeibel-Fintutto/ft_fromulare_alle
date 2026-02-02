import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ThumbsUp, X } from 'lucide-react';

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const recs = await base44.entities.AIRecommendation.filter({
        user_email: currentUser.email,
        dismissed: false
      }, '-confidence_score', 50);
      setRecommendations(recs || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const dismissRecommendation = async (recId) => {
    try {
      await base44.entities.AIRecommendation.update(recId, { dismissed: true });
      setRecommendations(prev => prev.filter(r => r.id !== recId));
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const acceptRecommendation = async (rec) => {
    try {
      await base44.entities.AIRecommendation.update(rec.id, { dismissed: true });
      setRecommendations(prev => prev.filter(r => r.id !== rec.id));
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Recommendations</h1>
          <p className="text-gray-600">Personalized suggestions based on your usage patterns</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading recommendations...</p>
            </div>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <Card key={rec.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <span>{rec.item_title}</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {rec.recommendation_type}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{rec.reason}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${rec.confidence_score * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{Math.round(rec.confidence_score * 100)}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dismissRecommendation(rec.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptRecommendation(rec)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" /> Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No new recommendations available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}