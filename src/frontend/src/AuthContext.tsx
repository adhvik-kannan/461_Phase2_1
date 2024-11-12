// src/frontend/src/AuthContext.tsx
import React, { createContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  username: string | null;
  login: (admin: boolean, username: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  username: null,
  login: () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);

  const login = (admin: boolean, user: string) => {
    setIsLoggedIn(true);
    setIsAdmin(admin);
    setUsername(user);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};