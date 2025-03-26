/**
 * Route module exports
 * 
 * This file exports all route registration functions from individual route modules
 */

// Export route registration functions
export { registerDocumentRoutes } from './document-routes';
export { registerSessionRoutes } from './session-routes';

// The following route registrations would be implemented in future files
export function registerSyllabusRoutes(app: any) {}
export function registerKnowledgeGraphRoutes(app: any) {}
export function registerTrainingRoutes(app: any) {}
export function registerAssessmentRoutes(app: any) {}
export function registerResourceRoutes(app: any) {}
export function registerNotificationRoutes(app: any) {}
export function registerFlightRecordRoutes(app: any) {}
export function registerAchievementRoutes(app: any) {}
export function registerOcrRoutes(app: any) {}
export function registerDocumentAnalysisRoutes(app: any) {}
export function registerScheduleRoutes(app: any) {}
export function setupThemeRoutes(app: any) {}