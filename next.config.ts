
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.beckman.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.news-medical.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lms.smu.edu.ph',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.sigmaaldrich.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'patho.ch',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
