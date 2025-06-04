import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, CLIENT_ID, CLIENT_SECRET } from "@env";
import { endpoints } from "./Apis";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};


axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (!refreshToken) {
          console.warn("Không tìm thấy refresh token, cần đăng nhập lại.");
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("refreshToken");
          return Promise.reject("Phiên đăng nhập đã hết hạn.");
        }

        const response = await axios.post(`${BASE_URL}${endpoints.refresh}`, {
          refresh_token: refreshToken,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "refresh_token",
        });

        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        await AsyncStorage.setItem("token", newAccessToken);
        await AsyncStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("refreshToken");
        console.warn("Refresh token không hợp lệ. Cần đăng nhập lại.");
        return Promise.reject(err?.response?.data?.message || "Phiên đăng nhập đã hết hạn.");
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
