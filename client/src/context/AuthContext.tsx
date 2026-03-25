import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import api, { type AuthResponse, type User } from "../services/api";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  ward: string;
  address: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistSession = (session: AuthResponse) => {
  localStorage.setItem("civic-connect-token", session.token);
  localStorage.setItem("civic-connect-user", JSON.stringify(session.user));
};

const persistUser = (user: User) => {
  localStorage.setItem("civic-connect-user", JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem("civic-connect-token");
  localStorage.removeItem("civic-connect-user");
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("civic-connect-user");
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("civic-connect-token"));
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(localStorage.getItem("civic-connect-token")));

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ data: User }>("/auth/me");
        setUser(response.data.data);
        persistUser(response.data.data);
      } catch {
        clearSession();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ data: AuthResponse }>("/auth/login", { email, password });
    const session = response.data.data;
    persistSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await api.post<{ data: AuthResponse }>("/auth/register", payload);
    const session = response.data.data;
    persistSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    persistUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      logout,
      updateCurrentUser,
    }),
    [isLoading, login, logout, register, token, updateCurrentUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
