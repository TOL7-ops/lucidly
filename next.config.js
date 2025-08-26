import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support for existing Vite-style imports
  transpilePackages: [],
  // Custom webpack config for compatibility
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), './src'),
    };
    return config;
  },
}

export default nextConfig 