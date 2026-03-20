import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class HeatService {
  private basePath = "/heat";

  async getHistory(params: {
    idBovine?: string;
    page?: number;
    limit?: number;
  }) {
    return http.getget(`${this.basePath}`, { params });
  }

  async createHeat(payload: {
    idBovine: string;
    idUser: string;
    heatDateInit: string;
    heatDateEnd?: string | null;
    comments?: string;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateHeat(id: string, payload: any) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteHeat(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
