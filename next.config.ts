import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prefer this app as tracing root when a parent folder also has a lockfile.
  outputFileTracingRoot: path.join(process.cwd()),
  /**
   * Dev-only: allow `_next` / HMR when the browser origin is not localhost (e.g. phone on LAN).
   * Comma-separated hostnames or IPs — see `.env.example` for `NEXT_ALLOWED_DEV_ORIGINS`.
   */
  allowedDevOrigins: process.env.NEXT_ALLOWED_DEV_ORIGINS
    ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [],
};

export default nextConfig;
