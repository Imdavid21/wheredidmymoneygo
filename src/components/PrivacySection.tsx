import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PrivacySection = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-sm font-medium">Privacy & Security</h3>
      </div>
      
      <div className="text-xs text-muted-foreground space-y-3">
        <p>
          We built this tool with <span className="font-medium text-foreground">privacy-first principles</span>. 
          Your financial data is sensitive, and we treat it that way.
        </p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-it-works" className="border-border/50">
            <AccordionTrigger className="text-xs py-2 hover:no-underline">
              How the tool works
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                When you upload a file, it's processed entirely in your browser first. 
                For complex formats like PDFs, we send the text content (not the file itself) 
                to our AI for analysis. The AI extracts transactions, categories, and currency information.
              </p>
              <p>
                Once analysis is complete, all data exists only in your browser's memory. 
                Refreshing or closing the page permanently deletes everything.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="what-we-store" className="border-border/50">
            <AccordionTrigger className="text-xs py-2 hover:no-underline">
              What we store vs. don't store
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground pb-3">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground mb-1">We do NOT store:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Your uploaded files</li>
                    <li>Your transaction data</li>
                    <li>Account numbers or balances</li>
                    <li>Merchant names or purchase history</li>
                    <li>Any personally identifiable information</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">We may collect:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Anonymous usage statistics (page views, feature usage)</li>
                    <li>Error logs for debugging (without personal data)</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="ai-processing" className="border-border/50">
            <AccordionTrigger className="text-xs py-2 hover:no-underline">
              AI processing & data handling
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                Our AI analysis runs on secure, stateless infrastructure. Each request is processed 
                independently with no memory of previous requests. The AI receives only the text 
                content needed for analysis—never your original files.
              </p>
              <p>
                AI processing is ephemeral: data is discarded immediately after generating your 
                analysis results. There's no training on your data, no storage, no retention.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tracking" className="border-border/50">
            <AccordionTrigger className="text-xs py-2 hover:no-underline">
              Tracking & cookies
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                We use minimal, privacy-respecting analytics to understand how the tool is used. 
                We don't use advertising trackers, don't sell data, and don't build user profiles.
              </p>
              <p>
                Essential cookies may be used for basic functionality. No third-party tracking 
                cookies are placed.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="currency" className="border-border/50">
            <AccordionTrigger className="text-xs py-2 hover:no-underline">
              Currency conversion
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                When you upload files with multiple currencies, we use live exchange rates 
                from a public API to convert amounts. Only the currency codes and amounts 
                are sent—never transaction descriptions or dates.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default PrivacySection;
