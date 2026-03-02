// batchService.ts
import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class BatchService {
  private basePath = "/batch";

  // Listar: El query param en Postman es idBatchType
  async getBatches(params: any) {
    return http.getget(`${this.basePath}`, { params });
  }

  // Crear: El body requiere idBatchType y opcionalmente idBovines
  async createBatch(payload: { name: string; idBatchType: string; idBovines?: string[] }) {
    return http.post(`${this.basePath}`, payload);
  }

  async deleteBatch(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}