import type { NextConfig } from "next";
import path from "path";

// Silence Turbopack workspace-root warning by explicitly setting the root to the
// monorepo root (the folder that contains the top-level package-lock.json).

const nextConfig: NextConfig = {
  turbopack: {
    // Resolve to the repository root (one level above the frontend app)
    root: path.join(__dirname, ".."),
  },
  
  // Configure headers to allow OAuth popup authentication
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
