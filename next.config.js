/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NODE_ENV === "production" ? "/chrysalis" : "",
  output: "export",
  reactStrictMode: true,
};

module.exports = nextConfig;
