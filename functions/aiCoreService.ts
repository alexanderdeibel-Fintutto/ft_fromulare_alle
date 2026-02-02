import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Claude Preise (Stand Januar 2026) - in USD pro 1M Tokens
const CLAUDE_PRICES = {
  "claude-sonnet-4-20250514": { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-haiku-3-5-20241022": { input: 0.80, output: 4.00, cacheWrite: 1.00, cacheRead: 0.08 },
  "claude-opus-4-20250514": { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
};

// EUR/USD Wechselkurs (vereinfacht)
const EUR_USD_RATE = 0.92;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      action,           // "chat" | "analyze" | "ocr" | "categorize"
      prompt,           // User-Prompt
      systemPrompt,     // System-Prompt (wird gecacht)
      context,          // Optionaler Kontext
      imageBase64,      // Optional: Bild für Vision
      imageMediaType,   // Optional: "image/jpeg", "image/png"
      model,            // Optional: Überschreibt default
      maxTokens,        // Optional: Überschreibt default
      userId,           // Für Usage-Tracking
      featureKey,       // Für Feature-Config
      conversationId,   // Optional: Für Chat-Historie
    } = await req.json();

    // 1. AISettings laden
    const settings = await getAISettings(base44);
    
    if (!settings.is_enabled) {
      return Response.json({ 
        success: false, 
        error: "AI-Features sind deaktiviert" 
      }, { status: 403 });
    }

    // 2. Budget prüfen
    const budgetCheck = await checkMonthlyBudget(base44, settings);
    if (!budgetCheck.allowed) {
      // Admin-Email senden wenn Budget überschritten
      if (budgetCheck.sendAdminNotification) {
        await sendBudgetWarningEmail(base44, settings, budgetCheck);
      }
      
      return Response.json({ 
        success: false, 
        error: "Monatliches AI-Budget erreicht",
        budget_used: budgetCheck.used,
        budget_limit: budgetCheck.limit
      }, { status: 429 });
    }

    // 3. Rate-Limit prüfen
    const rateLimitCheck = await checkRateLimit(base44, userId, settings, featureKey);
    if (!rateLimitCheck.allowed) {
      return Response.json({ 
        success: false, 
        error: `Rate-Limit erreicht. Nächste Anfrage in ${rateLimitCheck.retryAfter} Sekunden`,
        retry_after: rateLimitCheck.retryAfter
      }, { status: 429 });
    }

    // 4. Feature-Config laden (falls vorhanden)
    const featureConfig = await getFeatureConfig(base44, featureKey);
    
    // 4a. Check subscription level if feature requires it
    if (featureConfig?.requires_subscription) {
      const hasAccess = await checkUserSubscription(
        await base44.auth.me(),
        featureConfig.requires_subscription
      );
      
      if (!hasAccess) {
        return Response.json({
          success: false,
          error: `Dieses Feature erfordert mindestens ${featureConfig.requires_subscription}-Abo`,
          required_subscription: featureConfig.requires_subscription
        }, { status: 403 });
      }
    }
    
    // 4b. Load system prompt from database if referenced
    let finalSystemPrompt = systemPrompt;
    if (!finalSystemPrompt && featureConfig?.system_prompt_key) {
      const dbPrompt = await loadSystemPrompt(base44, featureConfig.system_prompt_key);
      if (dbPrompt) {
        finalSystemPrompt = dbPrompt;
      }
    }
    if (!finalSystemPrompt) {
      finalSystemPrompt = getDefaultSystemPrompt(action);
    }
    
    // 4c. Load conversation history for context caching
    const conversationHistory = await loadConversationHistory(base44, conversationId);
    
    // 5. Modell bestimmen (Priorität: Parameter > FeatureConfig > Settings)
    const selectedModel = model || featureConfig?.preferred_model || settings.default_model;
    const selectedMaxTokens = maxTokens || featureConfig?.max_tokens || 1024;

    // 6. Claude API aufrufen MIT PROMPT CACHING (oder Fallback zu OpenAI)
    const startTime = Date.now();
    let response;
    let usedProvider = 'anthropic';
    
    try {
      response = await callClaudeWithCaching({
        systemPrompt: finalSystemPrompt,
        userPrompt: prompt,
        context,
        conversationHistory,
        imageBase64,
        imageMediaType,
        model: selectedModel,
        maxTokens: selectedMaxTokens,
        enableCaching: settings.enable_prompt_caching,
      });
    } catch (claudeError) {
      console.error('Claude API failed:', claudeError);
      
      // Fallback to OpenAI if configured
      if (settings.fallback_provider === 'openai') {
        console.log('Falling back to OpenAI...');
        usedProvider = 'openai';
        
        response = await callOpenAIFallback({
          systemPrompt: finalSystemPrompt,
          userPrompt: prompt,
          context,
          conversationHistory,
          maxTokens: selectedMaxTokens
        });
      } else {
        throw claudeError;
      }
    }
    
    const responseTime = Date.now() - startTime;

    // 7. Kosten berechnen
    const costs = calculateCosts(response.usage, selectedModel);

    // 8. Usage loggen
    await logUsage(base44, {
      userId,
      feature: featureKey || action,
      model: selectedModel,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationTokens: response.usage.cache_creation_input_tokens || 0,
      cacheReadTokens: response.usage.cache_read_input_tokens || 0,
      costEur: costs.totalEur,
      costWithoutCacheEur: costs.withoutCacheEur,
      responseTimeMs: responseTime,
      success: true,
      contextType: action,
      metadata: { conversationId, provider: usedProvider }
    });
    
    // 8a. Save conversation history
    if (conversationId) {
      await saveConversation(
        base44,
        conversationId,
        userId,
        featureKey || action,
        prompt,
        response.content[0]?.text || "",
        featureConfig?.system_prompt_key
      );
    }

    // 9. Erfolgreiche Antwort
    return Response.json({
      success: true,
      content: response.content[0]?.text || "",
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_read_tokens: response.usage.cache_read_input_tokens || 0,
        cache_creation_tokens: response.usage.cache_creation_input_tokens || 0,
        cost_eur: costs.totalEur,
        savings_eur: costs.savingsEur,
        savings_percent: costs.savingsPercent,
      },
      model: selectedModel,
      response_time_ms: responseTime,
      budget_remaining: budgetCheck.remaining - costs.totalEur,
      rate_limit_remaining: rateLimitCheck.remaining - 1,
    });

  } catch (error) {
    console.error("AI Service Error:", error);
    
    const base44 = createClientFromRequest(req);
    
    // Error loggen
    await logUsage(base44, {
      userId: "unknown",
      feature: "error",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      costEur: 0,
      success: false,
      errorMessage: error.message,
    });

    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});


