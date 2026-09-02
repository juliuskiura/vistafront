export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
        <h1 className="text-xl font-semibold">Account unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account has been disabled. Please contact an administrator for
          assistance.
        </p>
      </div>
    </main>
  );
}
