import HttpService from "@/app/http/httpService";

const http = new HttpService();

export interface MachineryPayload {
  name: string;
  brand: string;
  model: string;
  transmission?: string;
  type?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  odometer?: number;
  idResponsible?: string;
  status?: string;
  notes?: string;
  fuelType?: string;
  provider?: string;
  internalCode?: string;
  category?: string;
  year?: string;
}

export default class MachineryService {
  private basePath = "/machinery";

  async getMachinery(params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page)   query.append("page",   params.page.toString());
    if (params.limit)  query.append("limit",  params.limit.toString());
    if (params.search) query.append("search", params.search);
    const queryString = query.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    return http.get(url);
  }

  async getMachineryById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createMachinery(payload: MachineryPayload) {
    return http.post(this.basePath, payload);
  }

  async updateMachinery(id: string, payload: Partial<MachineryPayload>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteMachinery(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }

  /* ──────── Subida de Foto (presigned S3) ──────── */
  async createPhoto(payload: { fileName: string; contentType: string; idMachinery: string }) {
    return http.post(`${this.basePath}/photo`, payload);
  }

  /* ──────── Subida de Factura (presigned S3) ──────── */
  async createInvoice(payload: { fileName: string; contentType: string; idMachinery: string }) {
    return http.post(`${this.basePath}/invoice`, payload);
  }

  async uploadToS3(url: string, file: File) {
    return http.putFile(url, file, {
      headers: { "Content-Type": file.type },
    });
  }
}
