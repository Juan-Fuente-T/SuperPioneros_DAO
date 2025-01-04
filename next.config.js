/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  experimental: {
    reactCompiler: false, // Desactiva el compilador experimental
  },
};

module.exports = nextConfig;