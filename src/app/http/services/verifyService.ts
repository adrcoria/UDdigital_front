import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class VerifyService {
  private basePath = "/verify"; // Ruta base para la API de usuarios

  
  async generateOtp(payload: any) {
    return http.post(`${this.basePath}/otp`,payload);
  }
  async validateOtp(payload: any) {
    return http.put(`${this.basePath}/otp`,payload);
  }


}
