"use client";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { sanitizeNoteHtml } from "@/lib/api/sanitize-note-html";

import { InlineField } from "./inline-field";

interface Props {
  /** The company description — HTML, as the legacy app stored it. */
  about?: string;
  workspaceDomain: string;
  companyNanoid: string;
  editing: boolean;
  onSaved?: () => void;
}

/**
 * The "About" field.
 *
 * The legacy app stored the description as rich text, so the editor here is
 * the shared rich-text editor rather than a plain input — a plain input on
 * HTML destroys the formatting on the first save.
 *
 * The stored HTML is sanitised on the way in and on the way out: the value
 * comes from the backend, and it is rendered with `dangerouslySetInnerHTML`.
 */
export function AboutField({
  about,
  workspaceDomain,
  companyNanoid,
  editing,
  onSaved,
}: Props) {
  const html = about ?? "";

  return (
    <InlineField
      label="Description"
      field="about"
      display={
        html ? (
          <div
            className="max-w-none text-[15px] leading-8 text-slate-700 dark:text-slate-200 [&_p]:mb-4 [&_p]:leading-8 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(html) }}
          />
        ) : null
      }
      rawValue={html}
      workspaceDomain={workspaceDomain}
      companyNanoid={companyNanoid}
      editing={editing}
      onSaved={onSaved}
      block
    >
      {(draft, setDraft) => (
        <RichTextEditor
          value={draft}
          onChange={setDraft}
          placeholder="What is this company about?"
          showFooter={false}
          className="rounded-lg border"
        />
      )}
    </InlineField>
  );
}
