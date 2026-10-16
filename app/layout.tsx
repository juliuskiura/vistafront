import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";

import { SessionRefreshProvider } from "@/lib/context/SessionRefreshContext";
import { SidebarProvider } from "@/lib/context/SidebarContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import { QueryProvider } from "@/lib/tanstack/query-provider";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

const outfit = localFont({
  src: "../node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2",
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = localFont({
  src: "../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vistasolve — The CRM Where Your Work Finally Feels at Home",
  description:
    "Vistafront is the calm, organized CRM built for teams who run projects and social media side by side. Plan launches, track every task, schedule and respond across every channel, and trust that nothing slips — all in one reassuring place.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script src="/js/theme-init.js" strategy="beforeInteractive" suppressHydrationWarning />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <QueryProvider>
            {/* Owns `router.refresh()`, which is the only client-side way to
                get a page request through the proxy's /api/auth/check hop. */}
            <SessionRefreshProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </SessionRefreshProvider>
          </QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
