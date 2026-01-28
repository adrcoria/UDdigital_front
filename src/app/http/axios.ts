import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig
} from "axios";
import appConfigs from "@/app/appConfigurations";
import { accountService } from "./httpServiceProvider";
import router from "@/router";

const SESSION_EXPIRED_FLAG = "sessionExpired";
const SESSION_EXPIRED_ALERT_SHOWN = "sessionExpiredAlertShown";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: appConfigs.baseUrl,
});

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/refresh",
];

const isPublicEndpoint = (url?: string) =>
  PUBLIC_ENDPOINTS.some(endpoint => url?.includes(endpoint));

const isPresignedUrl = (url?: string) =>
  url?.includes("bucket") || url?.includes("s3.amazonaws.com");

// -------------------- REQUEST --------------------
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const skipAuth =
      isPublicEndpoint(config.url) ||
      isPresignedUrl(config.url);

    if (!skipAuth) {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return config;
  },
  error => Promise.reject(error)
);

// -------------------- RESPONSE --------------------
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  response => response,
  async (
    error: AxiosError & {
      config: InternalAxiosRequestConfig & { _retry?: boolean };
    }
  ) => {
    const originalRequest = error.config;

    const isAuth = isPublicEndpoint(originalRequest.url);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuth
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) {
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          localStorage.getItem("refreshToken") ||
          sessionStorage.getItem("refreshToken");

        if (!refreshToken) throw new Error("No refresh token available");

        const resp = await accountService.refreshToken(refreshToken);
        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          accesTokenExpiresIn,
          refreshTokenExpiresIn,
        } = resp.data.data;

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("accesTokenExpiresIn", accesTokenExpiresIn);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("refreshTokenExpiresIn", refreshTokenExpiresIn);

        axiosInstance.defaults.headers.common.set(
          "Authorization",
          `Bearer ${newAccessToken}`
        );

        processQueue(null, newAccessToken);

        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`
        );

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        sessionStorage.setItem(SESSION_EXPIRED_FLAG, "true");
        sessionStorage.removeItem(SESSION_EXPIRED_ALERT_SHOWN);
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("accesTokenExpiresIn");
        localStorage.removeItem("refreshTokenExpiresIn");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        router.push({ path: "/signin" });
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
