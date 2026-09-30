"use client";

import { useActionState, useState } from "react";

import { Send } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { saveDraftAction, sendEmailAction } from "../actions";
import { IDLE } from "../action-state";

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
  initialBody?: string;
}

const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900";

/**
 * Compose form.
 *
 * A real form posting to Server Actions, so send/save-draft work without
 * client JavaScript. The rich-text editor the old SPA used (TipTap) is not a
 * dependency here, so the body is a plain textarea and the action derives
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
}: ComposeFormProps) {
  const [sendState, sendAction, sending] = useActionState(sendEmailAction, IDLE);
  const [draftState, draftAction, saving] = useActionState(saveDraftAction, IDLE);
  const [schedule, setSchedule] = useState(false);

  const sendErrors = sendState.status === "error" ? sendState.fieldErrors : undefined;
  const draftErrors = draftState.status === "error" ? draftState.fieldErrors : undefined;
  const busy = sending || saving;

  return (
    <form className="flex min-h-0 flex-1 flex-col" action={sendAction}>
      <input type="hidden" name="workspace" value={workspace} />
      {replyTo && <input type="hidden" name="in_reply_to" value={replyTo} />}
      {draftId && <input type="hidden" name="email_id" value={draftId} />}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <label className="flex items-center gap-2">
          <span className="w-16 text-right text-xs font-medium text-slate-500">
            From
          </span>
          <select
            name="mailbox_id"
            defaultValue={defaultMailbox}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900"
          >
            {mailboxes.map((m) => (
              <option key={m.nanoid} value={m.nanoid}>
                {m.email_address}
              </option>
            ))}
          </select>
        </label>

        {sendState.status === "error" && sendState.message && (
          <p className="text-xs text-red-600">{sendState.message}</p>
        )}
        {draftState.status === "success" && (
          <p className="text-xs text-emerald-600">{draftState.message}</p>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSchedule((s) => !s)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              schedule
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Schedule
          </button>

          {schedule && (
            <input
              type="datetime-local"
              name="scheduled_at"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900"
            />
          )}

          <Button
            type="submit"
            formAction={draftAction}
            variant="outline"
            size="sm"
            disabled={busy}
          >
            {saving ? "Saving..." : "Save draft"}
          </Button>

          <Button type="submit" size="sm" disabled={busy}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sending ? "Sending..." : schedule ? "Schedule send" : "Send"}
          </Button>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800">
        {[
          { name: "to", label: "To", required: true, value: initialTo },
          { name: "cc", label: "Cc", required: false, value: "" },
          { name: "bcc", label: "Bcc", required: false, value: "" },
        ].map((field) => (
          <div
            key={field.name}
            className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-0 dark:border-slate-800"
          >
            <span className="w-16 text-right text-xs font-medium text-slate-500">
              {field.label}
            </span>
            <input
              name={field.name}
              defaultValue={field.value}
              required={field.required}
              placeholder={
                field.name === "to" ? "recipient@example.com" : "optional"
              }
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {(sendErrors?.[field.name] ?? draftErrors?.[field.name])?.map((msg) => (
              <span key={msg} className="text-xs text-red-600">
                {msg}
              </span>
            ))}
          </div>
        ))}

        <div className="flex items-center gap-2 px-4 py-2">
          <span className="w-16 text-right text-xs font-medium text-slate-500">
            Subject
          </span>
          <input
            name="subject"
            defaultValue={initialSubject}
            required
            placeholder="Subject"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {(sendErrors?.subject ?? draftErrors?.subject)?.map((msg) => (
            <span key={msg} className="text-xs text-red-600">
              {msg}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          name="body_text"
          defaultValue={initialBody}
          placeholder="Write your message..."
          className={`${FIELD} min-h-[320px] resize-y font-sans`}
        />
        {(sendErrors?.body_text ?? draftErrors?.body_text)?.map((msg) => (
          <p key={msg} className="mt-1 text-xs text-red-600">
            {msg}
          </p>
        ))}
      </div>
    </form>
  );
}
