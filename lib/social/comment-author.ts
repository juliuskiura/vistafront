import type { PostComment } from "@/lib/api/types";

export interface CommentAuthor {
  /** The name to print, never empty. */
  name: string;
  /** The avatar to render, or an empty string to fall back to initials. */
  avatarUrl: string;
}

/**
 * Resolve who wrote a comment, tolerating an unresolved sender.
 *
 * `commenter` is the backend's resolved sender and can be null — Instagram
 * exposes no profile lookup, so every Instagram comment arrives with a null
 * commenter and only the denormalised `author_name` / `author_avatar_url` from
 * the raw event. Reading `comment.author_avatar_url` off `commenter` directly
 * (`comment.commenter.picture_url`) throws and takes the whole comment thread
 * down with it, which is exactly what an Instagram post used to do.
 *
 * The order is deliberate: the resolved profile name is richer than the raw
 * event's, the raw name beats a placeholder, and a placeholder beats a blank
 * row. `fallbackName` is "Anonymous" for the public thread and "You" for the
 * "Your first comments" list, which is authored by the Page itself.
 */
export function commentAuthor(
  comment: PostComment,
  fallbackName = "Anonymous",
): CommentAuthor {
  return {
    name: comment.commenter?.display_name || comment.author_name || fallbackName,
    avatarUrl: comment.commenter?.picture_url || comment.author_avatar_url || "",
  };
}
