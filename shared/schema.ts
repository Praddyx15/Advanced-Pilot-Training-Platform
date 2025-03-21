import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // 'instructor' or 'trainee'
  organizationType: text("organization_type"), // 'ATO', 'Airline', 'Personal', 'Admin'
  organizationName: text("organization_name"),
  authProvider: text("auth_provider"), // 'local', 'google', 'microsoft'
  authProviderId: text("auth_provider_id"),
  profilePicture: text("profile_picture"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  organizationType: true,
  organizationName: true,
  authProvider: true,
  authProviderId: true,
  profilePicture: true,
});

// Training Program schema
export const trainingPrograms = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdById: integer("created_by_id").notNull(),
});

export const insertProgramSchema = createInsertSchema(trainingPrograms).pick({
  name: true,
  description: true,
  createdById: true,
});

// Module schema
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  programId: integer("program_id").notNull(),
});

export const insertModuleSchema = createInsertSchema(modules).pick({
  name: true,
  programId: true,
});

// Lesson schema
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  moduleId: integer("module_id").notNull(),
  type: text("type").notNull(), // 'video', 'document', 'interactive'
  content: text("content").notNull(), // URL or embedded content
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  name: true,
  moduleId: true,
  type: true,
  content: true,
});

// Session schema
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  moduleId: integer("module_id").notNull(),
  status: text("status").notNull(), // 'scheduled', 'in progress', 'completed'
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  resourceId: integer("resource_id"),
  instructorId: integer("instructor_id").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  programId: true,
  moduleId: true,
  status: true,
  startTime: true,
  endTime: true,
  resourceId: true,
  instructorId: true,
});

// Session Trainees (junction table)
export const sessionTrainees = pgTable("session_trainees", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  traineeId: integer("trainee_id").notNull(),
});

export const insertSessionTraineeSchema = createInsertSchema(sessionTrainees).pick({
  sessionId: true,
  traineeId: true,
});

// Assessment schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  traineeId: integer("trainee_id").notNull(),
  sessionId: integer("session_id").notNull(),
  moduleId: integer("module_id").notNull(),
  instructorId: integer("instructor_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // 'pending', 'graded'
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  traineeId: true,
  sessionId: true,
  moduleId: true,
  instructorId: true,
  date: true,
  status: true,
});

// Grade schema
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  competencyAreaId: text("competency_area_id").notNull(),
  score: integer("score").notNull(),
  comments: text("comments"),
});

export const insertGradeSchema = createInsertSchema(grades).pick({
  assessmentId: true,
  competencyAreaId: true,
  score: true,
  comments: true,
});

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileType: text("file_type").notNull(),
  url: text("url").notNull(),
  uploadedById: integer("uploaded_by_id").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  description: true,
  fileType: true,
  url: true,
  uploadedById: true,
});

// Resource schema
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'simulator', 'classroom'
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  name: true,
  type: true,
  location: true,
  capacity: true,
});

// Notification schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'info', 'warning', 'error'
  content: text("content").notNull(),
  recipientId: integer("recipient_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
  status: text("status").notNull(), // 'sent', 'read'
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  type: true,
  content: true,
  recipientId: true,
  createdAt: true,
  status: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertProgramSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type SessionTrainee = typeof sessionTrainees.$inferSelect;
export type InsertSessionTrainee = z.infer<typeof insertSessionTraineeSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended schemas for API communication
export const extendedSessionSchema = z.object({
  id: z.number().optional(),
  programId: z.number(),
  moduleId: z.number(),
  status: z.enum(['scheduled', 'in progress', 'completed']),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  resourceId: z.number().optional(),
  instructorId: z.number(),
  trainees: z.array(z.number()),
});

export type ExtendedSession = z.infer<typeof extendedSessionSchema>;
