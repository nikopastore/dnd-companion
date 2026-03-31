export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary">
            The Digital Tome
          </h1>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Your companion for legendary adventures
          </p>
        </div>
        <div className="bg-surface-container-low rounded-sm p-8 shadow-whisper">
          {children}
        </div>
      </div>
    </div>
  );
}
