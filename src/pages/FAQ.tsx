import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to analyzer
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">Frequently Asked Questions</h1>
        </div>

        <Accordion type="single" collapsible className="w-full" defaultValue="file-formats">
          <AccordionItem value="file-formats" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              What file formats are supported?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              We support <span className="font-medium text-foreground">CSV</span>, <span className="font-medium text-foreground">XLSX/XLS</span> (Excel), 
              and <span className="font-medium text-foreground">PDF</span> files. Most bank and credit card statements can be 
              exported in these formats. PDF analysis uses AI to extract transactions, 
              while CSV/Excel files are parsed directly for faster processing.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="accuracy" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              How accurate is the analysis?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
              <p>
                Our AI is trained to understand various bank statement formats and can 
                typically extract 95%+ of transactions accurately. Complex or unusual 
                formats may have lower accuracy.
              </p>
              <p>
                Categories are intelligently assigned based on merchant names and 
                transaction patterns. While not perfect, they provide a useful 
                starting point for understanding your spending.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="multiple-files" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              Can I upload multiple files at once?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              Yes! You can upload up to <span className="font-medium text-foreground">10 files</span> at once. 
              Data from all files is merged into a single analysis. If files have different 
              currencies, we automatically convert everything to the most common currency 
              using live exchange rates.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="supported-banks" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              Which banks are supported?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              We support statements from any bank that exports to CSV, Excel, or PDF. 
              This includes major banks worldwide. Our AI adapts to different statement 
              formats, so even if your bank uses a unique layout, we can usually parse it.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="currency-support" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              What currencies are supported?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              We auto-detect and support 20+ currencies including USD, EUR, GBP, JPY, INR, 
              AUD, CAD, CHF, ZAR, and more. Currency is detected from your statement content 
              and displayed appropriately throughout the analysis.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="data-export" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              Can I export my analysis?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              Export functionality is coming soon. For now, you can take screenshots 
              or use your browser's print function to save a PDF of your analysis.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="free" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              Is this tool free?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              Yes, the tool is completely free to use. There are no hidden fees, 
              no premium tiers, and no account required.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="mobile" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              Does it work on mobile?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              Yes! The tool is fully responsive and works on phones and tablets. 
              You can upload files directly from your device or cloud storage.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              Is my data secure?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              Absolutely. Your files are processed in your browser and never stored on our servers. 
              AI analysis happens in a stateless environment with no data retention. 
              Check our <Link to="/privacy" className="text-foreground underline underline-offset-2">Privacy Policy</Link> for 
              full details.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="recurring" className="border-border">
            <AccordionTrigger className="text-sm py-4 hover:no-underline">
              How are recurring charges detected?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              We identify recurring charges by looking for merchants that appear 
              multiple times with similar amounts. Subscriptions like Netflix, Spotify, 
              gym memberships, and utility bills are automatically flagged and summarized.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Still have questions?
          </p>
          <p className="text-xs text-muted-foreground">
            We're always improving. Your feedback helps us make the tool better.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
