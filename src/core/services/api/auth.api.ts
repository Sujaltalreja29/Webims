import { User } from '../../models';
import { storageService } from '../storage.service';

class AuthApiService {
  private currentUserKey = 'current_user';
  private usersKey = 'users';

  login(email: string, password: string): Promise<User | null> {
    const users = storageService.get<User[]>(this.usersKey) || [];
    const user = users.find(u => u.email === email && u.password === password && u.isActive);
    
    if (user) {
      storageService.set(this.currentUserKey, user);
      return Promise.resolve(user);
    }
    
    return Promise.resolve(null);
  }

  register(userData: {
    fullName: string;
    email: string;
    password: string;
    role: User['role'];
    department: User['department'];
    phone?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    const users = storageService.get<User[]>(this.usersKey) || [];
    
    // Check if email already exists
    if (users.some(u => u.email === userData.email)) {
      return Promise.resolve({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      department: userData.department,
      phone: userData.phone,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.push(newUser);
    storageService.set(this.usersKey, users);

    // Auto-login after registration
    storageService.set(this.currentUserKey, newUser);

    return Promise.resolve({
      success: true,
      message: 'Registration successful',
      user: newUser
    });
  }

  logout(): Promise<void> {
    storageService.remove(this.currentUserKey);
    return Promise.resolve();
  }

  getCurrentUser(): User | null {
    return storageService.get<User>(this.currentUserKey);
  }

  switchRole(userId: string): Promise<User | null> {
    const users = storageService.get<User[]>(this.usersKey) || [];
    const user = users.find(u => u.id === userId);
    
    if (user) {
      storageService.set(this.currentUserKey, user);
      return Promise.resolve(user);
    }
    
    return Promise.resolve(null);
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

    async getUserById(userId: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.id === userId) || null;
  }

  getAllUsers(): User[] {
    return storageService.get<User[]>(this.usersKey) || [];
  }
}

export const authApi = new AuthApiService();