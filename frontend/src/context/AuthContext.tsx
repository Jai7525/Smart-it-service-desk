import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<UserProfile>;
  logout: () => void;
  availableUsers: any[];
  refreshUsers: () => Promise<void>;
}

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
    return null;
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const dbUsers = await api.admin.listUsers();
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        setAvailableUsers(dbUsers);
      }
    } catch (e) {
      console.warn('Could not fetch registered users:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const login = async (email: string): Promise<UserProfile> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Please enter your work email address.');
    }

    // Call backend login endpoint (searches live Supabase DB)
    const profileData = await api.auth.login(cleanEmail);

    const loggedProfile: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      full_name: profileData.full_name,
      role: profileData.role as UserRole,
      is_active: profileData.is_active,
      is_available: profileData.is_available,
      department_name: profileData.department_name || 'IT Operations',
    };

    // Store active session
    setUser(loggedProfile);
    localStorage.setItem('smartticket_current_user', JSON.stringify(loggedProfile));

    // Refresh directory
    fetchUsers().catch(() => {});

    return loggedProfile;
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
        refreshUsers: fetchUsers,
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
