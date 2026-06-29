import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "https://watch-party-backend-ry0f.onrender.com",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network error or server down");
    } else {
      console.error(`Error ${error.response.status}:`, error.response.data);
    }
    return Promise.reject(error);
  }
);