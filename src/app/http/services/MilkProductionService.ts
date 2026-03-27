import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class MilkProductionService {
  private basePath = "/milk-production-log";

  async getHistoryByBovine(bovineId: string, page = 1, limit = 10) {
    return http.getget(`${this.basePath}/bovine/${bovineId}`, {
      params: { page, limit }
    });
  }

  async createLog(payload: { bovineId: string; amount: number; registerDate: string }) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateLog(id: string, payload: { amount: number; registerDate: string }) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteLog(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
