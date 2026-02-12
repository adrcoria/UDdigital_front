import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class ParameterService {
  private path = "/parameters";

  /**
   * Obtiene la lista de parámetros globales (Factor Venta, etc.)
   */
  async getParameters(params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();

    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.search) query.append("search", params.search);

    const queryString = query.toString();
    const url = queryString ? `${this.path}?${queryString}` : this.path;

    return http.get(url);
  }

  /**
   * Obtiene un parámetro específico por su ID
   */
  async getParameterById(id: string) {
    return http.get(`${this.path}/${id}`);
  }
}