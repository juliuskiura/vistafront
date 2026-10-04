import { LEGAL_LINKS } from "@/lib/legal-links";
import { cn } from "@/lib/utils";

/**
 * The row of legal links shown on the public auth screens (login, signup).
 *
 * Meta's App Review requires the Terms of Service, Privacy Policy and Data
 * Deletion Instructions URLs to be reachable and to state, concretely, how a
 * user requests deletion. A reviewer signs up or signs in before doing anything
 * else, so these links live on the first screen they see rather than buried in
 * a footer they have to go looking for.
 *
 * Every link opens in a new tab: the reviewer needs to keep the login form in
 * front of them to copy the test credentials, and a same-tab navigation would
 * lose the form state.
 *
 * Server Component — static anchors, no interactivity required.
 */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Legal and policies"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground",
        className,
      )}
    >
      {LEGAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
