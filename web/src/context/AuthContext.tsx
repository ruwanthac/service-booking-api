import { createContext, useContext, useState, type ReactNode } from 'react';
import { api } from '../api/client';

interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('accessToken'),
  );

  async function login(email: string, password: string) {
    const { accessToken } = await api.post<{ accessToken: string }>(
      '/auth/login',
      { email, password },
    );
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
