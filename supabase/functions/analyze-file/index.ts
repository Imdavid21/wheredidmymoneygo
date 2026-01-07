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
3. Currency code (USD, EUR, GBP, INR, JPY, CAD, AUD, etc.)
4. Create custom expense categories based on the actual spending patterns (e.g., "Groceries", "Dining Out", "Online Shopping", "Streaming Services", "Fuel", "Rent", etc.)
5. ALL transactions with:
   - date (ISO format YYYY-MM-DD)
   - description (clean merchant name)
   - amount (positive = income, negative = expense)
   - category (assign to one of your custom categories, or "Income" for deposits)

RULES:
- Create 5-12 meaningful categories based on actual spending patterns
- Be specific with categories (e.g., "Coffee & Cafes" instead of generic "Food")
- Detect currency from symbols or context
- Extract every transaction found

Respond with ONLY valid JSON:
{
  "currency": "USD",
  "statementType": "credit_card",
  "balanceInfo": {
    "creditLimit": 10000,
    "creditUsed": 3500,
    "availableCredit": 6500
  },
  "categories": ["Groceries", "Dining Out", "Subscriptions", "Transport", "Shopping"],
  "transactions": [
    {"date": "2024-01-15", "description": "AMAZON.COM", "amount": -49.99, "category": "Shopping"},
    {"date": "2024-01-16", "description": "PAYROLL", "amount": 2500.00, "category": "Income"}
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
