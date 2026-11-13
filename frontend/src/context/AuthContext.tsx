import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  availableUsers: any[];
}

const defaultProfiles: Record<UserRole, UserProfile> = {
  employee: {
    id: '53045a69-3c53-4fb1-aa88-a1007fd4620d',
    email: 'employee.john@smartticket.local',
    full_name: 'John Doe',
    role: 'employee',
    is_active: true,
    is_available: true,
    department_name: 'Human Resources',
  },
  agent: {
    id: 'ea9fc347-34d1-4354-8a2d-014367671978',
    email: 'agent.network@smartticket.local',
    full_name: 'Alex Rivers',
    role: 'agent',
    is_active: true,
    is_available: true,
    department_name: 'Network Operations',
  },
  manager: {
    id: 'a11a0fa4-1810-4b2f-83f6-ea97b960ccd8',
    email: 'manager@smartticket.local',
    full_name: 'Sarah Connor',
    role: 'manager',
    is_active: true,
    is_available: true,
    department_name: 'IT Operations',
  },
  admin: {
    id: '87802267-6afe-4676-b08e-eb15afce0bbe',
    email: 'admin@smartticket.local',
    full_name: 'System Administrator',
    role: 'admin',
    is_active: true,
    is_available: true,
    department_name: 'Executive & Admin',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('smartticket_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return defaultProfiles.employee;
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const dbUsers = await api.admin.listUsers();
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        setAvailableUsers(dbUsers);
      }
    } catch (e) {
      console.warn('Could not fetch Supabase users:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const login = async (email: string, role: UserRole): Promise<boolean> => {
    // 1. Try to find match in live Supabase users
    const match = availableUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      // Validate that account has the requested role or admin permissions
      if (match.role !== role && match.role !== 'admin') {
        throw new Error(
          `This account is registered as '${match.role.toUpperCase()}', not '${role.toUpperCase()}'. Please select the matching role box.`
        );
      }

      const loggedProfile: UserProfile = {
        id: match.id,
        email: match.email,
        full_name: match.full_name,
        role: match.role as UserRole,
        is_active: match.is_active,
        is_available: match.is_available,
        department_name: 'Corporate IT',
      };

      setUser(loggedProfile);
      localStorage.setItem('smartticket_current_user', JSON.stringify(loggedProfile));
      return true;
    }

    // 2. Fallback to default persona if offline or testing
    const fallback = defaultProfiles[role];
    if (fallback) {
      const loggedProfile: UserProfile = {
        ...fallback,
        email: email || fallback.email,
      };
      setUser(loggedProfile);
      localStorage.setItem('smartticket_current_user', JSON.stringify(loggedProfile));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartticket_current_user');
    localStorage.removeItem('supabase_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        availableUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
