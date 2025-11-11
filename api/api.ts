import axios from "axios";
import { getAuthToken } from "@/utils/authToken";

const api = axios.create({
  baseURL: "https://ebuyartisannetwork.com/wp-json/wr/v1/",
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const apiCall = async (method, url, data, params, headers = {}) => {
  return api({ method, url, data, params, headers });
};

export default api;
