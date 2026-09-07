import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class VerifyService {
  async sendOtp(mail: string) {
    return http.post('/verify/send-otp', { mail });
  }

  async validateOtp(mail: string, code: string) {
    return http.post('/verify/validate-otp', { mail, code });
  }

  async resetPassword(resetToken: string, newPassword: string) {
    return http.post('/user/reset-password', { resetToken, newPassword });
  }
}
