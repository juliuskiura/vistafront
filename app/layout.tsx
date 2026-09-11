import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import { SidebarProvider, ToastProvider } from "@/lib/context";
import { QueryProvider } from "@/lib/tanstack/query-provider";
import { getAuthUser } from "@/lib/auth/server";
import { ChatWidget } from "@/components/workspace/chat-widget";
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
  const user = await getAuthUser();
  const userName =
    user && user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : null;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <ToastProvider>
          <QueryProvider>
            <SidebarProvider>{children}</SidebarProvider>
            {!user?.is_admin && (
              <ChatWidget
                userName={userName}
                isAuthenticated={!!user}
              />
            )}
          </QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
