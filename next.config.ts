import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
module.exports = {
    allowedDevOrigins: ["*"],
}
export const config = {
    runtime: "edge",
};