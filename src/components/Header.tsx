import { Button } from '@/components/ui/button';

interface HeaderProps {
  hasData: boolean;
  onReset?: () => void;
}

const Header = ({ hasData, onReset }: HeaderProps) => {
  return (
    <header className="flex flex-col items-center text-center mb-8 md:mb-12">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
        WhereTheFuckDidMyMoneyGo
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Find out where your money actually went
      </p>
      
      {hasData && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          Upload new file
        </Button>
      )}
    </header>
  );
};

export default Header;
