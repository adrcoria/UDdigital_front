// usuariosService.ts
import HttpService from "@/app/http/httpService";

const http = new HttpService();

export interface UserPayload {
  mail: string;
  password?: string;
  name: string;
  lastName: string;
  phone: string;
  roleId: string;
  companyId: string;
}

export default class UsuariosService {
  private basePath = "/user";

  async getUsers() {
    return http.get(`${this.basePath}`);
  }

  async getUserById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createUser(payload: UserPayload) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateUser(id: string, payload: Partial<UserPayload>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteUser(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}