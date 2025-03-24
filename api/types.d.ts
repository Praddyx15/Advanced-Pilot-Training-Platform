declare module 'compression';
declare module 'cors';
declare module 'memorystore';

// Extend Express Session to include user property
declare namespace Express {
  export interface Session {
    user?: any;
  }
}