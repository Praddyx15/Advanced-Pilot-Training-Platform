import {
  users, trainingPrograms, modules, lessons, 
  sessions, sessionTrainees, assessments, grades, 
  documents, resources, notifications,
  type User, type InsertUser,
  type TrainingProgram, type InsertTrainingProgram,
  type Module, type InsertModule,
  type Lesson, type InsertLesson,
  type Session, type InsertSession,
  type SessionTrainee, type InsertSessionTrainee,
  type Assessment, type InsertAssessment,
  type Grade, type InsertGrade,
  type Document, type InsertDocument,
  type Resource, type InsertResource,
  type Notification, type InsertNotification,
  type TrainingProgramWithModules, type ModuleWithLessons,
  type SessionWithDetails, type AssessmentWithDetails
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // TrainingProgram operations
  getTrainingPrograms(): Promise<TrainingProgram[]>;
  getTrainingProgram(id: number): Promise<TrainingProgram | undefined>;
  getTrainingProgramWithModules(id: number): Promise<TrainingProgramWithModules | undefined>;
  createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram>;
  updateTrainingProgram(id: number, program: Partial<InsertTrainingProgram>): Promise<TrainingProgram | undefined>;
  deleteTrainingProgram(id: number): Promise<boolean>;
  
  // Module operations
  getModules(programId?: number): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  getModuleWithLessons(id: number): Promise<ModuleWithLessons | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;
  
  // Lesson operations
  getLessons(moduleId?: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  
  // Session operations
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  getSessionWithDetails(id: number): Promise<SessionWithDetails | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
  
  // SessionTrainee operations
  getSessionTrainees(sessionId?: number): Promise<SessionTrainee[]>;
  addTraineeToSession(traineeData: InsertSessionTrainee): Promise<SessionTrainee>;
  removeTraineeFromSession(sessionId: number, traineeId: number): Promise<boolean>;
  
  // Assessment operations
  getAssessments(traineeId?: number, sessionId?: number): Promise<Assessment[]>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentWithDetails(id: number): Promise<AssessmentWithDetails | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  
  // Grade operations
  getGrades(assessmentId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
  
  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Resource operations
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  
  // Notification operations
  getNotifications(recipientId?: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  markNotificationsAsRead(recipientId: number): Promise<boolean>;
  
  // Session store for auth
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private trainingProgramsMap: Map<number, TrainingProgram>;
  private modulesMap: Map<number, Module>;
  private lessonsMap: Map<number, Lesson>;
  private sessionsMap: Map<number, Session>;
  private sessionTraineesMap: Map<number, SessionTrainee>;
  private assessmentsMap: Map<number, Assessment>;
  private gradesMap: Map<number, Grade>;
  private documentsMap: Map<number, Document>;
  private resourcesMap: Map<number, Resource>;
  private notificationsMap: Map<number, Notification>;
  
  sessionStore: session.SessionStore;
  
  private userCounter: number = 1;
  private programCounter: number = 1;
  private moduleCounter: number = 1;
  private lessonCounter: number = 1;
  private sessionCounter: number = 1;
  private sessionTraineeCounter: number = 1;
  private assessmentCounter: number = 1;
  private gradeCounter: number = 1;
  private documentCounter: number = 1;
  private resourceCounter: number = 1;
  private notificationCounter: number = 1;

  constructor() {
    this.usersMap = new Map();
    this.trainingProgramsMap = new Map();
    this.modulesMap = new Map();
    this.lessonsMap = new Map();
    this.sessionsMap = new Map();
    this.sessionTraineesMap = new Map();
    this.assessmentsMap = new Map();
    this.gradesMap = new Map();
    this.documentsMap = new Map();
    this.resourcesMap = new Map();
    this.notificationsMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with demo data
    this.initDemoData();
  }

  private initDemoData() {
    // Add some initial demo data here if needed
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { ...userData, id };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.usersMap.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  // TrainingProgram operations
  async getTrainingPrograms(): Promise<TrainingProgram[]> {
    return Array.from(this.trainingProgramsMap.values());
  }

  async getTrainingProgram(id: number): Promise<TrainingProgram | undefined> {
    return this.trainingProgramsMap.get(id);
  }

  async getTrainingProgramWithModules(id: number): Promise<TrainingProgramWithModules | undefined> {
    const program = this.trainingProgramsMap.get(id);
    if (!program) return undefined;
    
    const programModules = Array.from(this.modulesMap.values())
      .filter(module => module.programId === id)
      .map(module => {
        const moduleLessons = Array.from(this.lessonsMap.values())
          .filter(lesson => lesson.moduleId === module.id);
        
        return {
          ...module,
          lessons: moduleLessons
        } as ModuleWithLessons;
      });
    
    return {
      ...program,
      modules: programModules
    };
  }

  async createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const id = this.programCounter++;
    const newProgram: TrainingProgram = { ...program, id };
    this.trainingProgramsMap.set(id, newProgram);
    return newProgram;
  }

  async updateTrainingProgram(id: number, program: Partial<InsertTrainingProgram>): Promise<TrainingProgram | undefined> {
    const existingProgram = this.trainingProgramsMap.get(id);
    if (!existingProgram) return undefined;
    
    const updatedProgram = { ...existingProgram, ...program };
    this.trainingProgramsMap.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteTrainingProgram(id: number): Promise<boolean> {
    return this.trainingProgramsMap.delete(id);
  }

  // Module operations
  async getModules(programId?: number): Promise<Module[]> {
    const modules = Array.from(this.modulesMap.values());
    if (programId !== undefined) {
      return modules.filter(module => module.programId === programId);
    }
    return modules;
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modulesMap.get(id);
  }

  async getModuleWithLessons(id: number): Promise<ModuleWithLessons | undefined> {
    const module = this.modulesMap.get(id);
    if (!module) return undefined;
    
    const moduleLessons = Array.from(this.lessonsMap.values())
      .filter(lesson => lesson.moduleId === id);
    
    return {
      ...module,
      lessons: moduleLessons
    };
  }

  async createModule(moduleData: InsertModule): Promise<Module> {
    const id = this.moduleCounter++;
    const newModule: Module = { ...moduleData, id };
    this.modulesMap.set(id, newModule);
    return newModule;
  }

  async updateModule(id: number, moduleData: Partial<InsertModule>): Promise<Module | undefined> {
    const existingModule = this.modulesMap.get(id);
    if (!existingModule) return undefined;
    
    const updatedModule = { ...existingModule, ...moduleData };
    this.modulesMap.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    return this.modulesMap.delete(id);
  }

  // Lesson operations
  async getLessons(moduleId?: number): Promise<Lesson[]> {
    const lessons = Array.from(this.lessonsMap.values());
    if (moduleId !== undefined) {
      return lessons.filter(lesson => lesson.moduleId === moduleId);
    }
    return lessons;
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessonsMap.get(id);
  }

  async createLesson(lessonData: InsertLesson): Promise<Lesson> {
    const id = this.lessonCounter++;
    const newLesson: Lesson = { ...lessonData, id };
    this.lessonsMap.set(id, newLesson);
    return newLesson;
  }

  async updateLesson(id: number, lessonData: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const existingLesson = this.lessonsMap.get(id);
    if (!existingLesson) return undefined;
    
    const updatedLesson = { ...existingLesson, ...lessonData };
    this.lessonsMap.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<boolean> {
    return this.lessonsMap.delete(id);
  }

  // Session operations
  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessionsMap.values());
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessionsMap.get(id);
  }

  async getSessionWithDetails(id: number): Promise<SessionWithDetails | undefined> {
    const session = this.sessionsMap.get(id);
    if (!session) return undefined;
    
    const program = this.trainingProgramsMap.get(session.programId);
    const module = this.modulesMap.get(session.moduleId);
    const resource = session.resourceId ? this.resourcesMap.get(session.resourceId) : undefined;
    
    if (!program || !module) return undefined;
    
    const sessionTrainees = Array.from(this.sessionTraineesMap.values())
      .filter(st => st.sessionId === id);
      
    const trainees = sessionTrainees.map(st => {
      const trainee = this.usersMap.get(st.traineeId);
      return trainee!;
    }).filter(Boolean);
    
    return {
      ...session,
      program,
      module,
      resource,
      trainees,
    };
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.sessionCounter++;
    const newSession: Session = { ...sessionData, id };
    this.sessionsMap.set(id, newSession);
    return newSession;
  }

  async updateSession(id: number, sessionData: Partial<InsertSession>): Promise<Session | undefined> {
    const existingSession = this.sessionsMap.get(id);
    if (!existingSession) return undefined;
    
    const updatedSession = { ...existingSession, ...sessionData };
    this.sessionsMap.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: number): Promise<boolean> {
    return this.sessionsMap.delete(id);
  }

  // SessionTrainee operations
  async getSessionTrainees(sessionId?: number): Promise<SessionTrainee[]> {
    const sessionTrainees = Array.from(this.sessionTraineesMap.values());
    if (sessionId !== undefined) {
      return sessionTrainees.filter(st => st.sessionId === sessionId);
    }
    return sessionTrainees;
  }

  async addTraineeToSession(traineeData: InsertSessionTrainee): Promise<SessionTrainee> {
    const id = this.sessionTraineeCounter++;
    const newSessionTrainee: SessionTrainee = { ...traineeData, id };
    this.sessionTraineesMap.set(id, newSessionTrainee);
    return newSessionTrainee;
  }

  async removeTraineeFromSession(sessionId: number, traineeId: number): Promise<boolean> {
    const sessionTrainee = Array.from(this.sessionTraineesMap.values())
      .find(st => st.sessionId === sessionId && st.traineeId === traineeId);
    
    if (sessionTrainee) {
      return this.sessionTraineesMap.delete(sessionTrainee.id);
    }
    return false;
  }

  // Assessment operations
  async getAssessments(traineeId?: number, sessionId?: number): Promise<Assessment[]> {
    let assessments = Array.from(this.assessmentsMap.values());
    
    if (traineeId !== undefined) {
      assessments = assessments.filter(a => a.traineeId === traineeId);
    }
    
    if (sessionId !== undefined) {
      assessments = assessments.filter(a => a.sessionId === sessionId);
    }
    
    return assessments;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessmentsMap.get(id);
  }

  async getAssessmentWithDetails(id: number): Promise<AssessmentWithDetails | undefined> {
    const assessment = this.assessmentsMap.get(id);
    if (!assessment) return undefined;
    
    const trainee = this.usersMap.get(assessment.traineeId);
    const session = this.sessionsMap.get(assessment.sessionId);
    const module = this.modulesMap.get(assessment.moduleId);
    const instructor = this.usersMap.get(assessment.instructorId);
    
    if (!trainee || !session || !module || !instructor) return undefined;
    
    const grades = Array.from(this.gradesMap.values())
      .filter(g => g.assessmentId === id);
    
    return {
      ...assessment,
      trainee,
      session,
      module,
      instructor,
      grades,
    };
  }

  async createAssessment(assessmentData: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentCounter++;
    const newAssessment: Assessment = { ...assessmentData, id };
    this.assessmentsMap.set(id, newAssessment);
    return newAssessment;
  }

  async updateAssessment(id: number, assessmentData: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const existingAssessment = this.assessmentsMap.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...assessmentData };
    this.assessmentsMap.set(id, updatedAssessment);
    return updatedAssessment;
  }

  async deleteAssessment(id: number): Promise<boolean> {
    return this.assessmentsMap.delete(id);
  }

  // Grade operations
  async getGrades(assessmentId: number): Promise<Grade[]> {
    return Array.from(this.gradesMap.values())
      .filter(g => g.assessmentId === assessmentId);
  }

  async createGrade(gradeData: InsertGrade): Promise<Grade> {
    const id = this.gradeCounter++;
    const newGrade: Grade = { ...gradeData, id };
    this.gradesMap.set(id, newGrade);
    return newGrade;
  }

  async updateGrade(id: number, gradeData: Partial<InsertGrade>): Promise<Grade | undefined> {
    const existingGrade = this.gradesMap.get(id);
    if (!existingGrade) return undefined;
    
    const updatedGrade = { ...existingGrade, ...gradeData };
    this.gradesMap.set(id, updatedGrade);
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    return this.gradesMap.delete(id);
  }

  // Document operations
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documentsMap.values());
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documentsMap.get(id);
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const id = this.documentCounter++;
    const newDocument: Document = { ...documentData, id };
    this.documentsMap.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const existingDocument = this.documentsMap.get(id);
    if (!existingDocument) return undefined;
    
    const updatedDocument = { ...existingDocument, ...documentData };
    this.documentsMap.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documentsMap.delete(id);
  }

  // Resource operations
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resourcesMap.values());
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resourcesMap.get(id);
  }

  async createResource(resourceData: InsertResource): Promise<Resource> {
    const id = this.resourceCounter++;
    const newResource: Resource = { ...resourceData, id };
    this.resourcesMap.set(id, newResource);
    return newResource;
  }

  async updateResource(id: number, resourceData: Partial<InsertResource>): Promise<Resource | undefined> {
    const existingResource = this.resourcesMap.get(id);
    if (!existingResource) return undefined;
    
    const updatedResource = { ...existingResource, ...resourceData };
    this.resourcesMap.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resourcesMap.delete(id);
  }

  // Notification operations
  async getNotifications(recipientId?: number): Promise<Notification[]> {
    const notifications = Array.from(this.notificationsMap.values());
    if (recipientId !== undefined) {
      return notifications.filter(n => n.recipientId === recipientId);
    }
    return notifications;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationCounter++;
    const newNotification: Notification = { ...notificationData, id };
    this.notificationsMap.set(id, newNotification);
    return newNotification;
  }

  async updateNotification(id: number, notificationData: Partial<InsertNotification>): Promise<Notification | undefined> {
    const existingNotification = this.notificationsMap.get(id);
    if (!existingNotification) return undefined;
    
    const updatedNotification = { ...existingNotification, ...notificationData };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notificationsMap.delete(id);
  }

  async markNotificationsAsRead(recipientId: number): Promise<boolean> {
    const notifications = Array.from(this.notificationsMap.values())
      .filter(n => n.recipientId === recipientId && n.status === 'sent');
    
    for (const notification of notifications) {
      this.notificationsMap.set(notification.id, {
        ...notification,
        status: 'read'
      });
    }
    
    return true;
  }
}

export const storage = new MemStorage();
