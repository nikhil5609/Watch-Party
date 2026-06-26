import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "https://watch-party-backend-ry0f.onrender.com",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// response interceptor stays, it's fine
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