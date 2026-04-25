import type { User } from "../Types/Index";
import tenantApi from "./ApiService";

export const login = async ({ email, password }: User) => {
  const response = await tenantApi.post("/auth/login", { email, password });
  const token = response.data?.token || response.data?.data?.token;
  if (token) {
    localStorage.setItem("token", token);
  }
  return response.data;
};

export const logout = () => {
  // 4. CONSISTENTLY REMOVE THE TOKEN UNDER THE KEY 'token'
  localStorage.removeItem("token");
  // Optionally, you can also redirect here or in the component
  // window.location.href = "/login";
};

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

// This function will be used by your ProtectedRoute
export const isLoggedIn = (): boolean => {
  const token = localStorage.getItem("token");
  return !!token; // Returns true if token exists, false otherwise
};
