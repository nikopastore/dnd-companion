import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@dnd-companion/database", "@dnd-companion/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
