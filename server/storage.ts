import { 
  User, 
  InsertUser, 
  TrainingProgram, 
  InsertTrainingProgram,
  Module,
  InsertModule,
  Lesson,
  InsertLesson,
  Session,
  InsertSession,
  SessionTrainee,
  InsertSessionTrainee,
  Assessment,
  InsertAssessment,
  Grade,
  InsertGrade,
  Document,
  InsertDocument,
  Resource,
  InsertResource,
  Notification,
  InsertNotification
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Training Program methods
  getProgram(id: number): Promise<TrainingProgram | undefined>;
  getAllPrograms(): Promise<TrainingProgram[]>;
  createProgram(program: InsertTrainingProgram): Promise<TrainingProgram>;
  updateProgram(id: number, program: Partial<TrainingProgram>): Promise<TrainingProgram | undefined>;
  deleteProgram(id: number): Promise<boolean>;

  // Module methods
  getModule(id: number): Promise<Module | undefined>;
  getModulesByProgram(programId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;

  // Lesson methods
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByModule(moduleId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;

  // Session methods
  getSession(id: number): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  getSessionsByInstructor(instructorId: number): Promise<Session[]>;
  getSessionsByTrainee(traineeId: number): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;

  // Session Trainee methods
  getSessionTrainees(sessionId: number): Promise<number[]>;
  addTraineeToSession(sessionTrainee: InsertSessionTrainee): Promise<SessionTrainee>;
  removeTraineeFromSession(sessionId: number, traineeId: number): Promise<boolean>;

  // Assessment methods
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByTrainee(traineeId: number): Promise<Assessment[]>;
  getAssessmentsByInstructor(instructorId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<Assessment>): Promise<Assessment | undefined>;

  // Grade methods
  getGradesByAssessment(assessmentId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;

  // Resource methods
  getResource(id: number): Promise<Resource | undefined>;
  getAllResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;

  // Notification methods
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotificationStatus(id: number, status: string): Promise<Notification | undefined>;

  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private programs: Map<number, TrainingProgram>;
  private modules: Map<number, Module>;
  private lessons: Map<number, Lesson>;
  private sessions: Map<number, Session>;
  private sessionTrainees: Map<number, SessionTrainee>;
  private assessments: Map<number, Assessment>;
  private grades: Map<number, Grade>;
  private documents: Map<number, Document>;
  private resources: Map<number, Resource>;
  private notifications: Map<number, Notification>;
  public sessionStore: session.SessionStore;

  private userIdCounter: number;
  private programIdCounter: number;
  private moduleIdCounter: number;
  private lessonIdCounter: number;
  private sessionIdCounter: number;
  private sessionTraineeIdCounter: number;
  private assessmentIdCounter: number;
  private gradeIdCounter: number;
  private documentIdCounter: number;
  private resourceIdCounter: number;
  private notificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.programs = new Map();
    this.modules = new Map();
    this.lessons = new Map();
    this.sessions = new Map();
    this.sessionTrainees = new Map();
    this.assessments = new Map();
    this.grades = new Map();
    this.documents = new Map();
    this.resources = new Map();
    this.notifications = new Map();

    this.userIdCounter = 1;
    this.programIdCounter = 1;
    this.moduleIdCounter = 1;
    this.lessonIdCounter = 1;
    this.sessionIdCounter = 1;
    this.sessionTraineeIdCounter = 1;
    this.assessmentIdCounter = 1;
    this.gradeIdCounter = 1;
    this.documentIdCounter = 1;
    this.resourceIdCounter = 1;
    this.notificationIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Training Program methods
  async getProgram(id: number): Promise<TrainingProgram | undefined> {
    return this.programs.get(id);
  }

  async getAllPrograms(): Promise<TrainingProgram[]> {
    return Array.from(this.programs.values());
  }

  async createProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const id = this.programIdCounter++;
    const newProgram: TrainingProgram = { ...program, id };
    this.programs.set(id, newProgram);
    return newProgram;
  }

  async updateProgram(id: number, program: Partial<TrainingProgram>): Promise<TrainingProgram | undefined> {
    const existingProgram = this.programs.get(id);
    if (!existingProgram) return undefined;

    const updatedProgram = { ...existingProgram, ...program };
    this.programs.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    return this.programs.delete(id);
  }

  // Module methods
  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async getModulesByProgram(programId: number): Promise<Module[]> {
    return Array.from(this.modules.values()).filter(
      module => module.programId === programId
    );
  }

  async createModule(module: InsertModule): Promise<Module> {
    const id = this.moduleIdCounter++;
    const newModule: Module = { ...module, id };
    this.modules.set(id, newModule);
    return newModule;
  }

  async updateModule(id: number, module: Partial<Module>): Promise<Module | undefined> {
    const existingModule = this.modules.get(id);
    if (!existingModule) return undefined;

    const updatedModule = { ...existingModule, ...module };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    return this.modules.delete(id);
  }

  // Lesson methods
  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values()).filter(
      lesson => lesson.moduleId === moduleId
    );
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonIdCounter++;
    const newLesson: Lesson = { ...lesson, id };
    this.lessons.set(id, newLesson);
    return newLesson;
  }

  async updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson | undefined> {
    const existingLesson = this.lessons.get(id);
    if (!existingLesson) return undefined;

    const updatedLesson = { ...existingLesson, ...lesson };
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<boolean> {
    return this.lessons.delete(id);
  }

  // Session methods
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionsByInstructor(instructorId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      session => session.instructorId === instructorId
    );
  }

  async getSessionsByTrainee(traineeId: number): Promise<Session[]> {
    const traineeSessionIds = new Set(
      Array.from(this.sessionTrainees.values())
        .filter(st => st.traineeId === traineeId)
        .map(st => st.sessionId)
    );
    
    return Array.from(this.sessions.values()).filter(
      session => traineeSessionIds.has(session.id)
    );
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const newSession: Session = { ...session, id };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async updateSession(id: number, session: Partial<Session>): Promise<Session | undefined> {
    const existingSession = this.sessions.get(id);
    if (!existingSession) return undefined;

    const updatedSession = { ...existingSession, ...session };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: number): Promise<boolean> {
    return this.sessions.delete(id);
  }

  // Session Trainee methods
  async getSessionTrainees(sessionId: number): Promise<number[]> {
    return Array.from(this.sessionTrainees.values())
      .filter(st => st.sessionId === sessionId)
      .map(st => st.traineeId);
  }

  async addTraineeToSession(sessionTrainee: InsertSessionTrainee): Promise<SessionTrainee> {
    const id = this.sessionTraineeIdCounter++;
    const newSessionTrainee: SessionTrainee = { ...sessionTrainee, id };
    this.sessionTrainees.set(id, newSessionTrainee);
    return newSessionTrainee;
  }

  async removeTraineeFromSession(sessionId: number, traineeId: number): Promise<boolean> {
    const sessionTraineeToRemove = Array.from(this.sessionTrainees.values()).find(
      st => st.sessionId === sessionId && st.traineeId === traineeId
    );
    
    if (!sessionTraineeToRemove) return false;
    return this.sessionTrainees.delete(sessionTraineeToRemove.id);
  }

  // Assessment methods
  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getAssessmentsByTrainee(traineeId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(
      assessment => assessment.traineeId === traineeId
    );
  }

  async getAssessmentsByInstructor(instructorId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(
      assessment => assessment.instructorId === instructorId
    );
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const newAssessment: Assessment = { ...assessment, id };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }

  async updateAssessment(id: number, assessment: Partial<Assessment>): Promise<Assessment | undefined> {
    const existingAssessment = this.assessments.get(id);
    if (!existingAssessment) return undefined;

    const updatedAssessment = { ...existingAssessment, ...assessment };
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  // Grade methods
  async getGradesByAssessment(assessmentId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(
      grade => grade.assessmentId === assessmentId
    );
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const id = this.gradeIdCounter++;
    const newGrade: Grade = { ...grade, id };
    this.grades.set(id, newGrade);
    return newGrade;
  }

  async updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined> {
    const existingGrade = this.grades.get(id);
    if (!existingGrade) return undefined;

    const updatedGrade = { ...existingGrade, ...grade };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const newDocument: Document = { ...document, id };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Resource methods
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.resourceIdCounter++;
    const newResource: Resource = { ...resource, id };
    this.resources.set(id, newResource);
    return newResource;
  }

  async updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) return undefined;

    const updatedResource = { ...existingResource, ...resource };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }

  // Notification methods
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      notification => notification.recipientId === userId
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification: Notification = { ...notification, id };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async updateNotificationStatus(id: number, status: string): Promise<Notification | undefined> {
    const existingNotification = this.notifications.get(id);
    if (!existingNotification) return undefined;

    const updatedNotification = { ...existingNotification, status };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

export const storage = new MemStorage();
