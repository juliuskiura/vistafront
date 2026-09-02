export default function RestrictedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h1 className="text-xl font-semibold">Workspace access unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You don&apos;t have access to the workspace you requested. (Workspace
          switcher lands in a later stage.)
        </p>
      </div>
    </main>
  );
}
