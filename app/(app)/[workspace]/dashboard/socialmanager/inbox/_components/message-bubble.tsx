import { formatMediumDate } from "@/lib/dates";
import { FileText } from "@/lib/icons";
import type { SocialMessage } from "@/lib/api/inbox";
import { cn } from "@/lib/utils";

/**
 * One message in the transcript.
 *
 * Alignment is driven entirely by `direction`: inbound (someone wrote to the
 * Page) sits left, outbound (a reply we sent) sits right in the accent colour.
 * That field is the contract — there is no "is this ours" check against the
 * Page id, which would break the moment a Page was renamed or reconnected.
 */
export function MessageBubble({ message }: { message: SocialMessage }) {
  const isOutbound = message.direction === "outbound";
  const timestamp = message.sent_at ?? message.created_at;

  return (
    <div
      className={cn(
        "flex flex-col",
        isOutbound ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          isOutbound
            ? "rounded-br-sm bg-primary-600 text-white"
            : "rounded-bl-sm border border-gray-200 bg-white text-gray-800",
        )}
      >
        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

        {message.attachments.length > 0 && (
          <ul className="mt-2 space-y-1">
            {message.attachments.map((attachment) => (
              <li key={attachment.url}>
                <Attachment attachment={attachment} outbound={isOutbound} />
              </li>
            ))}
          </ul>
        )}

        {message.attachments.length === 0 && !message.text && (
          <p className="italic opacity-70">Unsupported message type</p>
        )}
      </div>

      <time
        className="mt-1 px-1 text-[11px] text-gray-400"
        dateTime={timestamp}
      >
        {formatMediumDate(timestamp)}
      </time>
    </div>
  );
}

function Attachment({
  attachment,
  outbound,
}: {
  attachment: SocialMessage["attachments"][number];
  outbound: boolean;
}) {
  const label = attachment.title || attachment.type || "Attachment";

  // The provider normalises attachments but does not guarantee a URL on every
  // one. Rendering an `<a href="">` would reload the page when clicked, so an
  // unlinked attachment is shown as plain text instead.
  if (!attachment.url) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs",
          outbound ? "text-white/80" : "text-gray-500",
        )}
      >
        <FileText className="size-3.5" aria-hidden="true" />
        {label}
      </span>
    );
  }

  if (attachment.type === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={label}
          className="max-h-48 rounded-lg object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs underline underline-offset-2",
        outbound ? "bg-white/15" : "bg-gray-50",
      )}
    >
      <FileText className="size-3.5" aria-hidden="true" />
      {label}
    </a>
  );
}
