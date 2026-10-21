/**
 * The result shape every project-manager Server Action returns.
 *
 * The actions are bound with `useActionState`, which hands the previous
 * state back on every submit, so the shape has to describe three things:
 * whether the last submit worked, a message worth showing, and a map of
 * per-field errors the form can render under the right input.
 */
export interface ProjectActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** The record the action created, so the caller can navigate to it. */
  createdNanoid?: string;
}

export const initialProjectActionState: ProjectActionState = {
  status: "idle",
};

/**
 * The result of an action that takes a plain object rather than a form.
 *
 * Used by the row-level controls — a status change, a delete, a workflow
 * button — which have no form to bind.
 */
export interface ProjectResultState {
  status: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const successResult: ProjectResultState = { status: "success" };
