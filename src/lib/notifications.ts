
"use client"

import { db, Schedule } from './db';
import { format, isToday, parse } from 'date-fns';

/**
 * @fileOverview Clinical Notification Engine
 * Handles permission requests and local notification triggers for study protocols.
 */

export class NotificationEngine {
  private static lastNotifiedId: string | null = null;

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static async checkSchedules() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const schedules = await db.getAll<Schedule>('schedules');
    const now = new Date();
    const currentHHMM = format(now, 'HH:mm');
    const todayDay = format(now, 'EEEE'); // e.g. "Monday"
    const todayDate = format(now, 'yyyy-MM-dd');

    const imminentProtocol = schedules.find(s => {
      // Check if it's the right day
      const isDueToday = s.type === 'class' 
        ? s.dayOfWeek === todayDay 
        : s.date === todayDate;

      // Trigger exactly at start time or within 1 minute
      return isDueToday && s.startTime === currentHHMM && s.id !== this.lastNotifiedId;
    });

    if (imminentProtocol) {
      this.trigger(imminentProtocol);
    }
  }

  private static trigger(protocol: Schedule) {
    this.lastNotifiedId = protocol.id;
    
    const title = `PROTOCOL IMMINENT: ${protocol.title}`;
    const options = {
      body: `Analytical session scheduled for ${protocol.startTime}. Prepare laboratory instruments.`,
      icon: '/icon', // Path to your app icon
      badge: '/icon',
      tag: 'titrate-schedule',
      renotify: true
    };

    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
}
