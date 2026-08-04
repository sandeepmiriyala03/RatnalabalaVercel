declare module "next-pwa" {
  import type { NextConfig } from "next";

  type WithPWA = (nextConfig: NextConfig) => NextConfig;

  interface PWAOptions {
    dest?: string;
    sw?: string;
    swSrc?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: any[];
    buildExcludes?: string[];
    publicExcludes?: string[];
    fallbacks?: {
      document?: string;
      image?: string;
      font?: string;
      audio?: string;
      video?: string;
    };
  }

  const withPWA: (options?: PWAOptions) => WithPWA;

  export = withPWA;
}
