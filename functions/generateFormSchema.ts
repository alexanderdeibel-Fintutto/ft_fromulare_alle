import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await req.json();

    if (!description) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    // Use aiCoreService to generate form schema
    const aiResponse = await base44.functions.invoke('aiCoreService', {
      action: 'chat',
      prompt: `Based on this description, generate a JSON schema for a form: ${description}`,
      systemPrompt: `You are an expert form designer. Generate valid JSON schemas with these requirements:
1. Include "name", "type", "properties", and "required" fields
2. For each property, include type, title, and description
3. Support these types: string, number, boolean, array
4. For string fields that should be selections, include an "enum" array
5. Make the schema production-ready

Return a valid JSON schema object.`,
      userId: user.email,
      featureKey: 'form_generation',
      maxTokens: 2048
    });

    if (!aiResponse.success) {
      return Response.json({ error: aiResponse.error || 'Form generation failed' }, { status: 500 });
    }

    // Parse JSON from AI response
    let schema;
    try {
      const jsonMatch = aiResponse.content.match(/```json\n([\s\S]*?)\n```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : aiResponse.content;
      schema = JSON.parse(jsonContent);
    } catch {
      // If parsing fails, try to extract JSON directly
      schema = JSON.parse(aiResponse.content);
    }

    const response = schema;

    return Response.json({
      success: true,
      schema: response,
    });
  } catch (error) {
    console.error('Error generating form schema:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});