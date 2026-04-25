import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import tenantApi from "../Services/ApiService";

export type AuthStatus = "unauthenticated" | "authenticated" | "checking";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  status: AuthStatus;
}

export interface AuthContextValue extends AuthState {
  setAuthFromMe: (payload: {
    id: number;
    tenant_id: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  }) => void;
  clearAuth: () => void;
  refreshMe: () => Promise<void>;
}

const AUTH_STORAGE_KEY = "auth_state";

const initialState: AuthState = {
  user: null,
  tenantId: null,
  roles: [],
  permissions: [],
  status: "unauthenticated",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>(initialState);

  const setAuthFromMe: AuthContextValue["setAuthFromMe"] = useCallback(
    (payload) => {
      const next: AuthState = {
        user: {
          id: payload.id,
          name: payload.name,
          email: payload.email,
        },
        roles: payload.roles || [],
        tenantId: payload.tenant_id,
        permissions: payload.permissions || [],
        status: "authenticated",
      };

      setState(next);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
        }
      } catch {
        // ignore storage errors
      }
    },
    [],
  );

  const clearAuth: AuthContextValue["clearAuth"] = useCallback(() => {
    setState(initialState);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await tenantApi.get("/auth/refresh");
      if (res.status === 200 && res.data) {
        const userData = res.data.data || res.data;
        setAuthFromMe({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          roles: userData.roles || [],
          permissions: userData.permissions || [],
          tenant_id: userData.tenant_id || userData.org_id,
        });
      }
    } catch (error: any) {
      // Only clear if truly unauthorized
      if (error.response?.status === 401) {
        clearAuth();
      }
    }
  }, [clearAuth, setAuthFromMe]);



  // Initial hydration from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;

      const cached = JSON.parse(raw) as AuthState | null;
      if (cached && cached.user) {
        // Provisional state from cache, then verify
        setState({
          user: cached.user,
          roles: cached.roles || [],
          permissions: cached.permissions || [],
          status: "checking",
          tenantId: cached.tenantId || null,
        });

        void refreshMe();
      }
    } catch {
      // ignore parse/storage errors
    }
    // we intentionally exclude refreshMe from deps to avoid re-running
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    ...state,
    setAuthFromMe,
    clearAuth,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
