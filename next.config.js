/** @type {import('next').NextConfig} */
const nextConfig = {
    // Use the src directory but keep API routes in pages/api
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    reactStrictMode: true,
    // Ensure API routes work correctly
  }
  
export default nextConfig;