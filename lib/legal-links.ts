/**
 * Canonical legal URLs.
 *
 * Single source of truth for every link out to our public legal pages. These
 * strings are pasted into Meta's App Review Basic Settings (Terms of Service
 * URL, Privacy Policy URL, Data Deletion Instructions URL), so they must stay
 * byte-identical to what the server serves — including the trailing slash.
 * A mismatch between the pasted value and the served page has been reported to
 * block an app going Live, so do not "tidy" these by adding or removing a `/`.
 *
 * There are deliberately no in-app `/terms` or `/privacy` routes. The public
 * pages live on the marketing domain and are the same documents; duplicating
 * them inside the app would create a second copy to keep in sync and to keep
 * correct, and a stale copy is a compliance problem rather than a feature.
 *
 * All five verified returning HTTP 200 on 2026-10-04.
 */
export const LEGAL_LINKS = [
  { label: "Terms of Use", href: "https://vistasolve.com/terms-of-use/" },
  { label: "Privacy Policy", href: "https://vistasolve.com/privacy-policy/" },
  {
    label: "Data Deletion",
    href: "https://vistasolve.com/data-deletion-policy/",
  },
  { label: "Cookie Policy", href: "https://vistasolve.com/cookie-policy/" },
  {
    label: "Refund & Cancellation",
    href: "https://vistasolve.com/refund-and-cancellation-policy/",
  },
] as const;

export type LegalLink = (typeof LEGAL_LINKS)[number];

/** Look one up by label. Used by the signup consent checkbox. */
export function legalHref(label: LegalLink["label"]): string {
  return LEGAL_LINKS.find((link) => link.label === label)?.href ?? "";
}

export const TERMS_HREF = legalHref("Terms of Use");
export const PRIVACY_HREF = legalHref("Privacy Policy");
