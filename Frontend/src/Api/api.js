import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "http://localhost:3300",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const getTokenFromCookie = () => {
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

/* =====================
   REQUEST INTERCEPTOR
===================== */
axiosClient.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookie() || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================
   RESPONSE INTERCEPTOR
===================== */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network error or server down");
    } else {
      console.error(
        `Error ${error.response.status}:`,
        error.response.data
      );

    }

    return Promise.reject(error);
  }
);
