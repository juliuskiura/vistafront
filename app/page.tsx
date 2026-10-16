import Link from "next/link";

import { Button } from "@/components/ui/button";

const networks = [
  {
    key: "facebook",
    label: "Facebook",
    svg: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path
          d="M15.5 12.5H13V19H10.5V12.5H9V10H10.5V8.5C10.5 6.8 11.5 5.5 13.5 5.5H15.5V8H14C13.4 8 13 8.4 13 9V10H15.5L15.5 12.5Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    svg: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <defs>
          <radialGradient
            id="ig-grad"
            cx="0.2"
            cy="1"
            r="1"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFD521" />
            <stop offset="10%" stopColor="#FFD521" />
            <stop offset="50%" stopColor="#F50000" />
            <stop offset="100%" stopColor="#B900B4" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
        <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth={1.8} />
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="4.5"
          stroke="white"
          strokeWidth={1.8}
        />
        <circle cx="16.5" cy="7.5" r="1.1" fill="white" />
      </svg>
    ),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    svg: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path
          d="M7.5 9.5H5.5V18.5H7.5V9.5ZM6.5 8.5C7.2 8.5 7.7 7.9 7.7 7.2C7.7 6.5 7.2 6 6.5 6C5.8 6 5.3 6.5 5.3 7.2C5.3 7.9 5.8 8.5 6.5 8.5ZM18.5 18.5H16.5V14.5C16.5 13.5 16 12.8 14.9 12.8C14 12.8 13.5 13.5 13.3 14.1V18.5H11.3V9.5H13.3V10.8C13.6 10.3 14.3 9.3 15.8 9.3C17.3 9.3 18.5 10.3 18.5 12.5V18.5Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    svg: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect width="24" height="24" rx="12" fill="#000000" />
        <path
          d="M16.5 6H18.5L14 11.2L19.3 18H15.2L12 13.8L8.4 18H6.4L11.2 12.5L6.1 6H10.3L13.2 9.9L16.5 6ZM15.8 16.8H16.9L9.6 7.1H8.4L15.8 16.8Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    svg: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect width="24" height="24" rx="12" fill="#000000" />
        <path
          d="M14.5 5.5C15 6.8 16 7.8 17.5 8V10.5C16.3 10.5 15.3 10 14.5 9.3V14C14.5 16.5 12.5 18.5 10 18.5C7.5 18.5 5.5 16.5 5.5 14C5.5 11.5 7.5 9.5 10 9.5C10.4 9.5 10.7 9.6 11 9.7V12.2C10.7 12.1 10.4 12 10 12C8.9 12 8 12.9 8 14C8 15.1 8.9 16 10 16C11.1 16 12 15.1 12 14V5.5H14.5Z"
          fill="white"
        />
        <path
          d="M14.5 5.5C15 6.8 16 7.8 17.5 8V8.6C16 8.4 15 7.4 14.5 6.1V5.5Z"
          fill="#25F4EE"
        />
        <path
          d="M12 14C12 15.1 11.1 16 10 16C8.9 16 8 15.1 8 14C8 13.6 8.1 13.3 8.3 13C8.1 13.3 8 13.6 8 14C8 15.1 8.9 16 10 16C11.1 16 12 15.1 12 14Z"
          fill="#FE2C55"
        />
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    svg: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect width="24" height="24" rx="12" fill="#FF0000" />
        <path
          d="M16.5 9.5C17.3 9.7 17.8 10.4 18 11.2C18.3 12.5 18.3 14 18.3 14C18.3 14 18.3 15.5 18 16.8C17.8 17.6 17.3 18.3 16.5 18.5C15.2 18.8 12 18.8 12 18.8C12 18.8 8.8 18.8 7.5 18.5C6.7 18.3 6.2 17.6 6 16.8C5.7 15.5 5.7 14 5.7 14C5.7 14 5.7 12.5 6 11.2C6.2 10.4 6.7 9.7 7.5 9.5C8.8 9.2 12 9.2 12 9.2C12 9.2 15.2 9.2 16.5 9.5ZM10.5 16.2L14.8 14L10.5 11.8V16.2Z"
          fill="white"
        />
      </svg>
    ),
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* Left: hero panel */}
        <div className="flex-1 max-w-xl space-y-6 lg:pr-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-[#374bd8]">
            <span className="w-2 h-2 rounded-full bg-[#374bd8] animate-pulse" />
            <span>Unified Multi-Platform Engine</span>
          </div>

          <h1 className="font-jakarta text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Manage, publish, and moderate all channels in{" "}
            <span className="text-[#374bd8]">one place.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminate tedious tab-switching. Compose rich campaigns for
            Facebook, Instagram, LinkedIn, X, TikTok, and YouTube, then read
            and reply to all cross-platform comments from a single unified
            inbox.
          </p>

          {/* Connected networks */}
          <div className="pt-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2.5">
              Connected Networks Live Sync:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {networks.map((n) => (
                <div
                  key={n.key}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700"
                >
                  {n.svg}
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Simultaneous Publishing
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 leading-snug block">
                  Compose once, tailor per network, and schedule in seconds.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#374bd8] flex items-center justify-center shrink-0">
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Multi-Channel Moderation
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 leading-snug block">
                  Filter, read threads, and answer comments with AI
                  suggestions.
                </span>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-3.5">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
              alt="Elena Rostova"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-slate-700 italic leading-snug">
                “Vistasolve transformed our marketing operations. Being able to
                moderate all channel comments from one central view saved us
                hours every day.”
              </p>
              <span className="text-[11px] font-bold text-slate-900 block mt-1">
                Elena Rostova &middot; Operations Lead
              </span>
            </div>
          </div>
        </div>

        {/* Right: gutted auth card shell + preserved CTA buttons */}
        <div className="w-full max-w-md shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="text-left">
              <h2 className="font-jakarta text-2xl font-semibold tracking-tight text-foreground">
                Ready when you are
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sign in to pick up where your team left off, or create an
                account in under a minute and let us walk you through the
                rest.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 flex-1 rounded-xl">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 flex-1 rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
              >
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
