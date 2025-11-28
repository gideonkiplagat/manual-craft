import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  plan_type?: string; // e.g. "free", "pro", "team"
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    // Optionally store in localStorage
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    // ensure axios sends auth header for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    axios.defaults.headers.common['Authorization'] = undefined;
  };

  // initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.debug('[AuthContext] initialized token from localStorage');
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.debug('[AuthContext] initialized user from localStorage');
      }
    } catch (err) {
      // ignore parse errors
    }

    // add a lightweight axios interceptor for debugging and auto-logout on 401
    const reqId = axios.interceptors.request.use((cfg) => {
      // attach token if missing
      const t = localStorage.getItem('token');
      if (t && !cfg.headers?.Authorization && !cfg.headers?.authorization) {
        cfg.headers = cfg.headers || {};
        cfg.headers['Authorization'] = `Bearer ${t}`;
      }
      console.debug('[axios] request', cfg.method, cfg.url, cfg.headers && {hasAuth: !!cfg.headers['Authorization']});
      return cfg;
    });

    const resId = axios.interceptors.response.use(
      (res) => {
        console.debug('[axios] response', res.config.url, res.status);
        return res;
      },
      (error) => {
        const status = error?.response?.status;
        console.warn('[axios] response error', error?.config?.url, status);
        if (status === 401) {
          // clear token and user on 401
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          axios.defaults.headers.common['Authorization'] = undefined;
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
// alias to match components expecting useAuth()
export const useAuth = useAuthContext;
