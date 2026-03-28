
"use client"

import { db, Schedule } from './db';
import { format } from 'date-fns';

/**
 * @fileOverview Clinical Notification Engine
 * Handles permission requests and local notification triggers for study protocols.
 * Optimized for mobile/native shell reliability using Service Worker registration.
 */

export class NotificationEngine {
  private static lastNotifiedId: string | null = null;

  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static async checkSchedules() {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const schedules = await db.getAll<Schedule>('schedules');
    const now = new Date();
    const currentHHMM = format(now, 'HH:mm');
    const todayDay = format(now, 'EEEE'); // e.g. "Monday"
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

    if (Notification.permission === 'granted') {
      // Use Service Worker registration for firing if available (more reliable for background/native)
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, options);
        } catch (e) {
          // Fallback to standard constructor if SW fails
          new Notification(title, options);
        }
      } else {
        new Notification(title, options);
      }
    }
  }
}
