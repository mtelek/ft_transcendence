import type { NextConfig } from "next";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

const allowedDevOrigins = [env?.IP ?? "localhost"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  allowedDevOrigins,
  async headers() {
    return [
      {
        source: "/avatars/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; img-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;