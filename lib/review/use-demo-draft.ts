"use client";

import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * A draft textbox that fills itself with the demo text whenever it is focused
 * while empty.
 *
 * A pre-filled demo reads as content the reviewer already wrote: one stray
 * keystroke mangles the sample caption before anyone has read it, and an
 * empty-looking composer that was quietly carrying text is a confusing thing
 * to hand a reviewer. Filling on focus behaves like the sample having been
 * typed -- the box is visibly empty until the reviewer reaches for it, and
 * the sample is waiting when they do.
 *
 * The rule is a single condition, evaluated on every focus: is the box empty?
 * Empty means the fill happens, whether the box was never touched or the
 * user just cleared it; non-empty means the fill stays out of the way, so it
 * can never overwrite what the user is writing. Nothing is remembered
 * between focuses -- no once-flag, no shared ref -- which is what makes the
 * mechanism independent per box: one textbox being filled (or cleared)
 * has no effect on any other.
 *
 * @param initial What the box opens with -- an edited post's content, or a
 *   caller's own draft. The demo never touches a box that opens with one.
 * @returns The value, its setter (same shape as `useState`'s), and the
 *   `onFocus` handler to wire onto the textbox.
 */
export function useDemoDraft(initial: string): {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  fillOnFocus: (demoText?: string | null) => void;
} {
  const [value, setValue] = useState(initial);

  const fillOnFocus = useCallback((demoText?: string | null) => {
    if (!demoText) return;
    // `trim` decides emptiness, so a box holding only spaces counts as empty
    // and gets the sample, while any real text is left strictly alone.
    setValue((current) => (current.trim() ? current : demoText));
  }, []);

  return { value, setValue, fillOnFocus };
}
