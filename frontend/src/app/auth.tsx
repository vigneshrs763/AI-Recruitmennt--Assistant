import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  companyName?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('recruitai_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('recruitai_token');
    const storedUser = localStorage.getItem('recruitai_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (nextToken: string, nextUser: User) => {
    localStorage.setItem('recruitai_token', nextToken);
    localStorage.setItem('recruitai_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('recruitai_token');
    localStorage.removeItem('recruitai_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const nextUser = data.user;
        setUser(nextUser);
        localStorage.setItem('recruitai_user', JSON.stringify(nextUser));
      }
    } catch {
      // ignore refresh failures
    }
  };

  const value = useMemo(() => ({ user, token, loading, login, logout, refreshProfile }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
