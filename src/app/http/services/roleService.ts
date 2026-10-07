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
   * Solo los roles activos.
   * Endpoint: GET /role/active
   *
   * Es lo que debe usarse para asignar permisos: un rol desactivado no
   * tiene usuarios trabajando, y mostrarlo invita a configurarlo de más.
   */
  async getActiveRoles() {
    return http.get(`${this.basePath}/active`);
  }

  /**
   * Obtiene el detalle de un rol específico por su ID
   * Endpoint: GET /role/:id
   */
  async getRoleById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }
}