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
          <span
            className="block whitespace-pre-wrap"
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
