import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class AccountService {
  private basePath = "/auth"; // Ruta base para la API de usuarios
 
  async login(user: any) {
    return http.post(`${this.basePath}/login`, user);
  }
  async refreshToken(token: string) {
    return http.post(`${this.basePath}/refresh`, { refreshToken: token });
  }

  async switchCompany(refreshToken: string, companyId: string) {
    return http.post(`${this.basePath}/switch-company`, { refreshToken, companyId });
  }

  async changePassword(newPassword: string) {
    return http.patch(`${this.basePath}/change-password`, { newPassword });
  }

}
