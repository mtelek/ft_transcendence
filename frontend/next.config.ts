const allowedDevOrigins = [
  process.env.IP ? process.env.IP : 'localhost'
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