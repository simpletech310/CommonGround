import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.daily.co",  // Next.js + Daily.co SDK
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",  // Tailwind + Google Fonts
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",  // Google Fonts
      "connect-src 'self' http://localhost:8000 ws://localhost:8000 wss://*.daily.co https://*.daily.co https://commonground-api-gdxg.onrender.com https://*.onrender.com",  // Backend API + Daily.co
      "frame-src 'self' https://*.daily.co",  // Allow Daily.co video iframe
      "media-src 'self' https://*.daily.co blob:",  // Allow media from Daily.co
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self "https://*.daily.co"), microphone=(self "https://*.daily.co"), geolocation=()'  // Allow camera/mic for Daily.co
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
