import axios from "axios";
import { SERVER_URL } from "@/constants/server";

const serverAxios = axios.create({
  baseURL: SERVER_URL,
  withCredentials: false,
});

export default serverAxios;
