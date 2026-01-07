import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache exchange rates for 1 hour
let ratesCache: { rates: Record<string, number>; base: string; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchExchangeRates(): Promise<{ rates: Record<string, number>; base: string }> {
  // Check cache
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_TTL) {
    return { rates: ratesCache.rates, base: ratesCache.base };
  }

  // Use exchangerate-api (free tier, no API key needed)
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rates');
  }
  
  const data = await response.json();
  
  ratesCache = {
    rates: data.rates,
    base: data.base,
    timestamp: Date.now()
  };
  
  return { rates: data.rates, base: data.base };
}

function convertAmount(amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first (base), then to target
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amounts, fromCurrencies, toCurrency } = await req.json();
    
    if (!amounts || !fromCurrencies || !toCurrency) {
      throw new Error('Missing required parameters');
    }
    
    const { rates, base } = await fetchExchangeRates();
    
    // Convert each amount
    const convertedAmounts: number[] = [];
    for (let i = 0; i < amounts.length; i++) {
      const converted = convertAmount(amounts[i], fromCurrencies[i], toCurrency, rates);
      convertedAmounts.push(converted);
    }
    
    return new Response(JSON.stringify({ 
      convertedAmounts,
      rates,
      base,
      targetCurrency: toCurrency
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in convert-currency:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Conversion failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
