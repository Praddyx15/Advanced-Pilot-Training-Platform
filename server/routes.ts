import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertTrainingProgramSchema, insertModuleSchema, insertLessonSchema,
  insertSessionSchema, insertSessionTraineeSchema, insertAssessmentSchema,
  insertGradeSchema, insertDocumentSchema, insertResourceSchema, insertNotificationSchema 
} from "@shared/schema";
import { z } from "zod";

// Middleware to ensure user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to ensure user is an instructor
function ensureInstructor(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user?.role === 'instructor') {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Instructor access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Training programs routes
  app.get("/api/programs", ensureAuthenticated, async (req, res) => {
    try {
      const programs = await storage.getTrainingPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching training programs" });
    }
  });

  app.get("/api/programs/:id", ensureAuthenticated, async (req, res) => {
    try {
      const program = await storage.getTrainingProgramWithModules(parseInt(req.params.id));
      if (!program) {
        return res.status(404).json({ message: "Training program not found" });
      }
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Error fetching training program" });
    }
  });

  app.post("/api/programs", ensureInstructor, async (req, res) => {
    try {
      const programData = insertTrainingProgramSchema.parse(req.body);
      const program = await storage.createTrainingProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating training program" });
    }
  });

  app.put("/api/programs/:id", ensureInstructor, async (req, res) => {
    try {
      const programData = insertTrainingProgramSchema.partial().parse(req.body);
      const program = await storage.updateTrainingProgram(parseInt(req.params.id), programData);
      if (!program) {
        return res.status(404).json({ message: "Training program not found" });
      }
      res.json(program);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating training program" });
    }
  });

  app.delete("/api/programs/:id", ensureInstructor, async (req, res) => {
    try {
      const result = await storage.deleteTrainingProgram(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Training program not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting training program" });
    }
  });

  // Modules routes
  app.get("/api/modules", ensureAuthenticated, async (req, res) => {
    try {
      const programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
      const modules = await storage.getModules(programId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching modules" });
    }
  });

  app.get("/api/modules/:id", ensureAuthenticated, async (req, res) => {
    try {
      const module = await storage.getModuleWithLessons(parseInt(req.params.id));
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      res.status(500).json({ message: "Error fetching module" });
    }
  });

  app.post("/api/modules", ensureInstructor, async (req, res) => {
    try {
      const moduleData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating module" });
    }
  });

  app.put("/api/modules/:id", ensureInstructor, async (req, res) => {
    try {
      const moduleData = insertModuleSchema.partial().parse(req.body);
      const module = await storage.updateModule(parseInt(req.params.id), moduleData);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating module" });
    }
  });

  app.delete("/api/modules/:id", ensureInstructor, async (req, res) => {
    try {
      const result = await storage.deleteModule(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting module" });
    }
  });

  // Lessons routes
  app.get("/api/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const moduleId = req.query.moduleId ? parseInt(req.query.moduleId as string) : undefined;
      const lessons = await storage.getLessons(moduleId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lessons" });
    }
  });

  app.get("/api/lessons/:id", ensureAuthenticated, async (req, res) => {
    try {
      const lesson = await storage.getLesson(parseInt(req.params.id));
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lesson" });
    }
  });

  app.post("/api/lessons", ensureInstructor, async (req, res) => {
    try {
      const lessonData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating lesson" });
    }
  });

  app.put("/api/lessons/:id", ensureInstructor, async (req, res) => {
    try {
      const lessonData = insertLessonSchema.partial().parse(req.body);
      const lesson = await storage.updateLesson(parseInt(req.params.id), lessonData);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating lesson" });
    }
  });

  app.delete("/api/lessons/:id", ensureInstructor, async (req, res) => {
    try {
      const result = await storage.deleteLesson(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting lesson" });
    }
  });

  // Sessions routes
  app.get("/api/sessions", ensureAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sessions" });
    }
  });

  app.get("/api/sessions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const session = await storage.getSessionWithDetails(parseInt(req.params.id));
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Error fetching session" });
    }
  });

  app.post("/api/sessions", ensureInstructor, async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating session" });
    }
  });

  app.put("/api/sessions/:id", ensureInstructor, async (req, res) => {
    try {
      const sessionData = insertSessionSchema.partial().parse(req.body);
      const session = await storage.updateSession(parseInt(req.params.id), sessionData);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating session" });
    }
  });

  app.delete("/api/sessions/:id", ensureInstructor, async (req, res) => {
    try {
      const result = await storage.deleteSession(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting session" });
    }
  });

  // Session trainees routes
  app.post("/api/sessions/:sessionId/trainees", ensureInstructor, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const traineeData = insertSessionTraineeSchema.parse({
        ...req.body,
        sessionId,
      });
      const trainee = await storage.addTraineeToSession(traineeData);
      res.status(201).json(trainee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error adding trainee to session" });
    }
  });

  app.delete("/api/sessions/:sessionId/trainees/:traineeId", ensureInstructor, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const traineeId = parseInt(req.params.traineeId);
      const result = await storage.removeTraineeFromSession(sessionId, traineeId);
      if (!result) {
        return res.status(404).json({ message: "Trainee not found in session" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error removing trainee from session" });
    }
  });

  // Assessments routes
  app.get("/api/assessments", ensureAuthenticated, async (req, res) => {
    try {
      const traineeId = req.query.traineeId ? parseInt(req.query.traineeId as string) : undefined;
      const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string) : undefined;
      const assessments = await storage.getAssessments(traineeId, sessionId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessments" });
    }
  });

  app.get("/api/assessments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const assessment = await storage.getAssessmentWithDetails(parseInt(req.params.id));
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Only allow instructors or the assessed trainee to view
      if (req.user?.role !== 'instructor' && req.user?.id !== assessment.traineeId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessment" });
    }
  });

  app.post("/api/assessments", ensureInstructor, async (req, res) => {
    try {
      const assessmentData = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating assessment" });
    }
  });

  app.put("/api/assessments/:id", ensureInstructor, async (req, res) => {
    try {
      const assessmentData = insertAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateAssessment(parseInt(req.params.id), assessmentData);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating assessment" });
    }
  });

  // Grades routes
  app.get("/api/assessments/:assessmentId/grades", ensureAuthenticated, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Only allow instructors or the assessed trainee to view
      if (req.user?.role !== 'instructor' && req.user?.id !== assessment.traineeId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const grades = await storage.getGrades(assessmentId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grades" });
    }
  });

  app.post("/api/assessments/:assessmentId/grades", ensureInstructor, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      const gradeData = insertGradeSchema.parse({
        ...req.body,
        assessmentId,
      });
      const grade = await storage.createGrade(gradeData);
      
      // Update assessment status to graded if not already
      const assessment = await storage.getAssessment(assessmentId);
      if (assessment && assessment.status === 'pending') {
        await storage.updateAssessment(assessmentId, { status: 'graded' });
      }
      
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating grade" });
    }
  });

  app.put("/api/grades/:id", ensureInstructor, async (req, res) => {
    try {
      const gradeData = insertGradeSchema.partial().parse(req.body);
      const grade = await storage.updateGrade(parseInt(req.params.id), gradeData);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      res.json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating grade" });
    }
  });

  // Documents routes
  app.get("/api/documents", ensureAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching documents" });
    }
  });

  app.get("/api/documents/:id", ensureAuthenticated, async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Error fetching document" });
    }
  });

  app.post("/api/documents", ensureInstructor, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating document" });
    }
  });

  app.put("/api/documents/:id", ensureInstructor, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(parseInt(req.params.id), documentData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating document" });
    }
  });

  app.delete("/api/documents/:id", ensureInstructor, async (req, res) => {
    try {
      const result = await storage.deleteDocument(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting document" });
    }
  });

  // Resources routes
  app.get("/api/resources", ensureAuthenticated, async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resources" });
    }
  });

  app.get("/api/resources/:id", ensureAuthenticated, async (req, res) => {
    try {
      const resource = await storage.getResource(parseInt(req.params.id));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resource" });
    }
  });

  app.post("/api/resources", ensureInstructor, async (req, res) => {
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating resource" });
    }
  });

  app.put("/api/resources/:id", ensureInstructor, async (req, res) => {
    try {
      const resourceData = insertResourceSchema.partial().parse(req.body);
      const resource = await storage.updateResource(parseInt(req.params.id), resourceData);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating resource" });
    }
  });

  app.delete("/api/resources/:id", ensureInstructor, async (req, res) => {
    try {
      const result = await storage.deleteResource(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting resource" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user?.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  app.post("/api/notifications", ensureInstructor, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating notification" });
    }
  });

  app.post("/api/notifications/mark-read", ensureAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationsAsRead(req.user!.id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error marking notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
