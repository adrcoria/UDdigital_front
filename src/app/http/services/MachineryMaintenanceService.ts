import HttpService from "@/app/http/httpService";

const http = new HttpService();

export interface MaintenancePayload {
  type: string;
  programedDate?: string | null;
  doneDate?: string | null;
  odometer?: number;
  jobDescription?: string;
  sparePartsUsed?: string;
  workshop?: string;
  totalCost?: number;
  nextMaintenance?: string | null;
  notes?: string;
  idMachinery: string;
}

export default class MachineryMaintenanceService {
  private basePath = "/machinery-maintenance";

  async getMaintenances(params: {
    idMachinery: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    query.append("idMachinery", params.idMachinery);
    if (params.page)  query.append("page",  params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    return http.get(`${this.basePath}?${query.toString()}`);
  }

  async getMaintenanceById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createMaintenance(payload: MaintenancePayload) {
    return http.post(this.basePath, payload);
  }

  async updateMaintenance(id: string, payload: Partial<MaintenancePayload>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteMaintenance(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }

  /* ────── Evidencia (presigned S3) ────── */
  async createEvidence(payload: { fileName: string; contentType: string; idMaintenance: string }) {
    return http.post(`${this.basePath}/evidence`, payload);
  }

  async uploadToS3(url: string, file: File) {
    return http.putFile(url, file, {
      headers: { "Content-Type": file.type },
    });
  }
}
