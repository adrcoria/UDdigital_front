import HttpService from "@/app/http/httpService";

const http = new HttpService();

/**
 * Permisos: qué secciones puede ver cada rol.
 *
 * El alta no es por permiso individual. Se manda la lista completa de
 * secciones que el rol debe tener y el backend reemplaza lo que había, así
 * que la pantalla siempre envía el estado final de ese rol.
 */
export default class PermitService {
  private basePath = "/permit";

  /** GET /permit — todos los permisos, de todos los roles */
  async getPermits() {
    return http.get(this.basePath);
  }

  /** GET /permit/role/:roleId — permisos de un rol */
  async getPermitsByRole(roleId: string) {
    return http.get(`${this.basePath}/role/${roleId}`);
  }

  /**
   * Reemplaza los permisos del rol con la lista indicada.
   * PUT /permit/role/:roleId  { webSectionIds: [...] }
   *
   * OJO: la ruta es la misma que la del GET y solo cambia el verbo. Si el
   * backend la expone como POST, es cambiar `patch`/`put` aquí y nada más.
   */
  async setRolePermits(roleId: string, webSectionIds: string[]) {
    return http.put(`${this.basePath}/role/${roleId}`, { webSectionIds });
  }
}
