import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, goal, currentWorkflow, serviceType } = await req.json();

    if (!action) {
      return Response.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    let prompt = '';
    let responseSchema = null;

    if (action === 'suggestSteps') {
      prompt = `Based on the user's goal: "${goal}", suggest optimal workflow steps to achieve this.
      
      Provide suggestions as a JSON array with each step containing:
      - name: descriptive step name
      - type: one of (task, notification, email, condition, delay, integration)
      - description: what this step does
      - rationale: why this step is important
      - estimatedTime: estimated execution time in seconds
      
      Consider efficiency, best practices, and logical flow. Return up to 5 suggestions.`;

      responseSchema = {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                description: { type: 'string' },
                rationale: { type: 'string' },
                estimatedTime: { type: 'integer' }
              }
            }
          }
        }
      };
    } else if (action === 'generateIntegrationConfig') {
      prompt = `Generate an optimal integration configuration for ${serviceType}.
      
      Provide a JSON object containing:
      - name: integration name
      - requiredFields: array of required configuration fields
      - optionalFields: array of optional fields
      - defaultSettings: recommended default settings
      - bestPractices: array of setup best practices
      
      Format it for secure, efficient integration.`;

      responseSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          requiredFields: { type: 'array', items: { type: 'string' } },
          optionalFields: { type: 'array', items: { type: 'string' } },
          defaultSettings: { type: 'object' },
          bestPractices: { type: 'array', items: { type: 'string' } }
        }
      };
    } else if (action === 'optimizeWorkflow') {
      prompt = `Analyze and optimize this workflow for efficiency and cost:
      ${JSON.stringify(currentWorkflow, null, 2)}
      
      Provide optimization suggestions as a JSON object with:
      - inefficiencies: array of identified issues
      - optimizations: array of improvements
      - estimatedCostSavings: percentage savings estimate
      - estimatedTimeImprovement: percentage time improvement
      - priority: array of changes by priority (high/medium/low)
      
      Focus on reducing API calls, combining steps, and removing redundancies.`;

      responseSchema = {
        type: 'object',
        properties: {
          inefficiencies: { type: 'array', items: { type: 'string' } },
          optimizations: { type: 'array', items: { type: 'string' } },
          estimatedCostSavings: { type: 'number' },
          estimatedTimeImprovement: { type: 'number' },
          priority: { type: 'array', items: { type: 'string' } }
        }
      };
    } else if (action === 'explainWorkflow') {
      prompt = `Provide a clear, natural language explanation of this workflow:
      ${JSON.stringify(currentWorkflow, null, 2)}
      
      Return a JSON object with:
      - summary: brief 1-2 sentence overview
      - stepByStepExplanation: array of explanations for each step
      - keyBenefits: array of key benefits
      - potentialIssues: array of potential issues to watch for
      - recommendations: array of recommendations
      
      Make it understandable for non-technical users.`;

      responseSchema = {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          stepByStepExplanation: { type: 'array', items: { type: 'string' } },
          keyBenefits: { type: 'array', items: { type: 'string' } },
          potentialIssues: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      };
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: responseSchema
    });

    return Response.json({
      success: true,
      action,
      result
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});