import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep framework development tools out of the operator dashboard.
  devIndicators: false,
};

export default nextConfig;
