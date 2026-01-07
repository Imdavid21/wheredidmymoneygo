interface HeaderProps {
  hasData: boolean;
  onReset?: () => void;
}

const Header = ({ hasData, onReset }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between mb-8 md:mb-12">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          WhereTheFuckDidMyMoneyGo
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find out where your money actually went
        </p>
      </div>
      
      {hasData && onReset && (
        <button
          onClick={onReset}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Upload new file
        </button>
      )}
    </header>
  );
};

export default Header;
