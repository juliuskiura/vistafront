"use client";

import { useActionState, useRef, useState } from "react";

import { Send } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { IDLE } from "../action-state";
import { saveDraftAction, sendEmailAction } from "../actions";
import { AttachmentPicker } from "./attachment-picker";
import { EmailEditor } from "./email-editor";

interface ComposeFormProps {
  workspace: string;
  mailboxes: { nanoid: string; email_address: string }[];
  defaultMailbox: string;
  /** Pre-fill when replying to an existing message. */
  replyTo?: string;
  /** Pre-fill when continuing a saved draft. */
  draftId?: string;
  initialTo?: string;
  initialSubject?: string;
  /** Plain-text projection, and the no-JS fallback body. */
  initialBody?: string;
  /** Existing HTML body, when continuing a draft. */
  initialBodyHtml?: string;
}

const LABEL = "w-16 shrink-0 text-right text-xs font-medium text-muted-foreground";
const FIELD =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <span className="text-xs text-destructive" role="alert">
      {messages[0]}
    </span>
  );
}

/**
 * Compose form.
 *
 * A real form posting to Server Actions, so send and save-draft both work
 * without client JavaScript. The rich-text editor the old SPA used (TipTap) is
 * not a dependency here, so the body is a plain textarea and the action derives
 * escaped HTML from the text server-side.
 */
export function ComposeForm({
  workspace,
  mailboxes,
  defaultMailbox,
  replyTo,
  draftId,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  initialBodyHtml,
}: ComposeFormProps) {
  const plainRef = useRef<HTMLTextAreaElement>(null);
  const htmlRef = useRef<HTMLInputElement>(null);
  const [richReady, setRichReady] = useState(false);
  const [sendState, sendAction, sending] = useActionState(sendEmailAction, IDLE);
  const [draftState, draftAction, saving] = useActionState(saveDraftAction, IDLE);
  const [schedule, setSchedule] = useState(false);
  const busy = sending || saving;

  const sendErrors = sendState.status === "error" ? sendState.fieldErrors : undefined;
  const draftErrors =
    draftState.status === "error" ? draftState.fieldErrors : undefined;
  const errorsFor = (field: string) => sendErrors?.[field] ?? draftErrors?.[field];

  return (
    <form className="flex min-h-0 flex-1 flex-col" action={sendAction}>
      <input type="hidden" name="workspace" value={workspace} />
      {replyTo && <input type="hidden" name="in_reply_to" value={replyTo} />}
      {draftId && <input type="hidden" name="email_id" value={draftId} />}

      {/* Action bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-5 py-3">
        <label className="flex items-center gap-2">
          <span className={LABEL}>From</span>
          <select
            name="mailbox_id"
            defaultValue={defaultMailbox}
            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            {mailboxes.map((m) => (
              <option key={m.nanoid} value={m.nanoid}>
                {m.email_address}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSchedule((s) => !s)}
            aria-pressed={schedule}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              schedule
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Schedule
          </button>

          {schedule && (
            <input
              type="datetime-local"
              name="scheduled_at"
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          )}

          <Button
            type="submit"
            formAction={draftAction}
            variant="outline"
            size="sm"
            disabled={busy}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>

          <Button type="submit" size="sm" disabled={busy} className="shadow-sm">
            <Send className="h-3.5 w-3.5" aria-hidden />
            {sending ? "Sending…" : schedule ? "Schedule send" : "Send"}
          </Button>
        </div>
      </div>

      {sendState.status === "error" && sendState.message && (
        <p className="border-b border-border bg-destructive/5 px-5 py-2 text-xs text-destructive" role="alert">
          {sendState.message}
        </p>
      )}
      {draftState.status === "success" && (
        <p className="border-b border-border bg-primary/5 px-5 py-2 text-xs text-primary">
          {draftState.message}
        </p>
      )}

      {/* Address block */}
      <div className="shrink-0 border-b border-border">
        {[
          { name: "to", label: "To", required: true, value: initialTo, ph: "recipient@example.com" },
          { name: "cc", label: "Cc", required: false, value: "", ph: "optional" },
          { name: "bcc", label: "Bcc", required: false, value: "", ph: "optional" },
        ].map((field) => (
          <div
            key={field.name}
            className="flex items-center gap-3 border-b border-border/60 px-5 py-2.5 last:border-0"
          >
            <span className={LABEL}>{field.label}</span>
            <input
              name={field.name}
              defaultValue={field.value}
              required={field.required}
              placeholder={field.ph}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <FieldError messages={errorsFor(field.name)} />
          </div>
        ))}

        <div className="flex items-center gap-3 px-5 py-2.5">
          <span className={LABEL}>Subject</span>
          <input
            name="subject"
            defaultValue={initialSubject}
            required
            placeholder="What is this about?"
            className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
          />
          <FieldError messages={errorsFor("subject")} />
        </div>
      </div>

      {/* Body.

          The textarea is always in the DOM and is the real form field, so the
          form still composes a plain-text message with JavaScript disabled.
          When the rich-text editor mounts it takes over visually and mirrors
          both its text and its HTML back into the submitted fields. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <textarea
          ref={plainRef}
          name="body_text"
          defaultValue={initialBody}
          placeholder="Write your message…"
          className={`${FIELD} resize-y leading-relaxed ${
            richReady
              ? "sr-only"
              : "min-h-[340px] font-sans"
          }`}
        />
        <input ref={htmlRef} type="hidden" name="body_html" defaultValue="" />
        <FieldError messages={errorsFor("body_text")} />

        {/* The editor is rendered unconditionally. It used to be gated behind
            `richReady`, but `richReady` is only ever set by the editor's own
            `onReady` — so the gate could never open and the toolbar never
            appeared at all. Until the editor reports ready it renders its own
            skeleton, so there is no layout jump and no visible swap. */}
        <EmailEditor
          initialHTML={initialBodyHtml}
          onReady={() => setRichReady(true)}
          onChange={(html, text) => {
            if (htmlRef.current) htmlRef.current.value = html;
            if (plainRef.current) plainRef.current.value = text;
          }}
        />
      </div>

      {/* Attachments */}
      <div className="shrink-0 border-t border-border bg-muted/20 px-5 py-3">
        <AttachmentPicker disabled={busy} />
      </div>
    </form>
  );
}
