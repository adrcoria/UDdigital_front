import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";

export const permisosBreadcrumb: BreadcrumbType[] = [
  { title: "Configuraciones", disabled: false },
  { title: "Permisos", disabled: true },
];

export interface WebSection {
  id: string;
  key: string;
  name: string;
  description?: string;
  path: string;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
}

export interface Permit {
  id: string;
  roleId: string;
  webSectionId: string;
  webSection?: WebSection;
}

/** El nombre del rol tal como lo expone el API, con respaldo por si cambia */
export const roleLabel = (role: any): string =>
  role?.name ?? role?.description ?? role?.id ?? "Rol";

/**
 * Las rutas que el front conoce hoy. Sirven para detectar una sección cuyo
 * `path` no corresponde a ninguna pantalla: el permiso existiría pero no
 * protegería nada.
 */
export const RUTAS_DEL_FRONT = [
  "/",
  "/configuraciones/usuarios",
  "/configuraciones/empresas",
  "/configuraciones/rancheros",
  "/configuraciones/parametros",
  "/configuraciones/permisos",
  "/administracion/ingresos-egresos",
  "/reportes",
  "/inventarios/administrar",
  "/inventarios/catalogos",
  "/ganaderia/bovinos",
  "/ganaderia/catalogos",
  "/ganaderia/engorda",
  "/ganaderia/leche",
  "/ganaderia/vacunacion",
  "/ganaderia/venta",
  "/maquinaria",
  "/personal/administrar",
  "/personal/puestos",
];

export const rutaExisteEnElFront = (path: string) =>
  RUTAS_DEL_FRONT.includes(String(path || "").trim());
