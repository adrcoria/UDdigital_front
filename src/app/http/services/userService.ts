import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class UserService {
  private basePath = "/user"; // Ruta base para la API de usuarios
  private basePathNotification = "/notification"; // Ruta base para la API de notificaciones
  async getUsers() {
    return http.get(`${this.basePath}`);
  }
  async getRoles() {
    return http.get(`${this.basePath}/role`);
  }
  async getNotifications(uuid: string) {
    return http.get(`${this.basePath}/${uuid}/notification`);
  }
  async readNotification(uuid: string) {
    return http.put(`${this.basePathNotification}/${uuid}/read`, {});
  }


  async createUser(user: any) {
    return http.post(`${this.basePath}`, user);
  }

  async updateUser(user: any, uuid: string) {
    return http.put(`${this.basePath}/${uuid}`, user);
  }

  async deleteUser(uuid: string) {
    return http.delete(`${this.basePath}/${uuid}`);
  }

  async resetPassword(password: string, uuid: string) {
    return http.put(`${this.basePath}/${uuid}`, { password: password });
  }

}