// ============================================================================
// CLAUDE API MIT PROMPT CACHING
// ============================================================================

async function callClaudeWithCaching({ 
  systemPrompt, 
  userPrompt, 
  context,
  conversationHistory,
  imageBase64, 
  imageMediaType,
  model, 
  maxTokens,
  enableCaching 
}) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
  }

  // System-Content mit Cache-Control (wenn aktiviert)
  const systemContent = enableCaching ? [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" }  // 5-Minuten Cache
    }
  ] : systemPrompt;

  // Messages aufbauen
  const messages = [];
  
  // Optional: Conversation History (for context)
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
  }
  
  // Optional: Kontext als erste Message
  if (context) {
    messages.push({
      role: "user",
      content: `Kontext: ${context}`
    });
    messages.push({
      role: "assistant", 
      content: "Verstanden, ich berücksichtige diesen Kontext."
    });
  }

  // User-Prompt (mit optionalem Bild)
  const userContent = [];
  
  if (imageBase64 && imageMediaType) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageMediaType,
        data: imageBase64,
      }
    });
  }
  
  userContent.push({
    type: "text",
    text: userPrompt
  });

  messages.push({
    role: "user",
    content: userContent.length === 1 ? userContent[0].text : userContent
  });

  // API-Call
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  // Cache-Beta-Header wenn aktiviert
  if (enableCaching) {
    headers["anthropic-beta"] = "prompt-caching-2024-07-31";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemContent,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Claude API Fehler: ${response.status}`);
  }

  return response.json();
}


// ============================================================================
// KOSTEN-BERECHNUNG
// ============================================================================

function calculateCosts(usage, model) {
  const prices = CLAUDE_PRICES[model] || CLAUDE_PRICES["claude-sonnet-4-20250514"];
  
  // Normale Token-Kosten (USD)
  const inputCostUsd = (usage.input_tokens / 1_000_000) * prices.input;
  const outputCostUsd = (usage.output_tokens / 1_000_000) * prices.output;
  
  // Cache-Kosten (USD)
  const cacheWriteCostUsd = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * prices.cacheWrite;
  const cacheReadCostUsd = ((usage.cache_read_input_tokens || 0) / 1_000_000) * prices.cacheRead;
  
  // Total mit Cache
  const totalUsd = inputCostUsd + outputCostUsd + cacheWriteCostUsd + cacheReadCostUsd;
  
  // Was hätte es OHNE Cache gekostet?
  const tokensWithoutCache = usage.input_tokens + (usage.cache_read_input_tokens || 0);
  const withoutCacheUsd = (tokensWithoutCache / 1_000_000) * prices.input + outputCostUsd;
  
  // Ersparnis
  const savingsUsd = Math.max(0, withoutCacheUsd - totalUsd);
  const savingsPercent = withoutCacheUsd > 0 ? Math.round((savingsUsd / withoutCacheUsd) * 100) : 0;

  return {
    totalEur: Math.round(totalUsd * EUR_USD_RATE * 10000) / 10000,
    withoutCacheEur: Math.round(withoutCacheUsd * EUR_USD_RATE * 10000) / 10000,
    savingsEur: Math.round(savingsUsd * EUR_USD_RATE * 10000) / 10000,
    savingsPercent,
  };
}


// ============================================================================
// HILFSFUNKTIONEN
// ============================================================================

async function getAISettings(base44) {
  try {
    const data = await base44.asServiceRole.entities.AISettings.list();
    return data?.[0] || {
      is_enabled: true,
      default_model: "claude-sonnet-4-20250514",
      monthly_budget_eur: 50,
      enable_prompt_caching: true,
      rate_limit_per_user_hour: 20,
      rate_limit_per_user_day: 100,
    };
  } catch {
    // Falls Entity nicht existiert: Defaults
    return {
      is_enabled: true,
      default_model: "claude-sonnet-4-20250514",
      monthly_budget_eur: 50,
      enable_prompt_caching: true,
      rate_limit_per_user_hour: 20,
      rate_limit_per_user_day: 100,
    };
  }
}

async function getFeatureConfig(base44, featureKey) {
  if (!featureKey) return null;
  try {
    const data = await base44.asServiceRole.entities.AIFeatureConfig.list();
    const config = data?.find(f => f.feature_key === featureKey) || null;
    
    // Auto-reactivate feature if budget was reset (month changed)
    if (config && !config.is_enabled) {
      const lastMonth = config.updated_date 
        ? new Date(config.updated_date).toISOString().substring(0, 7)
        : null;
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      if (lastMonth && lastMonth !== currentMonth) {
        await base44.asServiceRole.entities.AIFeatureConfig.update(config.id, {
          is_enabled: true
        });
        config.is_enabled = true;
      }
    }
    
    return config;
  } catch {
    return null;
  }
}

async function checkUserSubscription(user, requiredTier) {
  if (!requiredTier || requiredTier === 'free') return true;
  
  // Check user subscription level
  const userTier = user.subscription_tier || 'free';
  
  const tierHierarchy = {
    'free': 0,
    'starter': 1,
    'pro': 2,
    'business': 3
  };
  
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

async function loadSystemPrompt(base44, promptKey) {
  if (!promptKey) return null;
  
  try {
    const prompts = await base44.asServiceRole.entities.AISystemPrompt.list();
    const prompt = prompts?.find(p => p.prompt_key === promptKey && p.is_active);
    
    if (prompt) {
      // Update usage count
      await base44.asServiceRole.entities.AISystemPrompt.update(prompt.id, {
        usage_count: (prompt.usage_count || 0) + 1
      });
    }
    
    return prompt?.prompt_text || null;
  } catch {
    return null;
  }
}

async function saveConversation(base44, conversationId, userId, feature, message, response, systemPromptKey) {
  try {
    const conversations = await base44.asServiceRole.entities.AIConversation.filter({
      conversation_id: conversationId
    });
    
    const newMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    const assistantMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    };
    
    if (conversations && conversations.length > 0) {
      const conv = conversations[0];
      const messages = [...(conv.messages || []), newMessage, assistantMessage];
      
      await base44.asServiceRole.entities.AIConversation.update(conv.id, {
        messages,
        last_message_at: new Date().toISOString()
      });
    } else {
      await base44.asServiceRole.entities.AIConversation.create({
        conversation_id: conversationId,
        user_email: userId,
        feature,
        title: message.substring(0, 50),
        messages: [newMessage, assistantMessage],
        system_prompt_key: systemPromptKey,
        last_message_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

async function loadConversationHistory(base44, conversationId) {
  if (!conversationId) return null;
  
  try {
    const conversations = await base44.asServiceRole.entities.AIConversation.filter({
      conversation_id: conversationId
    });
    
    if (conversations && conversations.length > 0) {
      return conversations[0].messages || [];
    }
  } catch {
    return null;
  }
  
  return null;
}

async function checkMonthlyBudget(base44, settings) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
      created_date: { $gte: startOfMonth.toISOString() }
    });
    
    const used = logs?.reduce((sum, log) => sum + (log.cost_eur || 0), 0) || 0;
    const limit = settings.monthly_budget_eur || 50;
    const percent = Math.round((used / limit) * 100);
    const threshold = settings.budget_warning_threshold || 80;
    
    // Prüfe ob Admin-Benachrichtigung nötig
    const sendAdminNotification = percent >= threshold && percent < 100;
    
    return {
      allowed: used < limit,
      used: Math.round(used * 100) / 100,
      limit,
      remaining: Math.round((limit - used) * 100) / 100,
      percent,
      sendAdminNotification: sendAdminNotification && !await hasRecentWarning(base44),
    };
  } catch {
    return { allowed: true, used: 0, limit: 50, remaining: 50, percent: 0, sendAdminNotification: false };
  }
}

async function checkRateLimit(base44, userId, settings, featureKey) {
  if (!userId) return { allowed: true, remaining: 999 };
  
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({ 
      user_email: userId,
      created_date: { $gte: oneHourAgo.toISOString() }
    });
    
    const count = logs?.length || 0;
    const limit = settings.rate_limit_per_user_hour || 20;
    
    if (count >= limit) {
      // Berechne wann ältester Request "abläuft"
      const oldestLog = logs?.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))[0];
      const retryAfter = oldestLog 
        ? Math.ceil((new Date(oldestLog.created_date).getTime() + 3600000 - now.getTime()) / 1000)
        : 60;
      
      return { allowed: false, remaining: 0, retryAfter };
    }
    
    return { allowed: true, remaining: limit - count };
  } catch {
    return { allowed: true, remaining: 999 };
  }
}

async function logUsage(base44, data) {
  try {
    await base44.asServiceRole.entities.AIUsageLog.create({
      user_email: data.userId || "anonymous",
      feature: data.feature || "unknown",
      model: data.model || "unknown",
      input_tokens: data.inputTokens || 0,
      output_tokens: data.outputTokens || 0,
      cache_creation_tokens: data.cacheCreationTokens || 0,
      cache_read_tokens: data.cacheReadTokens || 0,
      cost_eur: data.costEur || 0,
      cost_without_cache_eur: data.costWithoutCacheEur || 0,
      response_time_ms: data.responseTimeMs || 0,
      success: data.success !== false,
      error_message: data.errorMessage || null,
      context_type: data.contextType || null,
      request_metadata: data.metadata || null,
    });
  } catch (e) {
    console.error("Failed to log usage:", e);
  }
}

async function hasRecentWarning(base44) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
      error_message: { $regex: /budget.*warning/i },
      created_date: { $gte: oneHourAgo.toISOString() }
    });
    return logs && logs.length > 0;
  } catch {
    return false;
  }
}

async function sendBudgetWarningEmail(base44, settings, budgetCheck) {
  try {
    // Hole alle Admin-User
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users?.filter(u => u.role === 'admin') || [];
    
    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `⚠️ KI-Budget Warnung: ${budgetCheck.percent}% erreicht`,
        body: `Hallo ${admin.full_name || 'Admin'},

das monatliche KI-Budget wurde zu ${budgetCheck.percent}% verbraucht.

Budget-Details:
- Verbraucht: €${budgetCheck.used.toFixed(2)}
- Limit: €${budgetCheck.limit.toFixed(2)}
- Verbleibend: €${budgetCheck.remaining.toFixed(2)}

${budgetCheck.percent >= 100 
  ? '🔴 Das Budget ist aufgebraucht. AI-Features wurden pausiert.' 
  : '🟡 Bitte prüfen Sie die Einstellungen unter /AISettings'}

Beste Grüße,
Ihr FinTutto System`,
        from_name: 'FinTutto AI System'
      });
    }
    
    // Log warning
    await base44.asServiceRole.entities.AIUsageLog.create({
      user_email: 'system',
      feature: 'budget_warning',
      model: 'n/a',
      input_tokens: 0,
      output_tokens: 0,
      cost_eur: 0,
      success: true,
      error_message: `Budget warning sent: ${budgetCheck.percent}%`,
    });
  } catch (error) {
    console.error('Failed to send budget warning email:', error);
  }
}

async function callOpenAIFallback({ systemPrompt, userPrompt, context, conversationHistory, maxTokens }) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured for fallback");
  }

  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });
  }
  
  if (context) {
    messages.push({ role: "user", content: `Kontext: ${context}` });
  }
  
  messages.push({ role: "user", content: userPrompt });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI API Fehler: ${response.status}`);
  }

  const data = await response.json();
  
  // Convert to Claude-compatible format
  return {
    content: [{ text: data.choices[0].message.content }],
    usage: {
      input_tokens: data.usage.prompt_tokens,
      output_tokens: data.usage.completion_tokens,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0
    }
  };
}

function getDefaultSystemPrompt(action) {
  const prompts = {
    chat: `Du bist ein hilfreicher Assistent für deutsche Immobilienverwaltung. 
Antworte auf Deutsch, präzise und praxisorientiert.
Beachte deutsches Mietrecht (BGB §§ 535ff), Steuerrecht und BetrKV.`,
    
    ocr: `Du bist ein Experte für Dokumentenerkennung.
Extrahiere alle relevanten Daten aus dem Dokument.
Antworte als strukturiertes JSON.`,
    
    analysis: `Du bist ein Analyst für Immobilieninvestitionen.
Analysiere die Daten und gib fundierte Einschätzungen.
Berücksichtige den deutschen Markt und Steueraspekte.`,
    
    categorize: `Du kategorisierst Buchungen nach SKR03/SKR04.
Gib die passende Kategorie und Kontonummer zurück.
Antworte als JSON: { "category": "...", "account": "..." }`,
  };
  
  return prompts[action] || prompts.chat;
}