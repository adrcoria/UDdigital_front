import HttpService from "@/app/http/httpService";

const http = new HttpService();

export interface PositionPayload {
  name: string;
}

export default class PositionService {
  private basePath = "/position";

  async getPositions() {
    return http.get(this.basePath);
  }

  async getPositionById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createPosition(payload: PositionPayload) {
    return http.post(this.basePath, payload);
  }

  async updatePosition(id: string, payload: Partial<PositionPayload>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deletePosition(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
