import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { extendedSessionSchema, insertProgramSchema, insertModuleSchema, insertLessonSchema, insertAssessmentSchema, insertGradeSchema, insertDocumentSchema, insertResourceSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Initialize with seed data if no users exist
  const seedDatabase = async () => {
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      // TODO: Initialize with seed data here if needed
    }
  };

  seedDatabase();

  // === Training Programs API ===
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getAllPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.get("/api/programs/:id", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const program = await storage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      // Get modules for this program
      const modules = await storage.getModulesByProgram(programId);
      
      // Get lessons for each module
      const modulesWithLessons = await Promise.all(
        modules.map(async (module) => {
          const lessons = await storage.getLessonsByModule(module.id);
          return {
            ...module,
            lessons,
          };
        })
      );
      
      res.json({
        ...program,
        modules: modulesWithLessons,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch program details" });
    }
  });

  app.post("/api/protected/programs", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validatedData = insertProgramSchema.parse({
        ...req.body,
        createdById: req.user.id,
      });
      
      const program = await storage.createProgram(validatedData);
      res.status(201).json(program);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/protected/programs/:id", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const program = await storage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      const validatedData = insertProgramSchema.partial().parse(req.body);
      const updatedProgram = await storage.updateProgram(programId, validatedData);
      
      res.json(updatedProgram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update program" });
    }
  });

  app.delete("/api/protected/programs/:id", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const program = await storage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      await storage.deleteProgram(programId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete program" });
    }
  });

  // === Modules API ===
  app.post("/api/protected/modules", async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse(req.body);
      
      // Check if program exists
      const program = await storage.getProgram(validatedData.programId);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put("/api/protected/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const validatedData = insertModuleSchema.partial().parse(req.body);
      const updatedModule = await storage.updateModule(moduleId, validatedData);
      
      res.json(updatedModule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/protected/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      await storage.deleteModule(moduleId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // === Lessons API ===
  app.post("/api/protected/lessons", async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse(req.body);
      
      // Check if module exists
      const module = await storage.getModule(validatedData.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // === Sessions API ===
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      
      // Get trainees for each session
      const sessionsWithTrainees = await Promise.all(
        sessions.map(async (session) => {
          const trainees = await storage.getSessionTrainees(session.id);
          return {
            ...session,
            trainees,
          };
        })
      );
      
      res.json(sessionsWithTrainees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Get trainees for this session
      const trainees = await storage.getSessionTrainees(sessionId);
      
      res.json({
        ...session,
        trainees,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session details" });
    }
  });

  app.post("/api/protected/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionData = extendedSessionSchema.parse({
        ...req.body,
        instructorId: req.user.id,
      });
      
      // Create session first
      const { trainees, ...sessionInsertData } = sessionData;
      const createdSession = await storage.createSession(sessionInsertData);
      
      // Add trainees to session
      if (trainees && trainees.length > 0) {
        await Promise.all(
          trainees.map(traineeId => 
            storage.addTraineeToSession({
              sessionId: createdSession.id,
              traineeId
            })
          )
        );
      }
      
      res.status(201).json({
        ...createdSession,
        trainees: trainees || [],
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put("/api/protected/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const sessionData = extendedSessionSchema.partial().parse(req.body);
      
      // Update session
      const { trainees, ...sessionUpdateData } = sessionData;
      const updatedSession = await storage.updateSession(sessionId, sessionUpdateData);
      
      // If trainees were provided, update the session's trainees
      if (trainees) {
        // Get current trainees
        const currentTrainees = await storage.getSessionTrainees(sessionId);
        
        // Remove trainees that are no longer in the list
        for (const traineeId of currentTrainees) {
          if (!trainees.includes(traineeId)) {
            await storage.removeTraineeFromSession(sessionId, traineeId);
          }
        }
        
        // Add new trainees
        for (const traineeId of trainees) {
          if (!currentTrainees.includes(traineeId)) {
            await storage.addTraineeToSession({
              sessionId,
              traineeId
            });
          }
        }
      }
      
      // Get the updated list of trainees
      const updatedTrainees = await storage.getSessionTrainees(sessionId);
      
      res.json({
        ...updatedSession,
        trainees: updatedTrainees,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/protected/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      await storage.deleteSession(sessionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // === Users API ===
  app.get("/api/protected/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const sanitizedUsers = users.map(user => ({
        ...user,
        password: undefined,
      }));
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/protected/users/trainees", async (req, res) => {
    try {
      const trainees = await storage.getUsersByRole("trainee");
      
      // Remove passwords from response
      const sanitizedTrainees = trainees.map(trainee => ({
        ...trainee,
        password: undefined,
      }));
      
      res.json(sanitizedTrainees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trainees" });
    }
  });

  app.get("/api/protected/users/instructors", async (req, res) => {
    try {
      const instructors = await storage.getUsersByRole("instructor");
      
      // Remove passwords from response
      const sanitizedInstructors = instructors.map(instructor => ({
        ...instructor,
        password: undefined,
      }));
      
      res.json(sanitizedInstructors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  // === Assessments API ===
  app.get("/api/protected/assessments", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let assessments;
      if (req.user.role === "instructor") {
        assessments = await storage.getAssessmentsByInstructor(req.user.id);
      } else {
        assessments = await storage.getAssessmentsByTrainee(req.user.id);
      }
      
      // Get grades for each assessment
      const assessmentsWithGrades = await Promise.all(
        assessments.map(async (assessment) => {
          const grades = await storage.getGradesByAssessment(assessment.id);
          return {
            ...assessment,
            grades,
          };
        })
      );
      
      res.json(assessmentsWithGrades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.post("/api/instructor/assessments", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validatedData = insertAssessmentSchema.parse({
        ...req.body,
        instructorId: req.user.id,
      });
      
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.post("/api/instructor/assessments/:assessmentId/grades", async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      
      // Check if assessment exists
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      const validatedData = insertGradeSchema.parse({
        ...req.body,
        assessmentId,
      });
      
      const grade = await storage.createGrade(validatedData);
      
      // Update assessment status to 'graded' if it was pending
      if (assessment.status === 'pending') {
        await storage.updateAssessment(assessmentId, { status: 'graded' });
      }
      
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  // === Documents API ===
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/protected/documents", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        uploadedById: req.user.id,
      });
      
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // === Resources API ===
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.post("/api/protected/resources", async (req, res) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  // === Notifications API ===
  app.get("/api/protected/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/protected/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/protected/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.updateNotificationStatus(notificationId, "read");
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
