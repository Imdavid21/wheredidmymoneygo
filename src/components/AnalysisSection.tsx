import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  priority?: 'primary' | 'secondary';
}

const AnalysisSection = ({ 
  title, 
  subtitle, 
  defaultOpen = false, 
  children,
  priority = 'secondary'
}: AnalysisSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      "rounded-lg border border-border overflow-hidden transition-all",
      priority === 'primary' ? 'bg-card' : 'bg-card/50'
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div>
          <h3 className="text-xs md:text-sm font-medium">{title}</h3>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-3 md:p-4 pt-0 space-y-3 md:space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AnalysisSection;
