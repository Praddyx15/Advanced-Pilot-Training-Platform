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
import { 
  SyllabusGenerationOptions, 
  GeneratedSyllabus, 
  ExtractedModule, 
  ExtractedLesson 
} from "@shared/syllabus-types";
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
  
  // Syllabus Generator methods
  generateSyllabusFromDocument(documentId: number, options: SyllabusGenerationOptions): Promise<GeneratedSyllabus>;
  saveSyllabusAsProgram(syllabus: GeneratedSyllabus, createdById: number): Promise<TrainingProgram>;

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
  sessionStore: session.Store;
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
  public sessionStore: session.Store;

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

  // Syllabus Generator methods
  async generateSyllabusFromDocument(documentId: number, options: SyllabusGenerationOptions): Promise<GeneratedSyllabus> {
    // Get the document
    const document = await this.getDocument(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // In a real implementation, this would use NLP/ML to extract content from the document
    // For this prototype, we'll generate a sample syllabus based on the options
    
    // Create modules based on program type
    let modules: ExtractedModule[] = [];
    let lessons: ExtractedLesson[] = [];
    let totalDuration = options.defaultDuration;
    
    if (options.programType === 'initial_type_rating') {
      // Sample modules for initial type rating
      modules = [
        {
          name: "Aircraft Systems Knowledge",
          description: "Overview of aircraft systems including hydraulics, electrical, and avionics",
          type: "ground",
          competencies: [
            {
              name: "Systems Knowledge",
              description: "Understanding of aircraft systems operation and limitations",
              assessmentCriteria: ["Can explain system components", "Can describe normal operation", "Can identify failure modes"]
            }
          ],
          recommendedDuration: 40,
          regulatoryRequirements: ["FAR 61.31", "EASA FCL.725"]
        },
        {
          name: "Normal Procedures",
          description: "Standard operating procedures for normal flight operations",
          type: "simulator",
          competencies: [
            {
              name: "SOP Application",
              description: "Correct application of standard operating procedures",
              assessmentCriteria: ["Follows checklist sequence", "Performs procedures accurately", "Maintains appropriate CRM"]
            }
          ],
          recommendedDuration: 24,
          regulatoryRequirements: ["FAR 61.31(a)", "EASA FCL.725(a)"]
        },
        {
          name: "Emergency Procedures",
          description: "Procedures for handling aircraft emergencies and abnormal situations",
          type: "simulator",
          competencies: [
            {
              name: "Emergency Response",
              description: "Effective handling of emergency situations",
              assessmentCriteria: ["Correctly identifies emergency", "Follows appropriate checklist", "Maintains aircraft control"]
            }
          ],
          recommendedDuration: 16,
          regulatoryRequirements: ["FAR 61.31(b)", "EASA FCL.725(b)"]
        }
      ];
      
      // Sample lessons for each module
      lessons = [
        {
          name: "Hydraulic System Overview",
          description: "Detailed study of the aircraft hydraulic system",
          content: "Content extracted from document page 24-36: hydraulic system description",
          type: "document",
          moduleIndex: 0,
          duration: 120,
          learningObjectives: ["Understand hydraulic system architecture", "Identify hydraulic system components"]
        },
        {
          name: "Electrical System",
          description: "Study of aircraft electrical systems",
          content: "Content extracted from document page 37-48: electrical system description",
          type: "document",
          moduleIndex: 0,
          duration: 120,
          learningObjectives: ["Understand electrical system architecture", "Identify electrical failures"]
        },
        {
          name: "Normal Takeoff Procedures",
          description: "Procedures for normal takeoff operations",
          content: "Content extracted from document page 112-115: takeoff procedures",
          type: "video",
          moduleIndex: 1,
          duration: 90,
          learningObjectives: ["Perform normal takeoff checklist", "Apply correct takeoff technique"]
        },
        {
          name: "Engine Fire During Takeoff",
          description: "Handling engine fire emergency during takeoff",
          content: "Content extracted from document page 245-248: engine fire procedures",
          type: "interactive",
          moduleIndex: 2,
          duration: 120,
          learningObjectives: ["Identify engine fire indications", "Apply engine fire checklist", "Decision making for takeoff abort or continuation"]
        }
      ];
    } else if (options.programType === 'recurrent') {
      // Sample modules for recurrent training
      modules = [
        {
          name: "Systems Review",
          description: "Review of critical aircraft systems",
          type: "ground",
          competencies: [
            {
              name: "Systems Knowledge",
              description: "Retention of aircraft systems knowledge",
              assessmentCriteria: ["Recalls system components", "Explains system operation", "Describes failure modes"]
            }
          ],
          recommendedDuration: 8,
          regulatoryRequirements: ["FAR 61.58", "EASA FCL.740"]
        },
        {
          name: "Emergency Procedures Review",
          description: "Review of emergency and abnormal procedures",
          type: "simulator",
          competencies: [
            {
              name: "Emergency Management",
              description: "Effective handling of emergency and abnormal situations",
              assessmentCriteria: ["Correctly identifies situation", "Applies appropriate procedure", "Maintains aircraft control"]
            }
          ],
          recommendedDuration: 4,
          regulatoryRequirements: ["FAR 61.58(a)", "EASA FCL.740(a)"]
        }
      ];
      
      totalDuration = 3; // 3 days for recurrent
      
      // Add sample lessons for recurrent training
      lessons = [
        {
          name: "Critical Systems Review",
          description: "Review of critical aircraft systems",
          content: "Content extracted from document page 10-15: critical systems summary",
          type: "document",
          moduleIndex: 0,
          duration: 180,
          learningObjectives: ["Recall hydraulic system architecture", "Recall electrical system operation"]
        },
        {
          name: "Engine Failure Scenarios",
          description: "Review of engine failure scenarios",
          content: "Content extracted from document page 200-205: engine failure procedures",
          type: "interactive",
          moduleIndex: 1,
          duration: 240,
          learningObjectives: ["Review engine failure indications", "Practice engine failure checklists"]
        }
      ];
    } else if (options.programType === 'joc_mcc') {
      // Sample modules for JOC/MCC
      modules = [
        {
          name: "Multi-Crew Cooperation Principles",
          description: "Fundamentals of crew coordination and communication",
          type: "ground",
          competencies: [
            {
              name: "CRM Application",
              description: "Effective application of CRM principles",
              assessmentCriteria: ["Demonstrates clear communication", "Shows situational awareness", "Applies workload management"]
            }
          ],
          recommendedDuration: 16,
          regulatoryRequirements: ["EASA FCL.735.A"]
        },
        {
          name: "Task Sharing and Crew Coordination",
          description: "Practical application of task sharing in normal and abnormal situations",
          type: "simulator",
          competencies: [
            {
              name: "Task Management",
              description: "Effective distribution and execution of flight deck tasks",
              assessmentCriteria: ["Clear role definition", "Proper task handover", "Cross-verification procedures"]
            }
          ],
          recommendedDuration: 20,
          regulatoryRequirements: ["EASA FCL.735.A(b)"]
        }
      ];
      
      totalDuration = 10; // 10 days for JOC/MCC
      
      // Add sample lessons for JOC/MCC
      lessons = [
        {
          name: "CRM Fundamentals",
          description: "Fundamentals of Crew Resource Management",
          content: "Content extracted from document page 50-65: CRM principles",
          type: "interactive",
          moduleIndex: 0,
          duration: 240,
          learningObjectives: ["Understand CRM principles", "Apply communication techniques"]
        },
        {
          name: "PF/PM Coordination",
          description: "Coordination between Pilot Flying and Pilot Monitoring",
          content: "Content extracted from document page 70-85: PF/PM duties",
          type: "video",
          moduleIndex: 1,
          duration: 180,
          learningObjectives: ["Define PF/PM responsibilities", "Practice crew coordination"]
        }
      ];
    }
    
    // Return the generated syllabus
    return {
      name: `${options.programType.charAt(0).toUpperCase() + options.programType.slice(1)} Training Program${options.aircraftType ? ` - ${options.aircraftType}` : ''}`,
      description: `Training program generated from document "${document.title}"`,
      programType: options.programType,
      aircraftType: options.aircraftType,
      regulatoryAuthority: options.regulatoryAuthority,
      totalDuration,
      modules,
      lessons,
      regulatoryCompliance: {
        authority: options.regulatoryAuthority || 'easa',
        requirementsMet: ['Basic training requirements', 'Minimum training hours'],
        requirementsPartiallyMet: ['Specific aircraft procedures'],
        requirementsNotMet: []
      },
      confidenceScore: 85 // 85% confidence in extraction accuracy
    };
  }
  
  async saveSyllabusAsProgram(syllabus: GeneratedSyllabus, createdById: number): Promise<TrainingProgram> {
    // Create a new program
    const program = await this.createProgram({
      name: syllabus.name,
      description: syllabus.description,
      createdById
    });
    
    // Create modules for the program
    for (let i = 0; i < syllabus.modules.length; i++) {
      const moduleData = syllabus.modules[i];
      const module = await this.createModule({
        name: moduleData.name,
        programId: program.id
      });
      
      // Find lessons for this module
      const moduleLessons = syllabus.lessons.filter(l => l.moduleIndex === i);
      
      // Create lessons for the module
      for (const lessonData of moduleLessons) {
        await this.createLesson({
          name: lessonData.name,
          moduleId: module.id,
          type: lessonData.type,
          content: lessonData.content
        });
      }
    }
    
    return program;
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
    const newUser: User = {
      ...user,
      id,
      organizationType: user.organizationType || null,
      organizationName: user.organizationName || null,
      authProvider: user.authProvider || "local",
      authProviderId: user.authProviderId || null,
      profilePicture: user.profilePicture || null
    };
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
    const newProgram: TrainingProgram = { 
      ...program, 
      id,
      description: program.description || null 
    };
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
    const newSession: Session = { 
      ...session, 
      id,
      resourceId: session.resourceId || null
    };
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
    const newGrade: Grade = { 
      ...grade, 
      id,
      comments: grade.comments || null 
    };
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
    const newDocument: Document = { 
      ...document, 
      id,
      description: document.description || null 
    };
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
