# WhereDidMyMoneyGo

Upload a bank or card statement and see where the money went: a Sankey of income into spending categories, spending trends, a subscription tracker and a short list of insights.

**Live:** https://wheredidmymoneygo.xyz
**Source:** https://github.com/Imdavid21/wheredidmymoneygo

A side project by Uddalak Das. More builds: https://github.com/Imdavid21

## What it does

- Drag and drop a statement as CSV, Excel (.xlsx) or PDF.
- Stats for income, total spent, recurring charges and average transaction size.
- Canvas based Sankey diagram from income sources to spending categories, plus a category breakdown and daily spending trends.
- Subscription tracker that groups recurring merchants and looks up a cancellation link for each.
- Multi currency statements, converted using daily exchange rates.

## How your data is handled

Parsing happens in the browser (PapaParse for CSV, SheetJS for Excel, pdf.js for PDF). Nothing is stored and nothing is saved to a database, and closing the tab clears everything.

It is not fully local. When a file cannot be read reliably on the device, the extracted text (capped at 50,000 characters) is sent to a Supabase edge function that asks Gemini 2.5 Flash, through the Lovable AI gateway, to pull out transactions and categories. This always happens for PDFs. For CSV and Excel it happens only when fewer than 3 transactions are found locally. Merchant names of detected subscriptions are also sent to find cancellation links. The in app Privacy page describes the same flow.

## Stack

- Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui
- Canvas API for the Sankey diagram
- Supabase Edge Functions (Deno) in `supabase/functions`:
  - `analyze-file`: statement text to structured transactions
  - `find-cancel-link`: subscription name to a cancellation URL
  - `convert-currency`: cached exchange rates from exchangerate-api.com

## Run locally

```bash
npm install
# .env is committed with the public Supabase URL and publishable key; swap in your own project's values
npm run dev
```

Environment variables (names also listed in `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

The edge functions need a `LOVABLE_API_KEY` secret set in your Supabase project. Without it the app still works for clean CSV and Excel files, but PDF analysis and cancellation links will not.
