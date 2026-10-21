import { Progress } from "@/components/ui/progress";

interface Props {
  label: string;
  done: number;
  total: number;
  className?: string;
}

/**
 * A labelled progress bar.
 *
 * The backend counts a project's finished tasks and published
 * deliverables, so the bar is a straight ratio of two numbers the API
 * already returns — no client-side tally that could drift.
 */
export function ProgressMeter({ label, done, total, className }: Props) {
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {done}/{total}
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}
