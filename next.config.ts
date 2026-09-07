import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/apis/:path*",
        destination: `${process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8000"}/apis/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8000"}/media/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
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
      {
        protocol: "https",
        hostname: "objectstorage.us-ashburn-1.oraclecloud.com",
      },
    ],
  },
};

export default nextConfig;
