import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow both localhost and 127.0.0.1 during local development
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
