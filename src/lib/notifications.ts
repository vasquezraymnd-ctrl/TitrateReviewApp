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
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Detect Native App Bridge (Median / GoNative)
    const bridge = (window as any).median || (window as any).gonative;
    if (bridge) {
      try {
        if (bridge.notifications && bridge.notifications.requestPermission) {
          bridge.notifications.requestPermission();
          return true;
        }
      } catch (e) {
        console.error("Native bridge notification request failed:", e);
      }
      window.location.href = "gonative://notifications/requestPermission";
      return true;
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (e) {
        return new Promise((resolve) => {
          Notification.requestPermission((p) => resolve(p === 'granted'));
        });
      }
    }

    return false;
  }

  static async checkSchedules() {
    if (typeof window === 'undefined') return;
    
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
    const body = `Analytical session scheduled for ${protocol.startTime}. Prepare laboratory instruments.`;
    
    // 1. Prioritize Native Bridge for Mobile Shell Tray
    const bridge = (window as any).median || (window as any).gonative;
    if (bridge && bridge.notifications && bridge.notifications.create) {
      bridge.notifications.create({
        title: title,
        text: body,
        id: protocol.id
      });
      return;
    }

    // 2. Fallback to Service Worker / Web API
    const options: NotificationOptions = {
      body: body,
      icon: '/icon',
      badge: '/icon',
      tag: 'titrate-schedule',
      renotify: true,
      vibrate: [200, 100, 200]
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, options);
      } catch (e) {
        new Notification(title, options);
      }
    } else if ('Notification' in window) {
      new Notification(title, options);
    }
  }
}
