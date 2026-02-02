import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Loader, Lightbulb, Zap, BookOpen, TrendingUp } from 'lucide-react';

export default function AIWorkflowAssistant({ currentWorkflow, onStepsSuggested, onWorkflowOptimized }) {
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [explanation, setExplanation] = useState(null);

  const callAIAssistant = async (action, payload) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('aiWorkflowAssistant', {
        action,
        ...payload
      });
      return response.data.result;
    } catch (error) {
      console.error('AI Assistant error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestSteps = async () => {
    if (!goal.trim()) return;
    const result = await callAIAssistant('suggestSteps', { goal });
    if (result) {
      setSuggestions(result);
      onStepsSuggested?.(result.suggestions);
    }
  };

  const handleGenerateConfig = async () => {
    if (!serviceType.trim()) return;
    const result = await callAIAssistant('generateIntegrationConfig', { serviceType });
    if (result) {
      setSuggestions(result);
    }
  };

  const handleOptimizeWorkflow = async () => {
    if (!currentWorkflow) return;
    const result = await callAIAssistant('optimizeWorkflow', { currentWorkflow });
    if (result) {
      setOptimization(result);
      onWorkflowOptimized?.(result);
    }
  };

  const handleExplainWorkflow = async () => {
    if (!currentWorkflow) return;
    const result = await callAIAssistant('explainWorkflow', { currentWorkflow });
    if (result) {
      setExplanation(result);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          AI Workflow Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="suggest" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suggest">Suggest Steps</TabsTrigger>
            <TabsTrigger value="integrate">Integration</TabsTrigger>
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
            <TabsTrigger value="explain">Explain</TabsTrigger>
          </TabsList>

          {/* Suggest Steps Tab */}
          <TabsContent value="suggest" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">What do you want to achieve?</label>
              <Textarea
                placeholder="e.g., Send invoice to accounting system when payment is received"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="min-h-24"
              />
            </div>
            <Button
              onClick={handleSuggestSteps}
              disabled={loading || !goal.trim()}
              className="w-full"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Get AI Suggestions
            </Button>

            {suggestions && suggestions.suggestions && (
              <div className="space-y-3 mt-4">
                {suggestions.suggestions.map((step, idx) => (
                  <Card key={idx} className="bg-white">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{step.name}</h4>
                          <Badge variant="outline" className="mt-1">{step.type}</Badge>
                        </div>
                        <span className="text-sm text-gray-600">{step.estimatedTime}s</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{step.description}</p>
                      <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
                        💡 {step.rationale}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Integration Config Tab */}
          <TabsContent value="integrate" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Service Type</label>
              <Input
                placeholder="e.g., Google Drive, Asana, Jira"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerateConfig}
              disabled={loading || !serviceType.trim()}
              className="w-full"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate Config
            </Button>

            {suggestions && suggestions.requiredFields && (
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Required Fields</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.requiredFields.map((field, idx) => (
                      <Badge key={idx} variant="default">{field}</Badge>
                    ))}
                  </div>
                </div>
                {suggestions.optionalFields?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Optional Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.optionalFields.map((field, idx) => (
                        <Badge key={idx} variant="outline">{field}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.bestPractices && (
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">Best Practices</h4>
                    <ul className="space-y-1 text-sm">
                      {suggestions.bestPractices.map((practice, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span>✓</span> {practice}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Optimize Tab */}
          <TabsContent value="optimize" className="space-y-4">
            <Button
              onClick={handleOptimizeWorkflow}
              disabled={loading || !currentWorkflow}
              className="w-full"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Analyze Workflow
            </Button>

            {optimization && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-white">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-600">{optimization.estimatedCostSavings}%</div>
                      <div className="text-sm text-gray-600">Cost Savings</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-blue-600">{optimization.estimatedTimeImprovement}%</div>
                      <div className="text-sm text-gray-600">Time Improvement</div>
                    </CardContent>
                  </Card>
                </div>

                {optimization.inefficiencies?.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">Issues Found</h4>
                    <ul className="space-y-1 text-sm text-red-800">
                      {optimization.inefficiencies.map((issue, idx) => (
                        <li key={idx}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {optimization.optimizations?.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      {optimization.optimizations.map((opt, idx) => (
                        <li key={idx}>• {opt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Explain Tab */}
          <TabsContent value="explain" className="space-y-4">
            <Button
              onClick={handleExplainWorkflow}
              disabled={loading || !currentWorkflow}
              className="w-full"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
              Explain Workflow
            </Button>

            {explanation && (
              <div className="space-y-4 mt-4">
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-sm">{explanation.summary}</p>
                </div>

                {explanation.stepByStepExplanation?.length > 0 && (
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">Step-by-Step</h4>
                    <ol className="space-y-2 text-sm">
                      {explanation.stepByStepExplanation.map((step, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="font-semibold min-w-6">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {explanation.keyBenefits?.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Key Benefits</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      {explanation.keyBenefits.map((benefit, idx) => (
                        <li key={idx}>✓ {benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.potentialIssues?.length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">Watch Out For</h4>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      {explanation.potentialIssues.map((issue, idx) => (
                        <li key={idx}>⚠ {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}