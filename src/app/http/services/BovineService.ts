import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class BovineService {
  private path = "/bovine";

  /**
   * Obtiene la lista de bovinos con paginación y filtros
   */
  async getBovines(params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();

    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.search) query.append("search", params.search);

    const queryString = query.toString();
    const url = queryString ? `${this.path}?${queryString}` : this.path;

    return http.get(url);
  }

  /**
   * Crea un nuevo registro de bovino
   */
  async createBovine(payload: any) {
    return http.post(this.path, payload);
  }

  /**
   * Actualiza un bovino existente
   */
  async updateBovine(id: string, payload: any) {
    return http.patch(`${this.path}/${id}`, payload);
  }

  /**
   * Elimina un bovino
   */
  async deleteBovine(id: string) {
    return http.delete(`${this.path}/${id}`);
  }

  /**
   * Obtiene un bovino específico por ID (útil para detalles o edición profunda)
   */
  async getBovineById(id: string) {
    return http.get(`${this.path}/${id}`);
  }

  async getBovinesBySex(sexId: string, search?: string) {
    const query = new URLSearchParams();
    query.append("limit", "1000");
    if (search) query.append("search", search);

    const url = `${this.path}/sex/${sexId}?${query.toString()}`;
    return http.get(url);
  }

  async getBovinesByType(bovineTypeId: string, search?: string) {
    const query = new URLSearchParams();
    if (search) query.append("search", search);

    const queryString = query.toString();
    const url = queryString
      ? `${this.path}/bovine-type/${bovineTypeId}?${queryString}`
      : `${this.path}/bovine-type/${bovineTypeId}`;
    return http.get(url);
  }

}