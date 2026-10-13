import type { ScheduledPost } from "@/lib/api/types";

/**
 * A post's media, as a thumbnail grid.
 *
 * A plain `<img>` rather than `next/image` is deliberate — the same reasoning
 * as the channel posts table and the comment thread: these are Meta's signed,
 * short-lived CDN links, so Next's optimiser would cache a copy that expires
 * under our own storage, which is the local-copy decision still open in
 * `reading/0-pending-decisions.md`.
 *
 * Which URLs count as images follows the section's existing convention —
 * `media_image_urls` when the backend resolved any, otherwise `media_urls` —
 * so a post that shows a picture here shows the same one on its detail page.
 */
export function FeedMedia({
  post,
  className,
}: {
  post: Pick<ScheduledPost, "media_image_urls" | "media_urls">;
  className?: string;
}) {
  const images = post.media_image_urls?.length
    ? post.media_image_urls
    : post.media_urls;

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={className}>
        {/* `object-contain` under a height cap keeps the whole picture visible:
            the image scales to the card width at its own aspect ratio, and only
            a very tall one is bounded — never cropped — by `max-h`. */}
        <img
          src={images[0]}
          alt=""
          loading="lazy"
          className="mt-3 max-h-[32rem] w-full rounded-xl object-contain ring-1 ring-black/5"
        />
      </div>
    );
  }

  const shown = images.slice(0, 4);
  const overflow = images.length - shown.length;

  return (
    <div
      className={[
        "mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4",
        className ?? "",
      ].join(" ")}
    >
      {shown.map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          loading="lazy"
          className="aspect-square w-full rounded-lg bg-neutral-100 object-contain ring-1 ring-black/5"
        />
      ))}
      {overflow > 0 && (
        <span className="flex aspect-square w-full items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-500 ring-1 ring-black/5">
          +{overflow}
        </span>
      )}
    </div>
  );
}
