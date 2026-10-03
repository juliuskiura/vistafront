import { AudioLines, Download, FileText, Image as ImageIcon, Video } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Attachment = {
  url: string;
  type: string;
  title: string;
};

/**
 * Meta's own labels, lowercased, so a type we have never heard of still renders
 * as *something* rather than as an empty bubble.
 *
 * Instagram and Messenger share this vocabulary on the `messaging` edge, and it
 * is not a closed set: `image`, `video`, `audio`, `file`, plus `fallback` for
 * the URL-preview card Meta sends instead of a real attachment. Anything absent
 * falls through to the link renderer, which is the safe default — it shows the
 * type name and opens the URL, so an unrecognised kind is still reachable
 * instead of being swallowed.
 */
const KIND_ALIASES: Record<string, "image" | "video" | "audio"> = {
  image: "image",
  photo: "image",
  video: "video",
  audio: "audio",
  voice: "audio",
};

/** Resolve Meta's attachment type to one of the three renderable kinds. */
export function attachmentKind(type: string): "image" | "video" | "audio" | "file" {
  const key = (type || "").trim().toLowerCase();
  if (key in KIND_ALIASES) return KIND_ALIASES[key];
  if (key.startsWith("image/")) return "image";
  if (key.startsWith("video/")) return "video";
  if (key.startsWith("audio/")) return "audio";
  return "file";
}

/** A short human label for an attachment, used as its alt text and link text. */
export function attachmentLabel(attachment: Attachment): string {
  return attachment.title || attachment.type || "Attachment";
}

function Icon({ kind }: { kind: "image" | "video" | "audio" | "file" }) {
  const Glyph =
    kind === "image" ? ImageIcon
    : kind === "video" ? Video
    : kind === "audio" ? AudioLines
    : FileText;
  return <Glyph className="size-3.5" aria-hidden="true" />;
}

/**
 * One non-text payload on a message.
 *
 * Images, video and audio get a native player; everything else is a link. The
 * players carry `controls` and no `autoPlay` — a thread that starts playing
 * sound when it renders is a bug, not a feature.
 *
 * Every branch tolerates a missing URL. Meta's normaliser keeps a url-less
 * attachment (it stores the descriptor without one), and rendering
 * `<img src="">` or `<video src="">` would make the browser re-request the page
 * as if it were a media file, so an unlinked attachment degrades to plain text.
 */
export function MessageAttachment({
  attachment,
  outbound,
}: {
  attachment: Attachment;
  outbound: boolean;
}) {
  const label = attachmentLabel(attachment);
  const kind = attachmentKind(attachment.type);

  if (!attachment.url) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs",
          outbound ? "text-white/80" : "text-gray-500",
        )}
      >
        <Icon kind={kind} />
        {label}
      </span>
    );
  }

  if (kind === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={label}
          className="max-h-72 max-w-full rounded-lg object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (kind === "video") {
    return (
      <video
        src={attachment.url}
        controls
        preload="metadata"
        className="max-h-72 max-w-full rounded-lg"
      >
        <a href={attachment.url} target="_blank" rel="noreferrer">
          {label}
        </a>
      </video>
    );
  }

  if (kind === "audio") {
    return (
      <audio src={attachment.url} controls preload="metadata" className="w-full">
        <a href={attachment.url} target="_blank" rel="noreferrer">
          {label}
        </a>
      </audio>
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
      <Icon kind="file" />
      {label}
      <Download className="size-3 opacity-60" aria-hidden="true" />
    </a>
  );
}