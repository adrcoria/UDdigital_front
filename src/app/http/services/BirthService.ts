import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class BirthService {
  private basePath = "/births";

  async getHistory(params: {
    idBovine?: string;
    page?: number;
    limit?: number;
  }) {
    return http.getget(`${this.basePath}`, { params });
  }

  async createBirth(payload: {
    idBovine: string;
    idBovineSon: string;
    idUser: string;
    birthDate: string;
  }) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateBirth(id: string, payload: any) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteBirth(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
