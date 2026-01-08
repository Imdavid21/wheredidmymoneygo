import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate URL by checking if it's reachable
async function validateUrl(url: string): Promise<boolean> {
  if (!url || !url.startsWith('http')) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLValidator/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 405 || response.status === 403;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`URL validation failed for ${url}:`, errorMessage);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionName } = await req.json();
    console.log(`Processing subscription: ${subscriptionName}`);

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

SUBSCRIPTIONS include: streaming services (Netflix, Spotify, Disney+, YouTube Premium, Amazon Prime), software (Adobe, Microsoft 365), cloud services (AWS, Google Cloud), food delivery memberships (DoorDash, Zomato Pro), gym memberships, news/magazine subscriptions, gaming subscriptions (Xbox Game Pass, PlayStation Plus), VPN services, productivity tools, etc.

NOT SUBSCRIPTIONS: rent payments, loan EMIs, utility bills (electricity, water, gas), one-time purchases, grocery shopping, restaurant bills, fuel/gas, ATM withdrawals, bank transfers, insurance premiums, credit card bills, tax payments, medical bills, education fees.

Respond in this JSON format:
{
  "isSubscription": true or false,
  "serviceName": "Clean name of the service if subscription, or null",
  "url": "the official cancellation/account settings URL or null",
  "instruction": "brief instruction like 'Go to Account > Subscription' or why it's not a subscription",
  "confidence": "high" | "medium" | "low"
}

IMPORTANT for URLs:
- Use ONLY well-known, official URLs that are guaranteed to work
- For Netflix: https://www.netflix.com/cancelplan
- For Spotify: https://www.spotify.com/account/subscription/
- For Amazon Prime: https://www.amazon.com/gp/primecentral
- For YouTube Premium: https://www.youtube.com/paid_memberships
- For Disney+: https://www.disneyplus.com/account/subscription
- For Apple: https://support.apple.com/en-us/HT202039
- For other services, use their official account/subscription page
- If unsure of exact URL, set url to null and provide instruction instead`;

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
        JSON.stringify({ isSubscription: true, serviceName: null, url: null, instruction: 'Search online for cancellation instructions', confidence: 'low' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log('AI response:', content);

    if (!content) {
      return new Response(
        JSON.stringify({ isSubscription: true, serviceName: null, url: null, instruction: 'Search online for cancellation instructions', confidence: 'low' }),
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
        result = { isSubscription: true, serviceName: null, url: null, instruction: content.trim(), confidence: 'low' };
      }
    } catch {
      result = { isSubscription: true, serviceName: null, url: null, instruction: content.trim(), confidence: 'low' };
    }

    // Validate the URL if provided
    if (result.url) {
      console.log(`Validating URL: ${result.url}`);
      const isValid = await validateUrl(result.url);
      console.log(`URL validation result: ${isValid}`);
      
      if (!isValid) {
        // Try common fallback patterns
        const serviceName = result.serviceName?.toLowerCase() || '';
        let fallbackUrl = null;
        
        if (serviceName.includes('netflix')) fallbackUrl = 'https://www.netflix.com/cancelplan';
        else if (serviceName.includes('spotify')) fallbackUrl = 'https://www.spotify.com/account/subscription/';
        else if (serviceName.includes('amazon') || serviceName.includes('prime')) fallbackUrl = 'https://www.amazon.com/gp/primecentral';
        else if (serviceName.includes('youtube')) fallbackUrl = 'https://www.youtube.com/paid_memberships';
        else if (serviceName.includes('disney')) fallbackUrl = 'https://www.disneyplus.com/account';
        
        if (fallbackUrl) {
          const fallbackValid = await validateUrl(fallbackUrl);
          result.url = fallbackValid ? fallbackUrl : null;
          result.urlVerified = fallbackValid;
        } else {
          result.url = null;
          result.urlVerified = false;
        }
      } else {
        result.urlVerified = true;
      }
    }

    console.log('Final result:', JSON.stringify(result));
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ isSubscription: true, serviceName: null, url: null, instruction: 'Unable to find cancellation link', confidence: 'low' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
