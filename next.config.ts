import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Server external packages for better performance
  serverExternalPackages: ["@supabase/supabase-js"],

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "recharts",
    ],
    optimizeCss: true,
    webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB"],
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
    unoptimized: false,
  },

  // Bundle analyzer for debugging
  webpack: (config, { dev, isServer }) => {
    // Reduce bundle size in production
    if (!dev && !isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };

      // Safely configure minimizer to drop console logs
      if (
        config.optimization.minimizer &&
        config.optimization.minimizer.length > 0
      ) {
        const minimizer = config.optimization.minimizer[0];

        // Check if it's a TerserPlugin or similar
        if (minimizer && minimizer.options && minimizer.options.minimizer) {
          const options = minimizer.options.minimizer.options;
          if (options && typeof options === "object") {
            minimizer.options.minimizer.options = {
              ...options,
              compress: {
                ...(options.compress || {}),
                drop_console: true,
                drop_debugger: true,
              },
            };
          }
        }
        // Alternative approach for different minimizer structures
        else if (
          minimizer &&
          minimizer.options &&
          minimizer.options.terserOptions
        ) {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              ...(minimizer.options.terserOptions.compress || {}),
              drop_console: true,
              drop_debugger: true,
            },
          };
        }
      }
    }

    return config;
  },
};

export default nextConfig;
