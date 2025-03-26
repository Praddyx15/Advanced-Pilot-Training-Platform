/**
 * Session Routes
 * 
 * API endpoints for managing training sessions, plans, and tracking.
 * Includes session creation, scheduling, attendance, and progress monitoring.
 */
import { Express, Request, Response } from 'express';
import { 
  trainingSessions,
  insertTrainingSessionSchema,
  sessionAttendees,
  insertSessionAttendeeSchema,
  sessionPlans,
  insertSessionPlanSchema, 
  sessionEvents, 
  insertSessionEventSchema 
} from '@shared/schema';
import { db } from '../db';
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../core/logger';
import { storage } from '../storage';

/**
 * Register session-related routes
 */
export function registerSessionRoutes(app: Express) {
  /**
   * Get all sessions with filter options
   */
  app.get('/api/sessions', async (req: Request, res: Response) => {
    try {
      // Parse query params
      const { instructorId, traineeId, programId, moduleId, status, fromDate, toDate } = req.query;
      
      let sessions;
      
      if (traineeId) {
        // Get sessions for a specific trainee
        sessions = await storage.getSessionsByTrainee(Number(traineeId));
      } else if (instructorId) {
        // Get sessions for a specific instructor
        sessions = await storage.getSessionsByInstructor(Number(instructorId));
      } else {
        // Get all sessions with filters
        sessions = await storage.getAllSessions({
          programId: programId ? Number(programId) : undefined,
          moduleId: moduleId ? Number(moduleId) : undefined,
          status: status as string,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined,
        });
      }
      
      // For each session, get the session plan and attendees
      const enrichedSessions = await Promise.all(sessions.map(async (session) => {
        const sessionPlan = await storage.getSessionPlan(session.id);
        const attendees = await storage.getSessionAttendees(session.id);
        
        return {
          ...session,
          plan: sessionPlan,
          trainees: attendees
        };
      }));
      
      res.json(enrichedSessions);
    } catch (error) {
      logger.error('Error fetching sessions', { context: { error } });
      res.status(500).json({ 
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get a specific session by ID with plan and attendees
   */
  app.get('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Get session plan and attendees
      const sessionPlan = await storage.getSessionPlan(sessionId);
      const attendees = await storage.getSessionAttendees(sessionId);
      
      // Get session events (if any)
      const events = await storage.getSessionEvents(sessionId);
      
      res.json({
        ...session,
        plan: sessionPlan,
        trainees: attendees,
        events: events
      });
    } catch (error) {
      logger.error('Error fetching session', { context: { error, sessionId: req.params.id } });
      res.status(500).json({ 
        error: 'Failed to fetch session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Create a new training session
   */
  app.post('/api/sessions', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const sessionData = insertTrainingSessionSchema.parse(req.body);
      
      // Create the session
      const session = await storage.createSession(sessionData);
      
      // If trainees were provided, add them to the session
      if (req.body.trainees && Array.isArray(req.body.trainees)) {
        await Promise.all(req.body.trainees.map(async (traineeId: number) => {
          await storage.addTraineeToSession({
            sessionId: session.id,
            traineeId: traineeId,
            status: 'scheduled',
            present: false
          });
        }));
      }
      
      // If session plan data was provided, create it
      if (req.body.plan) {
        const planData = {
          sessionId: session.id,
          previousSessionId: req.body.plan.previousSessionId,
          previousTopicsCovered: req.body.plan.previousTopicsCovered || [],
          currentTopics: req.body.plan.currentTopics || [],
          nextTopics: req.body.plan.nextTopics || [],
          notes: req.body.plan.notes,
          resources: req.body.plan.resources || [],
          progressIndicators: req.body.plan.progressIndicators || {}
        };
        
        await storage.createSessionPlan(planData);
      }
      
      res.status(201).json(session);
    } catch (error) {
      logger.error('Error creating session', { context: { error, body: req.body } });
      res.status(400).json({ 
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Update an existing session
   */
  app.put('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Check if session exists
      const existingSession = await storage.getSession(sessionId);
      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Update the session
      const sessionData = req.body;
      const updatedSession = await storage.updateSession(sessionId, sessionData);
      
      // Update session plan if provided
      if (req.body.plan) {
        const existingPlan = await storage.getSessionPlan(sessionId);
        
        if (existingPlan) {
          await storage.updateSessionPlan(existingPlan.id, req.body.plan);
        } else {
          await storage.createSessionPlan({
            ...req.body.plan,
            sessionId: sessionId
          });
        }
      }
      
      // Update trainees if provided
      if (req.body.trainees && Array.isArray(req.body.trainees)) {
        const currentAttendees = await storage.getSessionAttendees(sessionId);
        const currentAttendeeIds = currentAttendees.map(a => a.traineeId);
        
        // Add new trainees
        const newTraineeIds = req.body.trainees.filter(id => !currentAttendeeIds.includes(id));
        for (const traineeId of newTraineeIds) {
          await storage.addTraineeToSession({
            sessionId: sessionId,
            traineeId: traineeId,
            status: 'scheduled',
            present: false
          });
        }
        
        // Remove trainees who are no longer included
        const removedTraineeIds = currentAttendeeIds.filter(id => !req.body.trainees.includes(id));
        for (const traineeId of removedTraineeIds) {
          await storage.removeTraineeFromSession(sessionId, traineeId);
        }
      }
      
      res.json(updatedSession);
    } catch (error) {
      logger.error('Error updating session', { context: { error, sessionId: req.params.id, body: req.body } });
      res.status(400).json({ 
        error: 'Failed to update session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Delete a session
   */
  app.delete('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Check if session exists
      const existingSession = await storage.getSession(sessionId);
      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Delete the session
      const deleted = await storage.deleteSession(sessionId);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: 'Failed to delete session' });
      }
    } catch (error) {
      logger.error('Error deleting session', { context: { error, sessionId: req.params.id } });
      res.status(500).json({ 
        error: 'Failed to delete session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get all sessions for the current user (trainee or instructor)
   */
  app.get('/api/my-sessions', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      const userRole = req.user.role;
      
      let sessions;
      
      if (userRole === 'trainee' || userRole === 'student') {
        // Get sessions where the user is a trainee
        sessions = await storage.getSessionsByTrainee(userId);
      } else if (userRole === 'instructor' || userRole === 'examiner') {
        // Get sessions where the user is the instructor
        sessions = await storage.getSessionsByInstructor(userId);
      } else {
        // For other roles (admin, etc.), get all sessions
        sessions = await storage.getAllSessions();
      }
      
      // Sort sessions by date, with upcoming sessions first
      sessions.sort((a, b) => {
        const aDate = new Date(a.startTime);
        const bDate = new Date(b.startTime);
        return aDate.getTime() - bDate.getTime();
      });
      
      // Split sessions into upcoming and past
      const now = new Date();
      const upcomingSessions = sessions.filter(s => new Date(s.startTime) >= now);
      const pastSessions = sessions.filter(s => new Date(s.startTime) < now);
      
      // For each session, get the session plan and attendees
      const enrichUpcomingSessions = await Promise.all(upcomingSessions.map(async (session) => {
        const sessionPlan = await storage.getSessionPlan(session.id);
        const attendees = await storage.getSessionAttendees(session.id);
        
        return {
          ...session,
          plan: sessionPlan,
          trainees: attendees
        };
      }));
      
      const enrichPastSessions = await Promise.all(pastSessions.map(async (session) => {
        const sessionPlan = await storage.getSessionPlan(session.id);
        const attendees = await storage.getSessionAttendees(session.id);
        
        return {
          ...session,
          plan: sessionPlan,
          trainees: attendees
        };
      }));
      
      res.json({
        upcoming: enrichUpcomingSessions,
        past: enrichPastSessions
      });
    } catch (error) {
      logger.error('Error fetching user sessions', { context: { error, userId: req.user?.id } });
      res.status(500).json({ 
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Mark attendance for a session
   */
  app.post('/api/sessions/:id/attendance', async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Validate request body
      const attendanceSchema = z.object({
        trainees: z.array(z.object({
          traineeId: z.number(),
          present: z.boolean(),
          notes: z.string().optional()
        }))
      });
      
      const { trainees } = attendanceSchema.parse(req.body);
      
      // Update attendance for each trainee
      for (const trainee of trainees) {
        await storage.updateSessionAttendance(sessionId, trainee.traineeId, {
          present: trainee.present,
          notes: trainee.notes
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Error updating attendance', { context: { error, sessionId: req.params.id, body: req.body } });
      res.status(400).json({ 
        error: 'Failed to update attendance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Create or update session plan
   */
  app.post('/api/sessions/:id/plan', async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Check if session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Check if plan already exists
      const existingPlan = await storage.getSessionPlan(sessionId);
      
      let plan;
      
      if (existingPlan) {
        // Update existing plan
        plan = await storage.updateSessionPlan(existingPlan.id, req.body);
      } else {
        // Create new plan
        plan = await storage.createSessionPlan({
          ...req.body,
          sessionId: sessionId
        });
      }
      
      res.json(plan);
    } catch (error) {
      logger.error('Error updating session plan', { context: { error, sessionId: req.params.id, body: req.body } });
      res.status(400).json({ 
        error: 'Failed to update session plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Generate session plan from previous sessions and document analysis
   */
  app.post('/api/sessions/:id/generate-plan', async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Check if session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Parse request body
      const generatePlanSchema = z.object({
        documentIds: z.array(z.number()).optional(),
        previousSessionId: z.number().optional(),
        analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed')
      });
      
      const { documentIds, previousSessionId, analysisDepth } = generatePlanSchema.parse(req.body);
      
      // Generate plan using document analysis and previous session data
      const generatedPlan = await storage.generateSessionPlan({
        sessionId,
        documentIds,
        previousSessionId,
        analysisDepth
      });
      
      res.json(generatedPlan);
    } catch (error) {
      logger.error('Error generating session plan', { context: { error, sessionId: req.params.id, body: req.body } });
      res.status(500).json({ 
        error: 'Failed to generate session plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Add event to session (for tracking progress during a session)
   */
  app.post('/api/sessions/:id/events', async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Check if session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Validate event data
      const eventSchema = z.object({
        type: z.string(),
        description: z.string(),
        timestamp: z.string().optional(),
        data: z.any().optional()
      });
      
      const eventData = eventSchema.parse(req.body);
      
      // Add event to session
      const event = await storage.addSessionEvent({
        sessionId,
        type: eventData.type,
        description: eventData.description,
        timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
        data: eventData.data
      });
      
      res.status(201).json(event);
    } catch (error) {
      logger.error('Error adding session event', { context: { error, sessionId: req.params.id, body: req.body } });
      res.status(400).json({ 
        error: 'Failed to add session event',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get upcoming sessions calendar
   */
  app.get('/api/sessions/calendar', async (req: Request, res: Response) => {
    try {
      const { start, end, traineeId, instructorId } = req.query;
      
      // Parse date range
      const startDate = start ? new Date(start as string) : new Date();
      let endDate: Date;
      
      if (end) {
        endDate = new Date(end as string);
      } else {
        // Default to 30 days from start if no end date provided
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
      }
      
      // Get sessions for the date range
      let sessions;
      
      if (traineeId) {
        // Get sessions for a specific trainee
        sessions = await storage.getTraineeSessionsInDateRange(
          Number(traineeId), 
          startDate, 
          endDate
        );
      } else if (instructorId) {
        // Get sessions for a specific instructor
        sessions = await storage.getInstructorSessionsInDateRange(
          Number(instructorId),
          startDate,
          endDate
        );
      } else {
        // Get all sessions in date range
        sessions = await storage.getSessionsInDateRange(startDate, endDate);
      }
      
      // Format for calendar display
      const calendarEvents = sessions.map(session => ({
        id: session.id,
        title: session.title || `Session #${session.id}`,
        start: session.startTime,
        end: session.endTime,
        programId: session.programId,
        moduleId: session.moduleId,
        instructorId: session.instructorId,
        location: session.location,
        status: session.status
      }));
      
      res.json(calendarEvents);
    } catch (error) {
      logger.error('Error fetching session calendar', { context: { error, query: req.query } });
      res.status(500).json({ 
        error: 'Failed to fetch session calendar',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}