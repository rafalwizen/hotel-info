import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A package-lock.json exists in the parent folder (D:\projekty); pin the
  // Turbopack root to this repo so it does not leak into builds.
  turbopack: {
    root: path.dirname(__dirname) || process.cwd(),
  },
};

export default nextConfig;
