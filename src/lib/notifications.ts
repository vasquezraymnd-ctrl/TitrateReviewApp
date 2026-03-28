
"use client"

import { db, Schedule } from './db';
import { format } from 'date-fns';

/**
 * @fileOverview Clinical Notification Engine
 * Handles permission requests and local notification triggers for study protocols.
 * Optimized for mobile/native shell reliability using Service Worker and Native Bridge detection.
 */

export class NotificationEngine {
  private static lastNotifiedId: string | null = null;

  /**
   * Triggers the system-level permission prompt.
   * Prioritizes native app bridge commands for "App Shell" environments.
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // 1. Detect Native App Bridge (Median / GoNative)
    // This is critical for apps running in a native shell where standard Web APIs are restricted.
    const bridge = (window as any).median || (window as any).gonative;
    if (bridge) {
      try {
        if (bridge.notifications && bridge.notifications.requestPermission) {
          bridge.notifications.requestPermission();
          return true; // We assume true as the bridge handles the async prompt
        }
      } catch (e) {
        console.error("Native bridge notification request failed:", e);
      }
      
      // Fallback to deep-link command for native wrappers
      window.location.href = "gonative://notifications/requestPermission";
      return true;
    }

    // 2. Standard Web API
    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') {
        console.warn("Notification permission is permanently denied in browser settings.");
        return false;
      }

      try {
        // Modern Promise-based request
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (e) {
        // Legacy Callback-based request (used in some mobile WebViews)
        return new Promise((resolve) => {
          Notification.requestPermission((p) => resolve(p === 'granted'));
        });
      }
    }

    return false;
  }

  static async checkSchedules() {
    if (typeof window === 'undefined') return;
    
    // Safety check for permission state
    const hasPermission = 'Notification' in window && Notification.permission === 'granted';
    if (!hasPermission) return;

    const schedules = await db.getAll<Schedule>('schedules');
    const now = new Date();
    const currentHHMM = format(now, 'HH:mm');
    const todayDay = format(now, 'EEEE'); 
    const todayDate = format(now, 'yyyy-MM-dd');

    const imminentProtocol = schedules.find(s => {
      const isDueToday = s.type === 'class' 
        ? s.dayOfWeek === todayDay 
        : s.date === todayDate;

      return isDueToday && s.startTime === currentHHMM && s.id !== this.lastNotifiedId;
    });

    if (imminentProtocol) {
      this.trigger(imminentProtocol);
    }
  }

  private static async trigger(protocol: Schedule) {
    this.lastNotifiedId = protocol.id;
    
    const title = `PROTOCOL IMMINENT: ${protocol.title}`;
    const options: NotificationOptions = {
      body: `Analytical session scheduled for ${protocol.startTime}. Prepare laboratory instruments.`,
      icon: '/icon',
      badge: '/icon',
      tag: 'titrate-schedule',
      renotify: true,
      vibrate: [200, 100, 200]
    };

    // Use Service Worker for background reliability
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, options);
      } catch (e) {
        new Notification(title, options);
      }
    } else {
      new Notification(title, options);
    }
  }
}
