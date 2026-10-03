import { formatMediumDate } from "@/lib/dates";
import {
  senderLabel,
  showAuthorFor,
  type SocialMessage,
} from "@/lib/api/inbox";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "./message-attachment";

/**
 * One message in the transcript.
 *
 * Alignment is driven entirely by `direction`: inbound (someone wrote to the
 * Page) sits left, outbound (a reply we sent) sits right in the accent colour.
 * That field is the contract — there is no "is this ours" check against the
 * Page id, which would break the moment a Page was renamed or reconnected.
 *
 * The author line is printed on inbound bubbles only, and only when the sender
 * is actually resolved. Every outbound message in a thread is written by the
 * same Page, so labelling them all would repeat one fact down the right-hand
 * column and push the conversation down the screen.
 */
export function MessageBubble({ message }: { message: SocialMessage }) {
  const isOutbound = message.direction === "outbound";
  const timestamp = message.sent_at ?? message.created_at;
  const author = showAuthorFor(message)
    ? senderLabel(message.sender, message.sender_name, message.sender_id)
    : null;

  return (
    <div
      className={cn(
        "flex flex-col",
        isOutbound ? "items-end" : "items-start",
      )}
    >
      {author && (
        <p className="mb-1 px-1 text-xs font-medium text-gray-500">{author}</p>
      )}

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
                <MessageAttachment
                  attachment={attachment}
                  outbound={isOutbound}
                />
              </li>
            ))}
          </ul>
        )}

        {message.attachments.length === 0 && !message.text && (
          <p className="text-xs italic opacity-70">
            {message.message_type
              ? `${message.message_type} message`
              : "Empty message"}
          </p>
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
