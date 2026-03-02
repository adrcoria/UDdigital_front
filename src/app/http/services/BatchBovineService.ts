// batchBovineService.ts
import HttpService from "@/app/http/httpService";
const http = new HttpService();

export default class BatchBovineService {
  // Endpoint: POST /batch/add-bovines
  // CONTRATO: { idBatch: string, idBovines: string[] }
  async addBovinesToBatch(payload: { idBatch: string; idBovines: string[] }) {
    return http.post(`/batch/add-bovines`, payload);
  }

  async updateBovinestoBatch(idBatch: string, payload: { idBovines: string[] }) {
    return http.patch(`/batch/${idBatch}`, payload);
  }

  // Quitar animal del lote (PATCH)
  async removeBovineFromBatch(idBovine: string) {
    return http.delete(`/bovine/${idBovine}/remove-batch`);
  }

  // Registro de Peso (POST)
  async addWeightLog(idBovine: string, payload: { weight: number; date: string }) {
    return http.post(`/bovine/${idBovine}/weight-log`, payload);
  }
}