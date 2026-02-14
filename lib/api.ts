import axios from "axios";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/u") || (path !== "/" && !path.includes("/login"))) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export { api };
