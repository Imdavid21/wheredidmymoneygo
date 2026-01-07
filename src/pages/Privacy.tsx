import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">Privacy & Security</h1>
        </div>

        <p className="text-muted-foreground mb-8">
          We built this tool with <span className="font-medium text-foreground">privacy-first principles</span>. 
          Your financial data is sensitive, and we treat it that way.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-medium mb-3">How the tool works</h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                When you upload a file, it is processed entirely in your browser first. 
                For complex formats like PDFs, we send the text content (not the file itself) 
                to our AI for analysis. The AI extracts transactions, categories, and currency information.
              </p>
              <p>
                Once analysis is complete, all data exists only in your browser memory. 
                Refreshing or closing the page permanently deletes everything.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">What we store vs. don't store</h2>
            <div className="text-sm text-muted-foreground space-y-4">
              <div>
                <p className="font-medium text-foreground mb-2">We do NOT store:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Your uploaded files</li>
                  <li>Your transaction data</li>
                  <li>Account numbers or balances</li>
                  <li>Merchant names or purchase history</li>
                  <li>Any personally identifiable information</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">We may collect:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Anonymous usage statistics (page views, feature usage)</li>
                  <li>Error logs for debugging (without personal data)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">AI processing and data handling</h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Our AI analysis runs on secure, stateless infrastructure. Each request is processed 
                independently with no memory of previous requests. The AI receives only the text 
                content needed for analysis, never your original files.
              </p>
              <p>
                AI processing is ephemeral: data is discarded immediately after generating your 
                analysis results. There is no training on your data, no storage, no retention.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">Tracking and cookies</h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">What we DO NOT use:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Google Analytics</li>
                <li>Facebook Pixel</li>
                <li>Retargeting or remarketing</li>
                <li>Tracking cookies of any kind</li>
                <li>Third-party analytics services</li>
                <li>User profiling or fingerprinting</li>
              </ul>
              <p className="mt-4">
                We may use basic, privacy-respecting analytics to count page views. 
                This collects no personal data, no IP addresses, and no device identifiers. 
                Just simple counts to understand if the tool is being used.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">Currency conversion</h2>
            <div className="text-sm text-muted-foreground">
              <p>
                When you upload files with multiple currencies, we use live exchange rates 
                from a public API to convert amounts. Only the currency codes and amounts 
                are sent—never transaction descriptions or dates.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">Your rights</h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Since we do not store any of your personal data, there is nothing to delete, 
                export, or modify. Your data remains entirely under your control at all times.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Last updated: January 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
