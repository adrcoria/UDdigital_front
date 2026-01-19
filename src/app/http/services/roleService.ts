// roleService.ts
import HttpService from "@/app/http/httpService";

const http = new HttpService();

export default class RoleService {
  private basePath = "/role";

  /**
   * Obtiene la lista de todos los roles disponibles
   * Endpoint: GET /role
   * Basado en el contrato "Get all roles"
   */
  async getRoles() {
    return http.get(`${this.basePath}`);
  }

  /**
   * Obtiene el detalle de un rol específico por su ID
   * Endpoint: GET /role/:id
   */
  async getRoleById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }
}