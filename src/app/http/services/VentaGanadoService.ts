import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class VentaGanadoService {
  private bovinesPath = "/bovine";
  private salePath = "/sales";

  async getAvailableBovines(params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.search) query.append("search", params.search);
    const queryString = query.toString();
    const url = queryString
      ? `${this.bovinesPath}?${queryString}`
      : this.bovinesPath;
    return http.get(url);
  }

  async createSale(payload: {
    rows: Array<{
      idBovine: string;
      saleType: string;
      saleValue: number;
    }>;
    idAccount: string;
    idConcept: string;
    idResponsible: string;
    operationDate: string;
  }) {
    return http.post(this.salePath, payload);
  }
}
