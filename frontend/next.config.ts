const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

const allowedDevOrigins = [env?.IP ?? "localhost"];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  allowedDevOrigins,
};

export default nextConfig;