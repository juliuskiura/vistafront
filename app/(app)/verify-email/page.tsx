export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is almost ready. Please confirm your email address using
          the link we sent you, then sign in to continue.
        </p>
      </div>
    </main>
  );
}
