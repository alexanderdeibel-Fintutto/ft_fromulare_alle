import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Load settings
    const settings = await base44.asServiceRole.entities.AISettings.list();
    const aiSettings = settings?.[0];

    if (!aiSettings) {
      return Response.json({ 
        success: false, 
        error: 'No AI settings found' 
      }, { status: 404 });
    }

    let status = 'unknown';
    let errorMessage = null;

    try {
      // Test Anthropic API
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      
      if (!apiKey) {
        status = 'error';
        errorMessage = 'ANTHROPIC_API_KEY not configured';
      } else {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-3-5-20241022",
            max_tokens: 10,
            messages: [{ role: "user", content: "test" }]
          }),
        });

        if (response.ok) {
          status = 'active';
        } else if (response.status === 429) {
          status = 'rate_limited';
          errorMessage = 'API rate limit reached';
        } else {
          status = 'error';
          const error = await response.json();
          errorMessage = error.error?.message || `HTTP ${response.status}`;
        }
      }
    } catch (error) {
      status = 'error';
      errorMessage = error.message;
    }

    // Update settings
    await base44.asServiceRole.entities.AISettings.update(aiSettings.id, {
      api_status: status,
      last_api_check: new Date().toISOString()
    });

    return Response.json({
      success: status === 'active',
      status,
      error: errorMessage,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});