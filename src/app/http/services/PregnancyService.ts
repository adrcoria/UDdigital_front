import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class PregnancyService {
  private basePath = "/pregnancy";

  /**
   * Obtener historial con filtros
   * GET /pregnancy?bovineId=...&idPregnancyType=...&page=1...
   */
  async getHistory(params: { 
    idBovine?: string; 
    idPregnancyType?: string; 
    idMaleBovine?: string; // idBull
    page?: number; 
    limit?: number 
  }) {
    return http.getget(`${this.basePath}`, { params });
  }

  async createPregnancy(payload: any) {
    return http.post(`${this.basePath}`, payload);
  }

  async updatePregnancy(id: string, payload: any) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deletePregnancy(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}