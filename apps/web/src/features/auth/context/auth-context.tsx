import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserDTO } from '@tracker/types';
import { LoginInput, RegisterInput } from '@tracker/validation';
import { authApi } from '../api/auth-api';

interface AuthContextType {
  user: UserDTO | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: (user: UserDTO) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { user: currentUser } = await authApi.fetchMe();
      setUser(currentUser);
    } catch {
      // Keep existing user state if network error
    }
  };

  const updateCurrentUser = (updatedUser: UserDTO) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { user: currentUser } = await authApi.fetchMe();
        if (isMounted) setUser(currentUser);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (input: LoginInput) => {
    const { user: loggedInUser } = await authApi.login(input);
    setUser(loggedInUser);
  };

  const register = async (input: RegisterInput) => {
    const { user: registeredUser } = await authApi.register(input);
    setUser(registeredUser);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateCurrentUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
