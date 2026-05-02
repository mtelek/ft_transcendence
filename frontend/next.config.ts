const allowedDevOrigins = [
  process.env.IP ? process.env.IP : 'localhost',
  '0.0.0.0',
];

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

module.exports = nextConfig;