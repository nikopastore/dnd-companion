export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background decorative orbs */}
      <div className="decorative-orb w-[500px] h-[500px] bg-primary-container -top-32 -right-32 fixed" />
      <div className="decorative-orb w-[350px] h-[350px] bg-secondary -bottom-20 -left-10 fixed" />

      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-sm bg-surface-container-low border border-secondary/20 flex items-center justify-center glow-gold">
              <span className="material-symbols-outlined text-2xl text-secondary">auto_stories</span>
            </div>
          </div>
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">
            The Digital Tome
          </h1>
          <p className="font-body text-sm text-on-surface-variant/60">
            Your companion for legendary adventures
          </p>
        </div>

        {/* Form container */}
        <div className="bg-surface-container-low/80 rounded-sm p-8 shadow-elevated border border-outline-variant/8 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
