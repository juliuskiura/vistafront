import { Card } from "@/components/ui/card";

interface Props {
  /** Short, user-friendly title. */
  title: string;
  /**
   * Detailed error message. For 4xx/5xx we surface the path + status so
   * the developer can see what happened without opening devtools.
   */
  message: string;
  /** Optional hint for what the user can do. */
  hint?: string;
}

export function DashboardError({ title, message, hint }: Props) {
  return (
    <Card className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
      <h2 className="text-base font-semibold text-destructive">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {hint ? (
        <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
