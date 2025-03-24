/**
 * Type declarations for build-time utilities
 * These declarations help TypeScript handle type errors during build
 */

// Extend the Record type to include any properties
declare namespace NodeJS {
  interface Global {
    createInsertSchema: any;
  }
}

// Declare optional properties for database models
declare namespace DatabaseModels {
  interface HasExtraProperties {
    [key: string]: any;
  }
  
  // Allow createdAt/updatedAt on any object
  interface HasTimestamps {
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  // Allow special fields for notifications
  interface HasNotificationProperties {
    userId?: number;
    recipientId?: number;
  }
  
  // Allow metadata on any object
  interface HasMetadata {
    metadata?: any;
  }
  
  // Allow fields for handling achievements
  interface HasAchievementProperties {
    progress?: number;
    grantedById?: number;
    notes?: string;
    criteria?: any;
    startDate?: Date;
    endDate?: Date;
    imageUrl?: string;
    awardedAt?: Date;
  }
}

// Special declaration for Set iteration
interface Set<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

// Special declaration for Map iteration
interface Map<K, V> {
  [Symbol.iterator](): IterableIterator<[K, V]>;
}