import HttpService from "@/app/http/httpService";

const http = new HttpService();

export interface WebSectionPayload {
  key: string;
  name: string;
  description?: string;
  path: string;
  isActive: boolean;
}

/**
 * Secciones de la aplicación sobre las que se otorgan permisos.
 * Una sección es una entrada del menú: su `path` debe coincidir con la ruta
 * real del front para que el permiso tenga efecto.
 *
 * Son estructura del sistema, no datos de operación: se cargan en base de
 * datos con scripts/web-sections.sql. La interfaz solo las LEE, para poder
 * asignarlas a los roles; los métodos de escritura quedan disponibles por si
 * más adelante se decide administrarlas desde la aplicación.
 */
export default class WebSectionService {
  private basePath = "/web-section";

  /** GET /web-section — todas, activas e inactivas (vista de administración) */
  async getSections() {
    return http.get(this.basePath);
  }

  /** GET /web-section/active — solo las activas (lo que el usuario puede ver) */
  async getActiveSections() {
    return http.get(`${this.basePath}/active`);
  }

  async getSectionById(id: string) {
    return http.get(`${this.basePath}/${id}`);
  }

  async createSection(payload: WebSectionPayload) {
    return http.post(this.basePath, payload);
  }

  async updateSection(id: string, payload: Partial<WebSectionPayload>) {
    return http.patch(`${this.basePath}/${id}`, payload);
  }

  async deleteSection(id: string) {
    return http.delete(`${this.basePath}/${id}`);
  }
}
