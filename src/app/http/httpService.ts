import axios from "@/app/http/axios";
import { AxiosRequestConfig } from "axios";

export default class HttpService {
  constructor() { }

  async get(path: string) {
    try {
      const response = await axios.get(`${path}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  }


  async getget(path: string, config: AxiosRequestConfig = {}) {
  try {
    const response = await axios.get(path, config);
    return response;
  } catch (error: any) {
    throw error;
  }
}


  async post(path: string, payload: { [key: string]: any }) {
    try {
      const response = await axios.post(`${path}`, payload);
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async put(path: string, payload: { [key: string]: any }) {
    try {
      const response = await axios.put(path, payload);
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async patch(path: string, payload: { [key: string]: any }) {
    try {
      const response = await axios.patch(path, payload);
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async putFile(path: string, payload: any, config: AxiosRequestConfig = {}) {
    return axios.put(path, payload, config);   // ⬅️ ahora acepta headers extra
  }

  async delete(path: string, config: any = {}) {
    try {
      const response = await axios.delete(path, config);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
}
