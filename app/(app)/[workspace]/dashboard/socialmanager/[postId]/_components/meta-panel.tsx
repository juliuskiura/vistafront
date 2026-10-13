import {
  CalendarClock,
  Clock,
  Edit3,
  Image as ImageIcon,
  Info,
  Pause,
  RefreshCw,
  Send,
  Share2,
  Trash2,
  Copy,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from "@/lib/icons";
import type { PostRecipient, ScheduledPost } from "@/lib/api/types";
import { formatMediumDateTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { DeliveryOutcomes } from "@/components/socialmanager/delivery-outcomes";
import { cn } from "@/lib/utils";

/** Status badges with their label, colour and leading icon, as the post
 *  detail page's meta panel reads them. The shared `STATUS_STYLES` from
 *  platform-gradients only carries a colour class; the meta panel needs the
 *  leading icon too, so it keeps its own richer table. */
const STATUS_STYLES: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  scheduled: { label: "Scheduled", className: "text-violet-700 bg-violet-50 border-violet-200", icon: Clock },
  published: { label: "Published", className: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  draft: { label: "Draft", className: "text-amber-700 bg-amber-50 border-amber-200", icon: FileText },
  publishing: { label: "Publishing", className: "text-sky-700 bg-sky-50 border-sky-200", icon: Loader2 },
  failed: { label: "Failed", className: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  canceled: { label: "Canceled", className: "text-slate-600 bg-slate-50 border-slate-200", icon: XCircle },
};

function MetaRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Icon className="size-3.5 text-neutral-400" />
        {label}
      </span>
      <span className="text-xs font-medium text-neutral-900">{value}</span>
    </div>
  );
}

function formatDateTime(iso: string | null | undefined): string {
  return formatMediumDateTime(iso);
}

/** Right-rail panel: post status, scheduling timeline, delivery outcomes
 *  and the inline action buttons. Matches the detail page's existing meta
 *  panel but lives in the sticky rail of the two-column layout. */
export function MetaPanel({
  post,
  recipients,
  pendingAction,
  retryBlockedReason,
  hasFailedRecipients,
  onAction,
}: {
  post: ScheduledPost;
  recipients: PostRecipient[];
  pendingAction: string | null;
  retryBlockedReason: string | null;
  hasFailedRecipients: boolean;
  onAction: (action: string) => void;
}) {
  const statusCfg = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
  const StatusIcon = statusCfg.icon;

  return (
    <>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              statusCfg.className,
            )}
          >
            <StatusIcon className={`size-3.5 ${post.status === "publishing" ? "animate-spin" : ""}`} />
            {statusCfg.label}
          </span>
          {post.synced_from_channel && (
            <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
              Synced
            </span>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <MetaRow icon={CalendarClock} label="Scheduled" value={formatDateTime(post.scheduled_at)} />
          {post.published_at && <MetaRow icon={Send} label="Published" value={formatDateTime(post.published_at)} />}
          <MetaRow icon={Clock} label="Created" value={formatDateTime(post.created_at)} />
          <MetaRow icon={Clock} label="Updated" value={formatDateTime(post.updated_at)} />
          <MetaRow icon={ImageIcon} label="Media" value={`${(post.media_image_urls?.length || post.media_urls?.length || 0)} items`} />
          <MetaRow icon={Users} label="Recipients" value={`${post.recipients.length} pages`} />
        </div>
      </div>

      {/* Delivery outcomes — per-channel, not the aggregate error. */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
        <DeliveryOutcomes recipients={recipients} />
        {!recipients.length && post.error_message && (
          <p className="text-xs text-red-700">{post.error_message}</p>
        )}
        {retryBlockedReason && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700">
            <Info className="mt-0.5 size-3 shrink-0" />
            {retryBlockedReason}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onAction("edit")}
        >
          <Edit3 className="size-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onAction("duplicate")}
        >
          <Copy className="size-3.5" /> Duplicate
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onAction("share")}
        >
          <Share2 className="size-3.5" /> Share
        </Button>
        {post.status === "scheduled" && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onAction("cancel")}
          >
            <Pause className="size-3.5" /> Pause
          </Button>
        )}
        {hasFailedRecipients && (
          <Button
            size="sm"
            disabled={pendingAction !== null}
            className="gap-1.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500"
            onClick={() => onAction("retry")}
          >
            <RefreshCw className={`size-3.5 ${pendingAction === "retry" ? "animate-spin" : ""}`} />
            {pendingAction === "retry" ? "Retrying…" : "Retry failed channels"}
          </Button>
        )}
        {(post.status === "failed" || post.status === "draft") && (
          <Button
            size="sm"
            disabled={pendingAction !== null}
            className="gap-1.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500"
            onClick={() => onAction("publish")}
          >
            <Send className="size-3.5" /> Publish now
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
          onClick={() => onAction("delete")}
        >
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </>
  );
}
