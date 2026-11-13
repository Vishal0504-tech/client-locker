import axios from "axios";

const API = axios.create({
  baseURL: "https://client-locker.onrender.com/api",
});

export default API;