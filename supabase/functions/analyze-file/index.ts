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
    const { rawContent, fileType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

const systemPrompt = `You are a financial data extraction expert. Analyze the provided bank statement or financial document.

EXTRACT:
1. Statement type: "credit_card", "bank", or "other"
2. Balance information:
   - For credit cards: creditLimit, creditUsed, availableCredit
   - For bank/other: openingBalance, closingBalance
3. Currency code (USD, EUR, GBP, INR, JPY, CAD, AUD, ZAR, etc.)
4. Create custom expense categories based on the actual spending patterns
5. ALL transactions with:
   - date (ISO format YYYY-MM-DD)
   - description (ACTUAL MERCHANT NAME - see guidelines below)
   - amount (positive = income, negative = expense)
   - category (assign to one of your custom categories, or "Income" for deposits)

MERCHANT NAME EXTRACTION (CRITICAL):
- Extract the ACTUAL merchant/business name, not the raw transaction code
- Remove prefixes like "POS", "VISA", "MASTERCARD", "DEBIT", "PURCHASE", "CARD"
- Remove suffixes like city names, reference numbers, dates, card numbers
- Normalize names: "STARBUCKS #12345 NYC" → "Starbucks"
- Recognize common merchants: "AMZN MKTP US*AB1C2D3" → "Amazon"
- Clean payment processors: "SQ *COFFEE SHOP" → "Coffee Shop"
- Handle international formats: "UBER *EATS PENDING" → "Uber Eats"
- Examples:
  - "POS DEBIT VISA-WALMART #1234 ATLANTA GA" → "Walmart"
  - "SPOTIFY P123ABC456" → "Spotify"
  - "PAYPAL *NETFLIX" → "Netflix"
  - "TST* SHAKE SHACK 1234" → "Shake Shack"

CATEGORY GUIDELINES:
- Create 5-12 meaningful categories based on actual spending patterns
- SUBSCRIPTIONS: Netflix, Spotify, Disney+, HBO Max, Hulu, Amazon Prime, YouTube Premium, Apple Music, iCloud, Google One, Dropbox, Adobe, Microsoft 365, gym memberships, Patreon, Substack, any recurring monthly/yearly charges
- Distinguish between one-time purchases and recurring subscriptions
- Be specific: "Coffee & Cafes" not just "Food", "Streaming Services" not just "Subscriptions"
- Common subscription keywords: recurring, monthly, annual, subscription, membership, premium, pro, plus

Respond with ONLY valid JSON:
{
  "currency": "USD",
  "statementType": "credit_card",
  "balanceInfo": {
    "creditLimit": 10000,
    "creditUsed": 3500,
    "availableCredit": 6500
  },
  "categories": ["Groceries", "Dining Out", "Streaming Services", "Software Subscriptions", "Transport", "Shopping"],
  "transactions": [
    {"date": "2024-01-15", "description": "Netflix", "amount": -15.99, "category": "Streaming Services"},
    {"date": "2024-01-15", "description": "Amazon", "amount": -49.99, "category": "Shopping"},
    {"date": "2024-01-16", "description": "Salary - Acme Corp", "amount": 2500.00, "category": "Income"}
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `File type: ${fileType}\n\nContent:\n${rawContent}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const parsed = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-file:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Analysis failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
