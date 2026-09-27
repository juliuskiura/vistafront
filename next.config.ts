import type { NextConfig } from "next";
import { NEXT_STATUS } from "./lib/env";
import { API_PROXY_TARGET, BACKEND_URL } from "./lib/env.server";

// Server process environment only. These are deliberately NOT repeated in the
// `env` block below: that block is inlined into the client bundle regardless of
// the variable's name, which is how an internal backend address ended up
// shipped to the browser in the first place.
process.env.API_PROXY_TARGET = API_PROXY_TARGET;
process.env.BACKEND_URL = BACKEND_URL;
process.env.NEXT_PUBLIC_STATUS = NEXT_STATUS;

const nextConfig: NextConfig = {
  // No `env` block on purpose. NEXT_PUBLIC_* is inlined by Next automatically,
  // and the app is single-origin, so the browser needs no injected values.
  //
  // In dev the browser reaches the server through nginx at the public hostname,
  // so Next sees `app.vistasolve.net` as a foreign origin and blocks dev-only
  // resources -- including the HMR websocket -- unless it is allow-listed here.
  // Without this, `wss://app.vistasolve.net/_next/hmr` fails on every reload.
  allowedDevOrigins: ["app.vistasolve.net", "app.vistasolve.com"],
  async rewrites() {
    return [
      {
        source: "/apis/:path*",
        destination: `${API_PROXY_TARGET}/apis/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${API_PROXY_TARGET}/media/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Dev: Django may hand back absolute localhost media URLs.
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
      // Deployed: Django stores absolute media URLs built from APP_DOMAIN, so
      // the optimizer has to be allowed to fetch from the app host too.
      {
        protocol: "https",
        hostname: "app.vistasolve.net",
      },
      {
        protocol: "https",
        hostname: "app.vistasolve.com",
      },
      {
        protocol: "https",
        hostname: "objectstorage.us-ashburn-1.oraclecloud.com",
      },
    ],
  },
};

export default nextConfig;
