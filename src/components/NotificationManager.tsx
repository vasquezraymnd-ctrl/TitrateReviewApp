
"use client"

import { useEffect } from 'react';
import { NotificationEngine } from '@/lib/notifications';

/**
 * @fileOverview Background Monitoring Component
 * Periodically checks the laboratory archives for imminent scheduled protocols.
 */

export function NotificationManager() {
  useEffect(() => {
    // Initial check on mount
    NotificationEngine.checkSchedules();

    // Check every 60 seconds for imminent protocols
    const interval = setInterval(() => {
      NotificationEngine.checkSchedules();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
