import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy API calls to the same-origin /apis path onto the Django backend in
    // dev, mirroring the Vite dev proxy from frontapp. In production, Django
    // serves both the app and /apis on the same origin.
    return [
      {
        source: "/apis/:path*",
        destination: `${process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8000"}/apis/:path*`,
      },
    ];
  },
};

export default nextConfig;
