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

const prompt = `You are an expert at identifying subscriptions and finding cancellation links.

Analyze this transaction descriptor: "${subscriptionName}"

First, determine if this is a SUBSCRIPTION (recurring digital/service payment) or NOT a subscription.

SUBSCRIPTIONS include: streaming services (Netflix, Spotify, Disney+), software (Adobe, Microsoft 365), cloud services (AWS, Google Cloud), food delivery memberships (DoorDash, Zomato Pro), gym memberships, news/magazine subscriptions, gaming subscriptions (Xbox Game Pass, PlayStation Plus), VPN services, productivity tools, etc.

NOT SUBSCRIPTIONS: rent payments, loan EMIs, utility bills (electricity, water, gas), one-time purchases, grocery shopping, restaurant bills, fuel/gas, ATM withdrawals, bank transfers, insurance premiums, credit card bills, tax payments, medical bills, education fees.

Respond in this JSON format:
{
  "isSubscription": true or false,
  "serviceName": "Clean name of the service if subscription, or null",
  "url": "the cancellation URL or null if not a subscription/unknown",
  "instruction": "brief instruction like 'Go to Account > Subscription' or why it's not a subscription",
  "confidence": "high" | "medium" | "low"
}

If it IS a subscription:
- Provide the official cancellation/account URL
- Prefer direct cancellation pages over general pages
- For physical services (gyms), say "Contact provider directly"

If it is NOT a subscription:
- Set isSubscription to false
- Explain briefly what type of expense it is`;

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
