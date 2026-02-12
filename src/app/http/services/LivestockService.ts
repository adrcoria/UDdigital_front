import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class LivestockService {
  private getPath(catalog: string) {
    return `/${catalog}`;
  }

  // Ahora acepta params para que la URL se construya con ?page=1&limit=10
  async getItems(catalog: string, params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();

    // Aplicamos valores por defecto: page 1 y limit 1000
    const page = params.page || 1;
    const limit = params.limit || 1000;

    query.append("page", page.toString());
    query.append("limit", limit.toString());

    // El search solo se agrega si existe
    if (params.search) {
      query.append("search", params.search);
    }

    const queryString = query.toString();
    const url = `${this.getPath(catalog)}?${queryString}`;

    return http.get(url);
  }

  async createItem(catalog: string, payload: any) {
    return http.post(this.getPath(catalog), payload);
  }
  async updateItem(catalog: string, id: string, payload: { name: string; phone?: string }) {
    return http.patch(`${this.getPath(catalog)}/${id}`, payload);
  }

  async deleteItem(catalog: string, id: string) {
    return http.delete(`${this.getPath(catalog)}/${id}`);
  }
}