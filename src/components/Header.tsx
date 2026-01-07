const Header = () => {
  return (
    <header className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="text-5xl">💸</span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          WhereTheFuckDidMyMoneyGo
        </h1>
      </div>
      <p className="text-muted-foreground text-lg">
        Find out where your money actually went
      </p>
    </header>
  );
};

export default Header;
