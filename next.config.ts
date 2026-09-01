import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@noirly-dev/realtime-client",
    "@noirly-dev/realtime-shared",
    "@noirly-dev/ui",
  ],
  serverExternalPackages: ["@react-pdf/renderer", "nodemailer"],
};

export default nextConfig;
