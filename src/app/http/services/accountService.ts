import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class AccountService {
  private basePath = "/auth"; // Ruta base para la API de usuarios
 
  async login(user: any) {
    return http.post(`${this.basePath}/login`, user);
  }
  async refreshToken(token: string) {
    return http.post(`${this.basePath}/refresh_token?refresh_token=${token}`, {});
  }

}
