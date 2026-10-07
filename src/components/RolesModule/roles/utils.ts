import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";
import { ROLES } from "@/app/utils/authHelper";

export const rolesBreadcrumb: BreadcrumbType[] = [
  { title: "Configuraciones", disabled: false },
  { title: "Roles", disabled: true },
];

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Roles que el sistema tiene cableados por UUID (authHelper.ROLES).
 *
 * De ellos dependen reglas que no pasan por la tabla de permisos: el candado
 * de meses vencidos, el cambio de rancho, quién edita operaciones. Borrarlos
 * o desactivarlos dejaría a esos usuarios sin poder trabajar y sin forma de
 * arreglarlo desde la interfaz, así que la pantalla no lo permite.
 */
export const ROLES_DEL_SISTEMA: string[] = [
  ROLES.SUPER_USER,
  ROLES.ADMIN,
  ROLES.CAPTURISTA,
];

export const esRolDelSistema = (id: string) => ROLES_DEL_SISTEMA.includes(id);
