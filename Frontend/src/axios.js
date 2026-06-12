import axios from "axios";

let isRefreshing = false;
let queue = [];

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes("/refresh-token")) {
      // window.location.href = "/login";

      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => {
          return axiosInstance(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        await axiosInstance.post(
          "https://real-time-code-editor-vercodex.onrender.com/vercodex/refresh-token",
          {},
          {
            withCredentials: true,
          },
        );

        queue.forEach(({ resolve }) => resolve());

        queue = [];

        return axiosInstance(originalRequest);
      } catch (err) {
        queue.forEach(({ reject }) => reject(err));

        queue = [];

        window.dispatchEvent(new Event("auth:logout"));
        // window.location.href = "/login";

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
