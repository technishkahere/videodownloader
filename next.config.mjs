/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for Docker / Node hosts (Render, Railway, Fly…).
  output: "standalone",
};

export default nextConfig;
