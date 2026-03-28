import { z } from 'zod';

const DB_NAME = 'TITRATE_DB';
const DB_VERSION = 8; // Incremented to fix missing indices

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

export interface Annotation {
  id: string;
  moduleId?: string; // If drawn on PDF
  notebookId?: string; // If drawn on Notebook
  pageNumber: number;
  tool: 'pencil' | 'highlighter' | 'eraser' | 'laser' | 'lasso';
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
}

export interface WorkspaceClip {
  id: string;
  sourceModuleId: string;
  sourceModuleName: string;
  pageNumber: number;
  rect: { x: number; y: number; w: number; h: number };
  dataUrl: string; // The captured image fragment
  notebookId: string;
  x: number; // Position in notebook page
  y: number;
}

export interface Notebook {
  id: string;
  title: string;
  lastModified: number;
}

export interface ToolPreset {
  id: string;
  type: 'pencil' | 'highlighter';
  color: string;
  width: number;
  opacity: number;
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
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        
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
        
        // Robust handling for annotations store and indices
        let annStore;
        if (!db.objectStoreNames.contains('annotations')) {
          annStore = db.createObjectStore('annotations', { keyPath: 'id' });
        } else {
          annStore = transaction!.objectStore('annotations');
        }
        
        if (!annStore.indexNames.contains('by_module_page')) {
          annStore.createIndex('by_module_page', ['moduleId', 'pageNumber'], { unique: false });
        }
        if (!annStore.indexNames.contains('by_notebook_page')) {
          annStore.createIndex('by_notebook_page', ['notebookId', 'pageNumber'], { unique: false });
        }

        if (!db.objectStoreNames.contains('notebooks')) {
          db.createObjectStore('notebooks', { keyPath: 'id' });
        }

        // Robust handling for clips store and indices
        let clipStore;
        if (!db.objectStoreNames.contains('clips')) {
          clipStore = db.createObjectStore('clips', { keyPath: 'id' });
        } else {
          clipStore = transaction!.objectStore('clips');
        }
        
        if (!clipStore.indexNames.contains('by_notebook')) {
          clipStore.createIndex('by_notebook', 'notebookId', { unique: false });
        }

        if (!db.objectStoreNames.contains('presets')) {
          db.createObjectStore('presets', { keyPath: 'id' });
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

  async getAnnotations(moduleId: string, pageNumber: number): Promise<Annotation[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('annotations', 'readonly');
      const store = transaction.objectStore('annotations');
      const index = store.index('by_module_page');
      const request = index.getAll(IDBKeyRange.only([moduleId, pageNumber]));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getNotebookAnnotations(notebookId: string, pageNumber: number): Promise<Annotation[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('annotations', 'readonly');
      const store = transaction.objectStore('annotations');
      const index = store.index('by_notebook_page');
      const request = index.getAll(IDBKeyRange.only([notebookId, pageNumber]));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getNotebookClips(notebookId: string): Promise<WorkspaceClip[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('clips', 'readonly');
      const store = transaction.objectStore('clips');
      const index = store.index('by_notebook');
      const request = index.getAll(IDBKeyRange.only(notebookId));
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
