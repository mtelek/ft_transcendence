const allowedDevOrigins = [
  process.env.IP ? process.env.IP : 'localhost',
  'localhost',
  '127.0.0.1',
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