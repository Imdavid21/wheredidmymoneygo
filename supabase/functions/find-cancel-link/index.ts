import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionName } = await req.json();

    if (!subscriptionName) {
      return new Response(
        JSON.stringify({ error: 'Subscription name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a helpful assistant that finds subscription cancellation links.

For the subscription service "${subscriptionName}", provide the direct URL where users can cancel or manage their subscription.

Rules:
1. Only provide official, legitimate URLs from the actual service
2. Prefer direct cancellation pages over general account pages
3. If it's a physical service (gym, etc), say "Contact provider directly"
4. If you're not sure about the exact URL, provide the account/settings page URL
5. Be concise - just the URL or brief instruction

Respond in this JSON format:
{
  "url": "the cancellation URL or null if unknown",
  "instruction": "brief instruction like 'Go to Account > Subscription' or null",
  "confidence": "high" | "medium" | "low"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ url: null, instruction: 'Search online for cancellation instructions', confidence: 'low' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ url: null, instruction: 'Search online for cancellation instructions', confidence: 'low' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { url: null, instruction: content.trim(), confidence: 'low' };
      }
    } catch {
      result = { url: null, instruction: content.trim(), confidence: 'low' };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ url: null, instruction: 'Unable to find cancellation link', confidence: 'low' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
