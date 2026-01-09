/**
 * IDs Únicos de Roles (UUIDs extraídos de la base de datos)
 */
export const ROLES = {
  SUPER_USER: '09f145c3-9bcc-4573-aa43-7f72f033a28f',
  ADMIN: 'e5c7c4cf-713c-4327-866b-4ee54cb76246',
  CAPTURISTA: '0a68bf0d-1458-45cc-97dc-e89f1b5562ab'
} as const;

/**
 * Obtiene el rol actual del usuario autenticado
 * @returns string | null
 */
export const getUserRole = (): string | null => {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return null;

  try {
    const user = JSON.parse(userRaw);
    return user.role.id || null;
  } catch (error) {
    console.error("Error parseando el objeto user del localStorage", error);
    return null;
  }
};

/**
 * Helpers de validación rápida
 */
export const isSuperUser = () => getUserRole() === ROLES.SUPER_USER;
export const isAdmin = () => getUserRole() === ROLES.ADMIN;
export const isCapturista = () => getUserRole() === ROLES.CAPTURISTA;

/**
 * Verifica si el usuario tiene permisos de gestión (Admin o Super)
 */
export const canManageAll = () => [ROLES.SUPER_USER, ROLES.ADMIN].includes(getUserRole() as any);