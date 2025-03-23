import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { logger } from '../core/logger';
import { 
  insertAssessmentSchema,
  insertGradeSchema,
  Assessment,
  Grade
} from '@shared/schema';

/**
 * Register assessment-related routes
 */
export function registerAssessmentRoutes(app: Express) {
  // Protected routes that require authentication
  app.use('/api/protected', (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });

  /**
   * Get all assessments
   */
  app.get('/api/protected/assessments', async (req: Request, res: Response) => {
    try {
      // Filter based on user role
      let assessments: Assessment[] = [];
      
      if (req.user.role === 'admin' || req.user.role === 'examiner') {
        // Admins and examiners can see all assessments
        assessments = await storage.getAllAssessments();
      } else if (req.user.role === 'instructor') {
        // Instructors see assessments they created
        assessments = await storage.getAssessmentsByInstructor(req.user.id);
      } else {
        // Trainees see assessments for them
        assessments = await storage.getAssessmentsByTrainee(req.user.id);
      }
      
      res.json(assessments);
    } catch (error) {
      logger.error('Error fetching assessments', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch assessments' });
    }
  });

  /**
   * Create assessment
   */
  app.post('/api/protected/assessments', async (req: Request, res: Response) => {
    try {
      // Validate that user is an instructor or examiner
      if (req.user.role !== 'instructor' && req.user.role !== 'examiner' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied. Only instructors and examiners can create assessments.' });
      }
      
      // Validate assessment data
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        assessorId: req.user.id,
      });
      
      // Create assessment
      const assessment = await storage.createAssessment(assessmentData);
      
      // If grades are provided, add them
      if (req.body.grades && Array.isArray(req.body.grades)) {
        for (const gradeData of req.body.grades) {
          await storage.createGrade({
            ...gradeData,
            assessmentId: assessment.id,
            evaluatorId: req.user.id,
          });
        }
      }
      
      res.status(201).json(assessment);
    } catch (error) {
      logger.error('Error creating assessment', { context: { error } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid assessment data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to create assessment' });
    }
  });

  /**
   * Get assessment by ID
   */
  app.get('/api/protected/assessments/:id', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // Check permissions based on role
      if (req.user.role !== 'admin' &&
          req.user.role !== 'examiner' &&
          assessment.assessorId !== req.user.id &&
          assessment.traineeId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get grades for this assessment
      const grades = await storage.getGradesByAssessment(assessmentId);
      
      res.json({
        ...assessment,
        grades,
      });
    } catch (error) {
      logger.error('Error fetching assessment', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch assessment' });
    }
  });

  /**
   * Update assessment
   */
  app.put('/api/protected/assessments/:id', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.role !== 'examiner' && 
          assessment.assessorId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Update assessment
      const updatedAssessment = await storage.updateAssessment(assessmentId, req.body);
      
      // Update grades if provided
      if (req.body.grades && Array.isArray(req.body.grades)) {
        // Get current grades
        const currentGrades = await storage.getGradesByAssessment(assessmentId);
        
        // Process each grade
        for (const gradeData of req.body.grades) {
          if (gradeData.id) {
            // Update existing grade
            const existingGrade = currentGrades.find(g => g.id === gradeData.id);
            if (existingGrade) {
              await storage.updateGrade(gradeData.id, {
                ...gradeData,
                evaluatorId: req.user.id,
              });
            }
          } else {
            // Create new grade
            await storage.createGrade({
              ...gradeData,
              assessmentId,
              evaluatorId: req.user.id,
            });
          }
        }
      }
      
      res.json(updatedAssessment);
    } catch (error) {
      logger.error('Error updating assessment', { context: { error } });
      res.status(500).json({ error: 'Failed to update assessment' });
    }
  });

  /**
   * Delete assessment
   */
  app.delete('/api/protected/assessments/:id', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // Check permissions (only admin, examiner, or assessor can delete)
      if (req.user.role !== 'admin' && 
          req.user.role !== 'examiner' && 
          assessment.assessorId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Delete assessment (this should cascade delete grades)
      await storage.deleteAssessment(assessmentId);
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting assessment', { context: { error } });
      res.status(500).json({ error: 'Failed to delete assessment' });
    }
  });

  /**
   * Get grades for assessment
   */
  app.get('/api/protected/assessments/:id/grades', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // Check permissions
      if (req.user.role !== 'admin' && 
          req.user.role !== 'examiner' && 
          assessment.assessorId !== req.user.id && 
          assessment.traineeId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      const grades = await storage.getGradesByAssessment(assessmentId);
      res.json(grades);
    } catch (error) {
      logger.error('Error fetching grades', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch grades' });
    }
  });

  /**
   * Add grade to assessment
   */
  app.post('/api/protected/assessments/:id/grades', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // Check permissions (only admin, examiner, or assessor can add grades)
      if (req.user.role !== 'admin' && 
          req.user.role !== 'examiner' && 
          assessment.assessorId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Validate grade data
      const gradeData = insertGradeSchema.parse({
        ...req.body,
        assessmentId,
        evaluatorId: req.user.id,
      });
      
      // Create grade
      const grade = await storage.createGrade(gradeData);
      
      res.status(201).json(grade);
    } catch (error) {
      logger.error('Error creating grade', { context: { error } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid grade data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to create grade' });
    }
  });

  /**
   * Update grade
   */
  app.put('/api/protected/grades/:id', async (req: Request, res: Response) => {
    try {
      const gradeId = parseInt(req.params.id);
      const grade = await storage.getGrade(gradeId);
      
      if (!grade) {
        return res.status(404).json({ error: 'Grade not found' });
      }
      
      // Get assessment to check permissions
      const assessment = await storage.getAssessment(grade.assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Associated assessment not found' });
      }
      
      // Check permissions (only admin, examiner, or assessor can update grades)
      if (req.user.role !== 'admin' && 
          req.user.role !== 'examiner' && 
          assessment.assessorId !== req.user.id && 
          grade.evaluatorId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Update grade
      const updatedGrade = await storage.updateGrade(gradeId, req.body);
      
      res.json(updatedGrade);
    } catch (error) {
      logger.error('Error updating grade', { context: { error } });
      res.status(500).json({ error: 'Failed to update grade' });
    }
  });

  /**
   * Delete grade
   */
  app.delete('/api/protected/grades/:id', async (req: Request, res: Response) => {
    try {
      const gradeId = parseInt(req.params.id);
      const grade = await storage.getGrade(gradeId);
      
      if (!grade) {
        return res.status(404).json({ error: 'Grade not found' });
      }
      
      // Get assessment to check permissions
      const assessment = await storage.getAssessment(grade.assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Associated assessment not found' });
      }
      
      // Check permissions (only admin, examiner, or assessor can delete grades)
      if (req.user.role !== 'admin' && 
          req.user.role !== 'examiner' && 
          assessment.assessorId !== req.user.id && 
          grade.evaluatorId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Delete grade
      await storage.deleteGrade(gradeId);
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting grade', { context: { error } });
      res.status(500).json({ error: 'Failed to delete grade' });
    }
  });

  /**
   * Get trainee performance metrics
   */
  app.get('/api/protected/trainees/:id/performance', async (req: Request, res: Response) => {
    try {
      const traineeId = parseInt(req.params.id);
      
      // Check permissions
      if (req.user.id !== traineeId && 
          req.user.role !== 'admin' && 
          req.user.role !== 'examiner' && 
          req.user.role !== 'instructor') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      const trainee = await storage.getUser(traineeId);
      
      if (!trainee) {
        return res.status(404).json({ error: 'Trainee not found' });
      }
      
      // Get trainee performance metrics
      const performanceMetrics = await storage.getTraineePerformanceMetrics(traineeId);
      
      res.json(performanceMetrics);
    } catch (error) {
      logger.error('Error fetching trainee performance', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch trainee performance' });
    }
  });

  /**
   * Get instructor's assessment ratings
   */
  app.get('/api/instructor/assessment-ratings', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role !== 'instructor' && req.user.role !== 'examiner' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get instructor's assessment ratings
      const ratings = await storage.getInstructorAssessmentRatings(req.user.id);
      
      res.json(ratings);
    } catch (error) {
      logger.error('Error fetching instructor assessment ratings', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch instructor assessment ratings' });
    }
  });

  /**
   * Get instructor's trainees performance
   */
  app.get('/api/instructor/trainees-performance', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role !== 'instructor' && req.user.role !== 'examiner' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get instructor's trainees performance
      const performances = await storage.getInstructorTraineesPerformance(req.user.id);
      
      res.json(performances);
    } catch (error) {
      logger.error('Error fetching instructor trainees performance', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch instructor trainees performance' });
    }
  });

  /**
   * Get instructor's pending gradesheets
   */
  app.get('/api/instructor/pending-gradesheets', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role !== 'instructor' && req.user.role !== 'examiner' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get instructor's pending gradesheets
      const gradesheets = await storage.getInstructorPendingGradesheets(req.user.id);
      
      res.json(gradesheets);
    } catch (error) {
      logger.error('Error fetching instructor pending gradesheets', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch instructor pending gradesheets' });
    }
  });

  /**
   * Get instructor's weekly schedule
   */
  app.get('/api/instructor/weekly-schedule', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role !== 'instructor' && req.user.role !== 'examiner' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get instructor's weekly schedule
      const schedule = await storage.getInstructorWeeklySchedule(req.user.id);
      
      res.json(schedule);
    } catch (error) {
      logger.error('Error fetching instructor weekly schedule', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch instructor weekly schedule' });
    }
  });

  /**
   * Get instructor's today sessions
   */
  app.get('/api/instructor/today-sessions', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role !== 'instructor' && req.user.role !== 'examiner' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get instructor's today sessions
      const sessions = await storage.getInstructorTodaySessions(req.user.id);
      
      res.json(sessions);
    } catch (error) {
      logger.error('Error fetching instructor today sessions', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch instructor today sessions' });
    }
  });

  /**
   * Get trainee's performance summary
   */
  app.get('/api/trainee/performance-summary', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get trainee's performance summary
      const summary = await storage.getTraineePerformanceSummary(req.user.id);
      
      res.json(summary);
    } catch (error) {
      logger.error('Error fetching trainee performance summary', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch trainee performance summary' });
    }
  });

  /**
   * Get trainee's upcoming assessments
   */
  app.get('/api/trainee/upcoming-assessments', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get trainee's upcoming assessments
      const assessments = await storage.getTraineeUpcomingAssessments(req.user.id);
      
      res.json(assessments);
    } catch (error) {
      logger.error('Error fetching trainee upcoming assessments', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch trainee upcoming assessments' });
    }
  });

  /**
   * Get trainee's recent grades
   */
  app.get('/api/trainee/recent-grades', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get trainee's recent grades
      const grades = await storage.getTraineeRecentGrades(req.user.id);
      
      res.json(grades);
    } catch (error) {
      logger.error('Error fetching trainee recent grades', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch trainee recent grades' });
    }
  });

  /**
   * Get trainee's skill decay predictions
   */
  app.get('/api/trainee/skill-decay', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get trainee's skill decay predictions
      const skillDecay = await storage.getTraineeSkillDecayPredictions(req.user.id);
      
      res.json(skillDecay);
    } catch (error) {
      logger.error('Error fetching trainee skill decay predictions', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch trainee skill decay predictions' });
    }
  });
}