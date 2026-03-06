import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class WeightService {
  private basePath = "/weight-log";

  // Obtener historial: GET /weight-log/bovine/:id
  async getHistoryByBovine(bovineId: string, page = 1, limit = 10) {
    return http.getget(`${this.basePath}/bovine/${bovineId}`, {
      params: { page, limit }
    });
  }

  // Registrar peso: POST /weight-log
  // Payload según tu contrato: { weight, idBovine, registerDate }
  async createWeightLog(payload: { weight: number; idBovine: string; registerDate: string }) {
    return http.post(`${this.basePath}`, payload);
  }

  async deleteWeightLog(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}