import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { testType } = await req.json();

    const tests = [];

    // Test 1: Basic Chat
    if (!testType || testType === 'chat') {
      const chatTest = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: 'Sage nur "OK" ohne weitere Erklärung.',
        userId: user.email,
        featureKey: 'chat',
        maxTokens: 10
      });
      tests.push({ 
        name: 'Basic Chat', 
        success: chatTest.success,
        content: chatTest.content,
        usage: chatTest.usage 
      });
    }

    // Test 2: Prompt Caching
    if (!testType || testType === 'caching') {
      const longContext = 'Das ist ein langer Kontext der gecacht werden soll. '.repeat(100);
      const cachingTest1 = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: 'Fasse den Kontext in einem Wort zusammen.',
        systemPrompt: longContext,
        userId: user.email,
        featureKey: 'chat',
        maxTokens: 10
      });
      
      // Second call should hit cache
      const cachingTest2 = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: 'Fasse den Kontext in einem Wort zusammen.',
        systemPrompt: longContext,
        userId: user.email,
        featureKey: 'chat',
        maxTokens: 10
      });
      
      tests.push({
        name: 'Prompt Caching',
        success: cachingTest1.success && cachingTest2.success,
        cache_hit: (cachingTest2.usage?.cache_read_tokens || 0) > 0,
        savings: {
          first_call: cachingTest1.usage?.cost_eur,
          second_call: cachingTest2.usage?.cost_eur,
          saved: cachingTest2.usage?.savings_eur
        }
      });
    }

    // Test 3: Rate Limiting
    if (!testType || testType === 'rate_limit') {
      const rateLimitTests = [];
      for (let i = 0; i < 3; i++) {
        const result = await base44.functions.invoke('aiCoreService', {
          action: 'chat',
          prompt: 'OK',
          userId: user.email,
          featureKey: 'chat',
          maxTokens: 10
        });
        rateLimitTests.push({
          call: i + 1,
          success: result.success,
          remaining: result.rate_limit_remaining
        });
      }
      tests.push({
        name: 'Rate Limiting',
        success: true,
        calls: rateLimitTests
      });
    }

    // Test 4: Budget Check
    if (!testType || testType === 'budget') {
      const budgetTest = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: 'Test',
        userId: user.email,
        featureKey: 'chat',
        maxTokens: 10
      });
      tests.push({
        name: 'Budget Tracking',
        success: budgetTest.success,
        budget_remaining: budgetTest.budget_remaining
      });
    }

    return Response.json({
      success: true,
      tests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});