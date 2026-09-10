import type { NextConfig } from "next";
import {
  API_PROXY_TARGET,
  BACKEND_URL,
  NEXT_STATUS,
  PUBLIC_BACKEND_URL,
} from "./lib/env";

process.env.API_PROXY_TARGET = API_PROXY_TARGET;
process.env.BACKEND_URL = BACKEND_URL;
process.env.NEXT_PUBLIC_BACKEND_URL = PUBLIC_BACKEND_URL;
process.env.NEXT_PUBLIC_STATUS = NEXT_STATUS;

const nextConfig: NextConfig = {
  env: {
    API_PROXY_TARGET,
    BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_STATUS: NEXT_STATUS,
  },
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