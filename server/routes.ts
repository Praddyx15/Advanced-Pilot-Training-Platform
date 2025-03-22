import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { extendedSessionSchema, insertProgramSchema, insertModuleSchema, insertLessonSchema, insertAssessmentSchema, insertGradeSchema, insertDocumentSchema, insertResourceSchema, insertNotificationSchema } from "@shared/schema";
import { syllabusGenerationOptionsSchema, syllabusImportSchema } from "@shared/syllabus-types";
import { z } from "zod";
import * as syllabusGenerator from "./services/syllabus-generator";
import * as templateManager from "./services/syllabus-template-manager";

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

  // === Syllabus Generator API ===
  app.post("/api/protected/syllabus/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { documentId, options } = syllabusImportSchema.parse(req.body);
      
      // Check if the document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Generate syllabus from document
      const syllabus = await storage.generateSyllabusFromDocument(documentId, options);
      res.json(syllabus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate syllabus" });
    }
  });
  
  app.post("/api/protected/syllabus/import", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { syllabus } = req.body;
      if (!syllabus) {
        return res.status(400).json({ message: "Syllabus data is required" });
      }
      
      // Save the syllabus as a training program
      const program = await storage.saveSyllabusAsProgram(syllabus, req.user.id);
      res.status(201).json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to import syllabus" });
    }
  });
  
  // === Syllabus Templates API ===
  app.get("/api/syllabus/templates", async (req, res) => {
    try {
      const templates = await storage.getAllSyllabusTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch syllabus templates" });
    }
  });
  
  app.get("/api/syllabus/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getSyllabusTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template details" });
    }
  });
  
  app.get("/api/syllabus/templates/type/:programType", async (req, res) => {
    try {
      const { programType } = req.params;
      const templates = await storage.getSyllabusTemplatesByType(programType);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates by type" });
    }
  });
  
  app.post("/api/protected/syllabus/templates", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { template } = req.body;
      if (!template) {
        return res.status(400).json({ message: "Template data is required" });
      }
      
      // Add user ID and current date
      template.createdById = req.user.id;
      template.createdAt = new Date();
      template.updatedAt = new Date();
      
      const createdTemplate = await storage.createSyllabusTemplate(template);
      res.status(201).json(createdTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to create syllabus template" });
    }
  });
  
  app.put("/api/protected/syllabus/templates/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const templateId = parseInt(req.params.id);
      const template = await storage.getSyllabusTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const { updates } = req.body;
      if (!updates) {
        return res.status(400).json({ message: "Update data is required" });
      }
      
      // Update the template
      updates.updatedAt = new Date();
      const updatedTemplate = await storage.updateSyllabusTemplate(templateId, updates);
      
      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update template" });
    }
  });
  
  app.delete("/api/protected/syllabus/templates/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const templateId = parseInt(req.params.id);
      const template = await storage.getSyllabusTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      await storage.deleteSyllabusTemplate(templateId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });
  
  // === Regulatory References API ===
  app.get("/api/syllabus/regulatory/:authority", async (req, res) => {
    try {
      const { authority } = req.params;
      const { version } = req.query;
      
      const references = await storage.getRegulatoryReferences(authority, version as string);
      res.json(references);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch regulatory references" });
    }
  });
  
  // === Syllabus Version Control API ===
  app.get("/api/syllabus/:syllabusId/versions", async (req, res) => {
    try {
      const syllabusId = parseInt(req.params.syllabusId);
      const versions = await storage.getSyllabusVersionHistory(syllabusId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch syllabus versions" });
    }
  });
  
  app.post("/api/protected/syllabus/:syllabusId/versions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const syllabusId = parseInt(req.params.syllabusId);
      const { version } = req.body;
      
      if (!version) {
        return res.status(400).json({ message: "Version data is required" });
      }
      
      // Set the user ID
      version.changedBy = req.user.id;
      
      const createdVersion = await storage.createSyllabusVersion(syllabusId, version);
      res.status(201).json(createdVersion);
    } catch (error) {
      res.status(500).json({ message: "Failed to create syllabus version" });
    }
  });
  
  app.post("/api/protected/syllabus/:syllabusId/compare", async (req, res) => {
    try {
      const syllabusId = parseInt(req.params.syllabusId);
      const { version1, version2 } = req.body;
      
      if (!version1 || !version2) {
        return res.status(400).json({ message: "Two version numbers are required for comparison" });
      }
      
      const comparisonResult = await storage.compareSyllabusVersions(syllabusId, version1, version2);
      res.json(comparisonResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to compare syllabus versions" });
    }
  });
  
  app.post("/api/protected/syllabus/:syllabusId/analyze-impact", async (req, res) => {
    try {
      const syllabusId = parseInt(req.params.syllabusId);
      const { changes } = req.body;
      
      if (!changes) {
        return res.status(400).json({ message: "Change data is required" });
      }
      
      const impactAnalysis = await storage.analyzeComplianceImpact(syllabusId, changes);
      res.json(impactAnalysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze compliance impact" });
    }
  });

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
  
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
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
  
  app.delete("/api/protected/documents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user is allowed to delete (admin or uploaded by them)
      if (req.user.role !== 'admin' && document.uploadedById !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this document" });
      }
      
      await storage.deleteDocument(documentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // === Document Version API ===
  app.get("/api/documents/:documentId/versions", async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      
      // Check if the document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const versions = await storage.getDocumentVersionsByDocument(documentId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document versions" });
    }
  });
  
  app.get("/api/document-versions/:id", async (req, res) => {
    try {
      const versionId = parseInt(req.params.id);
      const version = await storage.getDocumentVersion(versionId);
      
      if (!version) {
        return res.status(404).json({ message: "Document version not found" });
      }
      
      res.json(version);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document version" });
    }
  });
  
  app.post("/api/protected/documents/:documentId/versions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const documentId = parseInt(req.params.documentId);
      
      // Check if the document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Only admins or the uploader can add versions to a document
      if (req.user.role !== 'admin' && document.uploadedById !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to add versions to this document" });
      }
      
      // Create the new version
      const versionData = {
        ...req.body,
        documentId
      };
      
      const newVersion = await storage.createDocumentVersion(versionData);
      
      // Update the document to point to this version as current
      await storage.updateDocumentCurrentVersion(documentId, newVersion.id);
      
      res.status(201).json(newVersion);
    } catch (error) {
      res.status(500).json({ message: "Failed to create document version" });
    }
  });
  
  app.patch("/api/protected/documents/:documentId/current-version/:versionId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const documentId = parseInt(req.params.documentId);
      const versionId = parseInt(req.params.versionId);
      
      // Check if the document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Only admins or the uploader can change the current version
      if (req.user.role !== 'admin' && document.uploadedById !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this document" });
      }
      
      // Check if the version exists
      const version = await storage.getDocumentVersion(versionId);
      if (!version) {
        return res.status(404).json({ message: "Document version not found" });
      }
      
      // Check if the version belongs to the document
      if (version.documentId !== documentId) {
        return res.status(400).json({ message: "Version does not belong to this document" });
      }
      
      const updatedDocument = await storage.updateDocumentCurrentVersion(documentId, versionId);
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update current document version" });
    }
  });
  
  // === Document Analysis API ===
  app.get("/api/document-analysis/:id", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getDocumentAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ message: "Document analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document analysis" });
    }
  });
  
  app.get("/api/documents/:id/analysis", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const analysisType = req.query.type as string | undefined;
      
      // Check if document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const analysisResults = await storage.getDocumentAnalysisByDocument(documentId, analysisType);
      res.json(analysisResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis for document" });
    }
  });
  
  app.post("/api/protected/documents/:id/analyze", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const documentId = parseInt(req.params.id);
      
      // Check if document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const { analysisType, options = {} } = req.body;
      if (!analysisType) {
        return res.status(400).json({ message: "Analysis type is required" });
      }
      
      // Create initial analysis record
      const analysisData = insertDocumentAnalysisSchema.parse({
        documentId,
        analysisType,
        status: 'pending',
        createdAt: new Date()
      });
      
      const analysis = await storage.createDocumentAnalysis(analysisData);
      
      // Import our document processing services
      const { extractTextFromDocument } = await import('./services/document-extraction');
      const { analyzeDocumentStructure } = await import('./services/document-structure');

      // Start the analysis process in the background
      setTimeout(async () => {
        try {
          let results = {};
          const startTime = Date.now();
          
          // Get the document file path (in a real app, this would be in storage)
          // For demo purposes, we assume the document path is stored in document.filePath
          const filePath = document.filePath || `./uploads/${document.id}_${document.title.replace(/\s+/g, '_')}`;
          
          try {
            if (analysisType === 'text_extraction') {
              // Perform text extraction
              results = await extractTextFromDocument(filePath, {
                language: options.language || 'eng',
                ocrEnabled: options.ocrEnabled !== false, // Enable OCR by default
              });
              
            } else if (analysisType === 'structure_recognition') {
              // First extract text, then analyze structure
              const extractionResult = await extractTextFromDocument(filePath, {
                language: options.language || 'eng',
                ocrEnabled: options.ocrEnabled !== false,
              });
              
              results = await analyzeDocumentStructure(extractionResult, {
                recognizeHeadings: options.recognizeHeadings !== false,
                recognizeSections: options.recognizeSections !== false,
                recognizeTables: options.recognizeTables !== false,
                recognizeLists: options.recognizeLists !== false,
                recognizeKeyValue: options.recognizeKeyValue !== false,
                recognizeReferences: options.recognizeReferences !== false,
                language: options.language || 'eng',
              });
              
            } else if (analysisType === 'entity_extraction') {
              // Placeholder for future entity extraction implementation
              // This would use an NLP service like spaCy, Stanford NER, etc.
              results = {
                metadata: {
                  processingTime: Date.now() - startTime,
                  status: 'not_implemented',
                },
                content: {
                  message: 'Entity extraction service is not fully implemented yet',
                }
              };
            }
            
            // Update the analysis with the results
            await storage.updateDocumentAnalysisStatus(
              analysis.id, 
              'completed', 
              results
            );
          } catch (processingError) {
            console.error('Document processing error:', processingError);
            
            // Update with error status and error details
            await storage.updateDocumentAnalysisStatus(
              analysis.id, 
              'failed', 
              {
                error: processingError.message,
                stack: process.env.NODE_ENV === 'development' ? processingError.stack : undefined,
              }
            );
          }
        } catch (error) {
          console.error('Error in analysis job:', error);
          await storage.updateDocumentAnalysisStatus(
            analysis.id, 
            'failed', 
            { error: 'Analysis processing failed' }
          );
        }
      }, 100); // Start processing almost immediately
      
      res.status(202).json({
        ...analysis,
        message: "Analysis started"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document analysis" });
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

  // === Performance Analytics API ===
  app.get("/api/analytics/performance/trainee/:traineeId", async (req, res) => {
    try {
      const traineeId = parseInt(req.params.traineeId);
      const metrics = await storage.getPerformanceMetricsByTrainee(traineeId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  app.get("/api/analytics/performance/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const metrics = await storage.getPerformanceMetricsBySession(sessionId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session performance metrics" });
    }
  });

  app.post("/api/protected/analytics/performance", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const metricData = req.body;
      if (!metricData) {
        return res.status(400).json({ message: "Performance metric data is required" });
      }
      
      const metric = await storage.createPerformanceMetric(metricData);
      res.status(201).json(metric);
    } catch (error) {
      res.status(500).json({ message: "Failed to create performance metric" });
    }
  });

  // === Predictive Analytics API ===
  app.get("/api/analytics/predictive-models", async (req, res) => {
    try {
      const active = req.query.active === 'true';
      const models = await storage.getAllPredictiveModels(active);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch predictive models" });
    }
  });

  app.get("/api/analytics/skill-decay/:traineeId", async (req, res) => {
    try {
      const traineeId = parseInt(req.params.traineeId);
      const predictions = await storage.getSkillDecayPredictionsByTrainee(traineeId);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill decay predictions" });
    }
  });

  app.post("/api/protected/analytics/skill-decay", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const predictionData = req.body;
      if (!predictionData) {
        return res.status(400).json({ message: "Prediction data is required" });
      }
      
      const prediction = await storage.createSkillDecayPrediction(predictionData);
      res.status(201).json(prediction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create skill decay prediction" });
    }
  });

  // === Session Replay API ===
  app.get("/api/replays/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const replays = await storage.getSessionReplaysBySession(sessionId);
      res.json(replays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session replays" });
    }
  });

  app.get("/api/replays/:replayId/events", async (req, res) => {
    try {
      const replayId = parseInt(req.params.replayId);
      const events = await storage.getSessionEventsByReplay(replayId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch replay events" });
    }
  });

  app.post("/api/protected/replays", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const replayData = req.body;
      if (!replayData) {
        return res.status(400).json({ message: "Replay data is required" });
      }
      
      const replay = await storage.createSessionReplay(replayData);
      res.status(201).json(replay);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session replay" });
    }
  });

  app.post("/api/protected/replays/:replayId/events", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const replayId = parseInt(req.params.replayId);
      const eventData = req.body;
      
      if (!eventData) {
        return res.status(400).json({ message: "Event data is required" });
      }
      
      // Add the replay ID to the event data
      eventData.replayId = replayId;
      
      const event = await storage.createSessionEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to create replay event" });
    }
  });

  // === Gamification API ===
  app.get("/api/gamification/achievements", async (req, res) => {
    try {
      const active = req.query.active === 'true';
      const achievements = await storage.getAllAchievements(active);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/gamification/achievements/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievements = await storage.getUserAchievementsByUser(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/protected/gamification/achievements/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = parseInt(req.params.userId);
      const achievementData = req.body;
      
      if (!achievementData) {
        return res.status(400).json({ message: "Achievement data is required" });
      }
      
      // Add the user ID to the achievement data
      achievementData.userId = userId;
      
      const achievement = await storage.createUserAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user achievement" });
    }
  });

  app.get("/api/gamification/leaderboards", async (req, res) => {
    try {
      const active = req.query.active === 'true';
      const leaderboards = await storage.getAllLeaderboards(active);
      res.json(leaderboards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboards" });
    }
  });

  app.get("/api/gamification/leaderboards/:leaderboardId/entries", async (req, res) => {
    try {
      const leaderboardId = parseInt(req.params.leaderboardId);
      const entries = await storage.getLeaderboardEntriesByLeaderboard(leaderboardId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard entries" });
    }
  });

  // === Community Collaboration API ===
  app.get("/api/community/scenarios", async (req, res) => {
    try {
      const status = req.query.status as string;
      const scenarios = await storage.getAllSharedScenarios(status);
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared scenarios" });
    }
  });

  app.get("/api/community/scenarios/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const scenarios = await storage.getSharedScenariosByUser(userId);
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user shared scenarios" });
    }
  });

  app.post("/api/protected/community/scenarios", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const scenarioData = req.body;
      if (!scenarioData) {
        return res.status(400).json({ message: "Scenario data is required" });
      }
      
      // Add the creator ID
      scenarioData.createdById = req.user.id;
      
      const scenario = await storage.createSharedScenario(scenarioData);
      res.status(201).json(scenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to create shared scenario" });
    }
  });

  app.post("/api/protected/community/scenarios/:id/verify", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const scenarioId = parseInt(req.params.id);
      const verifiedScenario = await storage.verifySharedScenario(scenarioId, req.user.id);
      
      if (!verifiedScenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json(verifiedScenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify scenario" });
    }
  });

  app.post("/api/community/scenarios/:id/download", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const scenario = await storage.incrementScenarioDownloadCount(scenarioId);
      
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json({ success: true, downloads: scenario.downloads });
    } catch (error) {
      res.status(500).json({ message: "Failed to record scenario download" });
    }
  });

  // === Knowledge Graph API ===
  app.get("/api/knowledge-graph/nodes", async (req, res) => {
    try {
      const { nodeType, documentId } = req.query;
      
      const options: { nodeType?: string, documentId?: number } = {};
      if (nodeType) options.nodeType = nodeType as string;
      if (documentId) options.documentId = parseInt(documentId as string);
      
      const nodes = await storage.getKnowledgeGraphNodes(options);
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch knowledge graph nodes" });
    }
  });
  
  app.get("/api/knowledge-graph/nodes/:id", async (req, res) => {
    try {
      const nodeId = parseInt(req.params.id);
      const node = await storage.getKnowledgeGraphNode(nodeId);
      
      if (!node) {
        return res.status(404).json({ message: "Knowledge graph node not found" });
      }
      
      res.json(node);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch knowledge graph node" });
    }
  });
  
  app.get("/api/knowledge-graph/edges", async (req, res) => {
    try {
      const { sourceNodeId, targetNodeId, relationship } = req.query;
      
      const options: { sourceNodeId?: number, targetNodeId?: number, relationship?: string } = {};
      if (sourceNodeId) options.sourceNodeId = parseInt(sourceNodeId as string);
      if (targetNodeId) options.targetNodeId = parseInt(targetNodeId as string);
      if (relationship) options.relationship = relationship as string;
      
      const edges = await storage.getKnowledgeGraphEdges(options);
      res.json(edges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch knowledge graph edges" });
    }
  });
  
  app.post("/api/protected/knowledge-graph/nodes", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const node = req.body;
      if (!node) {
        return res.status(400).json({ message: "Node data is required" });
      }
      
      const createdNode = await storage.createKnowledgeGraphNode(node);
      res.status(201).json(createdNode);
    } catch (error) {
      res.status(500).json({ message: "Failed to create knowledge graph node" });
    }
  });
  
  app.post("/api/protected/knowledge-graph/edges", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const edge = req.body;
      if (!edge) {
        return res.status(400).json({ message: "Edge data is required" });
      }
      
      const createdEdge = await storage.createKnowledgeGraphEdge(edge);
      res.status(201).json(createdEdge);
    } catch (error) {
      res.status(500).json({ message: "Failed to create knowledge graph edge" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
