import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A package-lock.json exists in the parent folder (D:\projekty); pin the
  // Turbopack root to this repo so it does not leak into builds. Must be
  // __dirname itself (the repo) — dirname(__dirname) points at the parent,
  // which on Vercel (/vercel/path0) resolves to "/" and breaks externals.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
