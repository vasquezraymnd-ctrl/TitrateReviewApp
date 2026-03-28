"use client"

import { useEffect } from 'react'

/**
 * @fileOverview PWA Initialization
 * Registers the TITRATE Service Worker to enable offline laboratory access.
 */

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('TITRATE SW Registered: ', registration.scope);
          })
          .catch((registrationError) => {
            console.log('TITRATE SW Registration Failed: ', registrationError);
          });
      });
    }
  }, []);

  return null;
}
