import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/v1/:path*` : "http://backend:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
