import { pgTable, text, serial, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // 'instructor' or 'trainee'
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Training Programs
export const trainingPrograms = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({
  id: true,
});

// Modules
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  name: text("name").notNull(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
});

// Lessons
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'video', 'document', 'interactive'
  content: text("content").notNull(), // URL or embedded content
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
});

// Sessions
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  moduleId: integer("module_id").notNull(),
  resourceId: integer("resource_id"),
  status: text("status").notNull(), // 'scheduled', 'in progress', 'completed'
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
});

// Session Trainees
export const sessionTrainees = pgTable("session_trainees", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  traineeId: integer("trainee_id").notNull(),
});

export const insertSessionTraineeSchema = createInsertSchema(sessionTrainees).omit({
  id: true,
});

// Assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  traineeId: integer("trainee_id").notNull(),
  sessionId: integer("session_id").notNull(),
  moduleId: integer("module_id").notNull(),
  instructorId: integer("instructor_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // 'pending', 'graded'
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
});

// Grades
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  competencyAreaId: text("competency_area_id").notNull(),
  score: integer("score").notNull(),
  comments: text("comments").notNull(),
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileType: text("file_type").notNull(),
  url: text("url").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
});

// Resources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'simulator', 'classroom'
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'info', 'warning', 'error'
  content: text("content").notNull(),
  recipientId: integer("recipient_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
  status: text("status").notNull(), // 'sent', 'read'
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;

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

// Extended types for UI
export interface TrainingProgramWithModules extends TrainingProgram {
  modules: ModuleWithLessons[];
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface SessionWithDetails extends Session {
  program: TrainingProgram;
  module: Module;
  resource?: Resource;
  trainees: User[];
}

export interface AssessmentWithDetails extends Assessment {
  trainee: User;
  session: Session;
  module: Module;
  instructor: User;
  grades: Grade[];
}
