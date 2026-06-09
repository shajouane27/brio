import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Augmente la limite pour les Server Actions (protection supplémentaire)
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
