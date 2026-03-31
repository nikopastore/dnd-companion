import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dnd-companion/database", "@dnd-companion/shared"],
};

export default nextConfig;
