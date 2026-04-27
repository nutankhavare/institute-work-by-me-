

import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || `http://localhost:7071/api`;
export const tenantAsset = `http://${window.location.hostname}:4000/tenancy/assets/`;

export const centralAsset = `http://${window.location.hostname}:4000/storage/`;
export const centralUrl = `http://${window.location.hostname}:4000/api`;

const tenantApi = axios.create({
  baseURL: baseURL,
  withCredentials: false, // Set to false for Azure Function App + JWT tokens
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 2. CONFIGURE INTERCEPTOR WITH THE CORRECT LOCAL STORAGE KEY
tenantApi.interceptors.request.use(
  (config) => {
    // We will consistently use the key 'token'
    const token = localStorage.getItem("token");

    if (token) {
      // Laravel Sanctum expects the token prefixed with 'Bearer '
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// This response interceptor handles 401 errors
let isRedirecting = false;
tenantApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh");

    if (
      error.response &&
      error.response.status === 401 &&
      !isAuthEndpoint &&
      window.location.pathname !== "/login" &&
      !isRedirecting
    ) {
      console.error("Unauthorized access! Redirecting to login.");
      isRedirecting = true;
      localStorage.removeItem("token");
      localStorage.removeItem("auth_state");
      window.location.href = "/login";
      setTimeout(() => { isRedirecting = false; }, 3000);
    }
    return Promise.reject(error);
  },
);

export default tenantApi;
