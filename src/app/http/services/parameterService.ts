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

  /**
   * Obtiene un parámetro por su nombre exacto
   * GET /parameters/{name}  (ej. "Factor de Compra")
   */
  async getParameterByName(name: string) {
    return http.get(`${this.path}/${encodeURIComponent(name)}`);
  }

  /**
   * Actualiza el valor de un parámetro. El nombre viaja en el body y es la
   * llave: no hay alta ni baja, solo actualización de los existentes.
   * PATCH /parameters  { name, value }
   */
  async updateParameter(payload: { name: string; value: string }) {
    return http.patch(this.path, payload);
  }

  /**
   * Valor numérico de un parámetro por nombre, con respaldo si no existe o
   * si la petición falla. Evita repetir el find-por-nombre en cada módulo.
   *
   * La comparación ignora mayúsculas y espacios de sobra, pero NO adivina:
   * el nombre debe ser el mismo que administra Configuraciones → Parámetros.
   */
  async getParameterValue(name: string, fallback = 0): Promise<number> {
    try {
      const res = await this.getParameters({ page: 1, limit: 100 });
      const list = res.data?.data?.list ?? res.data?.data ?? [];
      const target = String(name).trim().toUpperCase();

      const param = (Array.isArray(list) ? list : []).find(
        (p: any) => String(p?.name || "").trim().toUpperCase() === target
      );

      const value = Number(param?.value);
      return Number.isFinite(value) && value > 0 ? value : fallback;
    } catch {
      return fallback;
    }
  }
}

/** Nombres de los parámetros globales, tal como los guarda el API */
export const PARAMETER_NAMES = {
  /** $/kg con el que se calcula el valor de VENTA del bovino al registrarlo */
  FACTOR_VENTA: "Factor Venta",
  /** Precio por kilo: valor de compra del bovino y venta de ganado */
  PRECIO_POR_KILO: "Factor de Compra",
  DIAS_CELO: "Dias Celo",
  DIAS_PRENEZ: "Dias Preñez",
} as const;

/**
 * Nombre de negocio de cada parámetro: es lo que ve el usuario.
 * No siempre coincide con la llave del API ("Factor de Compra" es, en realidad,
 * el precio por kilo), por eso la clave técnica solo se muestra en la pantalla
 * de Parámetros generales.
 */
export const PARAMETER_LABELS: Record<string, string> = {
  [PARAMETER_NAMES.FACTOR_VENTA]: "Factor de venta",
  [PARAMETER_NAMES.PRECIO_POR_KILO]: "Precio por kilo",
  [PARAMETER_NAMES.DIAS_CELO]: "Días de celo",
  [PARAMETER_NAMES.DIAS_PRENEZ]: "Días de preñez",
};