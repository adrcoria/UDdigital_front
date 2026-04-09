// ranchersService.ts
import HttpService from "@/app/http/httpService";

const http = new HttpService();

export interface RancherPayload {
  name: string;
}

export default class RanchersService {
  private basePath = "/ranchers";

  async getRanchers() {
    return http.get(`${this.basePath}`);
  }

  async createRancher(payload: RancherPayload) {
    return http.post(`${this.basePath}`, payload);
  }

  async updateRancher(id: string, payload: Partial<RancherPayload>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteRancher(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
