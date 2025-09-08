import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Next.js API routes prefix
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
