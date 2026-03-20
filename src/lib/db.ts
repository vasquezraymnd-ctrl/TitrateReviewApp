import { z } from 'zod';

const DB_NAME = 'TITRATE_DB';
const DB_VERSION = 5;

export interface Question {
  id: string;
  subject: string;
  question: string;
  choices: { id: string; text: string }[];
  answerId: string;
  rationale: string;
  tags: string[];
}

export interface Progress {
  questionId: string;
  interval: number;
  repetition: number;
  easeFactor: number;
  nextDueDate: number;
}

export interface UserProfile {
  id: string;
  name: string;
  proficiencyRank: string;
  examDate: string;
  currentStreak: number;
  lastActivityDate?: string; // YYYY-MM-DD
}

export type ScheduleType = 'class' | 'exam' | 'study';

export interface Schedule {
  id: string;
  type: ScheduleType;
  title: string;
  dayOfWeek?: string;
  date?: string;
  startTime: string;
  endTime: string;
  completed?: boolean;
}

export interface LabModule {
  id: string;
  name: string;
  subject: string;
  imageKey: string;
  mastery: number; // 0-100 percentage based on "pages read"
  pdfBlob?: Blob;
  extractedText?: string;
}

export const CORE_SUBJECTS = [
  'Microbiology',
  'Hematology',
  'Clinical Chemistry',
  'Immuno-Serology',
  'Clinical Microscopy',
  'HTMLE'
] as const;

export class TitrateDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('questions')) {
          db.createObjectStore('questions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'questionId' });
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('modules')) {
          db.createObjectStore('modules', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async bulkPut(storeName: string, items: any[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new TitrateDB();
