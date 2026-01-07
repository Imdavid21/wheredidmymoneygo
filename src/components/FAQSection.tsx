import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-medium">Frequently Asked Questions</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="file-formats" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            What file formats are supported?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            We support <span className="font-medium text-foreground">CSV</span>, <span className="font-medium text-foreground">XLSX/XLS</span> (Excel), 
            and <span className="font-medium text-foreground">PDF</span> files. Most bank and credit card statements can be 
            exported in these formats. PDF analysis uses AI to extract transactions, 
            while CSV/Excel files are parsed directly for faster processing.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="accuracy" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            How accurate is the analysis?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
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
        
        <AccordionItem value="multiple-files" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            Can I upload multiple files at once?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            Yes! You can upload up to <span className="font-medium text-foreground">10 files</span> at once. 
            Data from all files is merged into a single analysis. If files have different 
            currencies, we automatically convert everything to the most common currency 
            using live exchange rates.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="supported-banks" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            Which banks are supported?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            We support statements from any bank that exports to CSV, Excel, or PDF. 
            This includes major banks worldwide. Our AI adapts to different statement 
            formats, so even if your bank uses a unique layout, we can usually parse it.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="currency-support" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            What currencies are supported?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            We auto-detect and support 20+ currencies including USD, EUR, GBP, JPY, INR, 
            AUD, CAD, CHF, ZAR, and more. Currency is detected from your statement content 
            and displayed appropriately throughout the analysis.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="data-export" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            Can I export my analysis?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            Export functionality is coming soon. For now, you can take screenshots 
            or use your browser's print function to save a PDF of your analysis.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="free" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            Is this tool free?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            Yes, the tool is completely free to use. There are no hidden fees, 
            no premium tiers, and no account required. We believe everyone should 
            have access to understand their finances.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="mobile" className="border-border/50">
          <AccordionTrigger className="text-xs py-2 hover:no-underline">
            Does it work on mobile?
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground pb-3">
            Yes! The tool is fully responsive and works on phones and tablets. 
            You can upload files directly from your device or cloud storage.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FAQSection;
