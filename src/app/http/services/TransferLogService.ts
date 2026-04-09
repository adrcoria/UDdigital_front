import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class TransferLogService {
  private basePath = "/transfer-logs";

  async createTransferLog(payload: { idBovine: string; idCompanyDestiny: string; comments: string }) {
    return http.post(`${this.basePath}`, payload);
  }

  async getTransferLogs() {
    return http.get(`${this.basePath}`);
  }
}
