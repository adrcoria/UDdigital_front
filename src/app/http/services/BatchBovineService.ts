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
    return http.post(`/batch/${idBatch}/bovines`, payload);
  }



  async removeBovineFromBatch(idBatch: string, payload: { idBovines: string[] }) {
   
    return http.delete(`/batch/${idBatch}/bovines`, { data: payload });
  }

  // Registro de Peso (POST)
  async addWeightLog(idBovine: string, payload: { weight: number; date: string }) {
    return http.post(`/bovine/${idBovine}/weight-log`, payload);
  }
}