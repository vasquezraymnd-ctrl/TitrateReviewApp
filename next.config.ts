import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'media.beckman.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'www.news-medical.net',
      },
      {
        protocol: 'https',
        hostname: 'lms.smu.edu.ph',
      },
      {
        protocol: 'https',
        hostname: 'www.sigmaaldrich.com',
      },
      {
        protocol: 'https',
        hostname: 'patho.ch',
      },
    ],
  },
};

export default nextConfig;
