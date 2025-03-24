// Simplified storage for Vercel serverless functions
export class MemStorage {
  private users: any[] = [];
  private userId = 1;

  constructor() {
    // Initialize with some demo users
    this.initDemoUsers();
  }

  private initDemoUsers() {
    // Add default admin user
    this.users.push({
      id: this.userId++,
      username: 'admin',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin',
      organizationType: 'ATO',
      organizationName: 'Flight Academy',
      profilePicture: null,
      mfaEnabled: false,
      lastLoginAt: new Date()
    });
    
    // Add instructor user
    this.users.push({
      id: this.userId++,
      username: 'instructor',
      password: 'instructor123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'instructor@flight-academy.com',
      role: 'instructor',
      organizationType: 'ATO',
      organizationName: 'Flight Academy',
      profilePicture: null,
      mfaEnabled: false,
      lastLoginAt: new Date()
    });
    
    // Add trainee user
    this.users.push({
      id: this.userId++,
      username: 'trainee',
      password: 'trainee123',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'trainee@example.com',
      role: 'trainee',
      organizationType: 'ATO',
      organizationName: 'Flight Academy',
      profilePicture: null,
      mfaEnabled: false,
      lastLoginAt: new Date()
    });
  }

  async getUser(id: number): Promise<any> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return this.users.find(user => user.username === username);
  }

  async createUser(user: any): Promise<any> {
    const newUser = {
      ...user,
      id: this.userId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getAllUsers(): Promise<any[]> {
    return [...this.users];
  }

  async getUsersByRole(role: string): Promise<any[]> {
    return this.users.filter(user => user.role === role);
  }
}