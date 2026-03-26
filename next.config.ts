import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.beckman.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.news-medical.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lms.smu.edu.ph',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.sigmaaldrich.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'patho.ch',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
