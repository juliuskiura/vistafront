import Link from "next/link";

import { resolveCapabilityStyle } from "@/lib/icon-maps";
import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/auth/legal-links";
import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

interface Capability {
  featureKey: string;
  label: string;
  description: string;
}

const CAPABILITIES: Capability[] = [
  {
    featureKey: "socialmanager.posts",
    label: "Social Media Management",
    description: "Compose and schedule across every channel.",
  },
  {
    featureKey: "media_libary.assets",
    label: "Content Library",
    description: "Store, transform, and deliver assets.",
  },
  {
    featureKey: "notebook.notes",
    label: "Team Notebook",
    description: "Shared notes and docs for your workspace.",
  },
  {
    featureKey: "projectmanager.projects",
    label: "Project Management",
    description: "Kanban boards, tasks, and deliverables.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="auth-glow auth-glow--primary auth-glow--1 h-[28rem] w-[28rem] -left-24 -top-24" />
        <div className="auth-glow auth-glow--secondary auth-glow--2 h-[26rem] w-[26rem] -right-24 -top-16" />
        <div className="auth-glow auth-glow--accent auth-glow--3 h-[24rem] w-[24rem] bottom-8 left-[12%]" />
        <div className="auth-glow auth-glow--success auth-glow--4 h-[26rem] w-[26rem] -bottom-24 -right-16" />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center mb-12 lg:mb-16">
            <Link
              href="https://vistasolve.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="Vistasolve" className="h-12 w-auto" />
           
            </Link>
            <h1 className="mt-12 font-jakarta text-3xl sm:text-5xl font-extrabold tracking-tight">
              Your team&rsquo;s social workspace.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Sign in to pick up where your team left off &mdash; or create an
              account and launch your first campaign in minutes.
            </p>
          </div>

          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <div className="text-center mb-6">
                <h2 className="font-jakarta text-2xl font-semibold tracking-tight">
                  Sign in
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your workspace credentials to continue.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild className="flex-1 h-11 rounded-xl">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-border"
                >
                  <Link href="/signup">Create account</Link>
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have a session?{" "}
              <Link href="/login" className="font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-6">
              Inside your workspace
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CAPABILITIES.map((cap) => {
                const { icon: Icon, iconBg, iconColor } =
                  resolveCapabilityStyle(cap.featureKey);
                return (
                  <div
                    key={cap.featureKey}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg, iconColor)}>
                      <Icon className="size-5" />
                    </div>
                    <span className="text-sm font-semibold">{cap.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      {cap.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <LegalLinks className="mt-12" />
        </div>
      </div>
    </main>
  );
}
