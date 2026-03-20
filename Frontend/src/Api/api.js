import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "https://watch-party-backend-d12q.onrender.com",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* =====================
   REQUEST INTERCEPTOR
===================== */
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

      // Optional: auto logout on 401
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        // window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
