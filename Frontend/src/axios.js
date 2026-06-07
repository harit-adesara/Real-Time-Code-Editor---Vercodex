import axios from "axios";

let isRefreshing = false;
let queue = [];

axios.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes("/refresh-token")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => {
          return axios(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        await axios.post(
          "https://real-time-code-editor-vercodex.onrender.com/vercodex/refresh-token",
          {},
          {
            withCredentials: true,
          },
        );

        queue.forEach(({ resolve }) => resolve());

        queue = [];

        return axios(originalRequest);
      } catch (err) {
        queue.forEach(({ reject }) => reject(err));

        queue = [];

        window.location.href = "/login";

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axios;
