import type { NextConfig } from "next";
import path from "path";

// Silence Turbopack workspace-root warning by explicitly setting the root to the
// monorepo root (the folder that contains the top-level package-lock.json).
// This doesn't change build output; it only avoids confusing warnings.
const nextConfig: NextConfig = {
  turbopack: {
    // Resolve to the repository root (one level above the frontend app)
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
