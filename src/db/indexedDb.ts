import { ActivityRecord, ActivityType } from '../types';

const DB_NAME = 'HypeAtheDB';
const DB_VERSION = 1;
const STORE_NAME = 'activities';

let dbInstance: IDBDatabase | null = null;

/**
 * Opens or initializes the HypeAtheDB IndexedDB database.
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('activityType', 'activityType', { unique: false });
        store.createIndex('startTimestamp', 'startTimestamp', { unique: false });
        store.createIndex('distanceKm', 'distanceKm', { unique: false });
        store.createIndex('creationTimestamp', 'creationTimestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      const err = (event.target as IDBOpenDBRequest).error;
      reject(err || new Error('Failed to open HypeAtheDB'));
    };
  });
}

/**
 * Saves or updates an activity record in HypeAtheDB.
 */
export async function saveActivityToDb(record: ActivityRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const request = store.put(record);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        const err = (event.target as IDBRequest).error;
        reject(err || new Error('Failed to save activity to HypeAtheDB'));
      };

      tx.onabort = () => {
        reject(new Error('Transaction aborted while saving activity'));
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Identifies whether an activity record is a fabricated demo/sample record.
 */
export function isIdentifiableDemoRecord(record: ActivityRecord): boolean {
  if (!record || !record.id) return false;
  // Identifiable demo IDs from past seeding
  if (record.id.startsWith('act_seed_') || record.id.startsWith('act-')) {
    return true;
  }
  // Title matches seed presets exactly
  const seedTitles = [
    'Morning Park Loop',
    'Riverway Speed Loop',
    'Brisk Evening Stroll',
    'Ridge Ascent Trek',
    'Interval Sprint Series',
    'City Commute & Cruise',
    'Morning Run',
    'Sunset Trail Tempo',
    'Easy Recovery Jog',
    'Weekend Long Distance'
  ];
  if (seedTitles.includes(record.title) && (record.id.startsWith('act_seed_') || record.id.startsWith('act-'))) {
    return true;
  }
  return false;
}

/**
 * Retrieves all genuine user activities from HypeAtheDB, sorted by startTimestamp descending.
 * Automatically purges any identifiable sample/demo records while strictly preserving genuine records.
 */
export async function getAllActivitiesFromDb(): Promise<ActivityRecord[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawResults = (request.result || []) as ActivityRecord[];
        const genuineRecords: ActivityRecord[] = [];

        // Identify and purge any sample/demo records from database to prevent data contamination
        for (const item of rawResults) {
          if (isIdentifiableDemoRecord(item)) {
            // Delete the sample record from storage
            try {
              store.delete(item.id);
            } catch (delErr) {
              console.warn('Could not delete demo record', item.id, delErr);
            }
          } else {
            genuineRecords.push(item);
          }
        }

        // Sort newest first
        genuineRecords.sort((a, b) => ((b.startTimestamp || b.creationTimestamp || 0) - (a.startTimestamp || a.creationTimestamp || 0)));
        resolve(genuineRecords);
      };

      request.onerror = (event) => {
        const err = (event.target as IDBRequest).error;
        reject(err || new Error('Failed to fetch activities from HypeAtheDB'));
      };
    } catch (e) {
      reject(e);
    }
  });
}


/**
 * Retrieves an individual activity by ID.
 */
export async function getActivityByIdFromDb(id: string): Promise<ActivityRecord | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        const err = (event.target as IDBRequest).error;
        reject(err || new Error(`Failed to get activity ${id}`));
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Deletes an activity record from HypeAtheDB.
 */
export async function deleteActivityFromDb(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        const err = (event.target as IDBRequest).error;
        reject(err || new Error(`Failed to delete activity ${id}`));
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Deletes all activity records from HypeAtheDB (clears workout history).
 */
export async function clearAllActivitiesInDb(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        const err = (event.target as IDBRequest).error;
        reject(err || new Error('Failed to clear activities in HypeAtheDB'));
      };
    } catch (e) {
      reject(e);
    }
  });
}


// Note: Demo seeding into the primary database is strictly removed to preserve 100% genuine data integrity.
// Real user workouts recorded via LiveRun are the sole source of truth in HypeAtheDB.
