/**
 * IDs Únicos de Roles (UUIDs)
 */
export const ROLES = {
  SUPER_USER: '09f145c3-9bcc-4573-aa43-7f72f033a28f',
  ADMIN: 'e5c7c4cf-713c-4327-866b-4ee54cb76246',
  CAPTURISTA: '0a68bf0d-1458-45cc-97dc-e89f1b5562ab'
} as const;

/**
 * Obtiene el user desde localStorage o sessionStorage
 */
const getStoredUserRaw = (): string | null => {
  return (
    localStorage.getItem("user") ||
    sessionStorage.getItem("user")
  );
};

/**
 * Obtiene el rol actual del usuario autenticado
 */
export const getUserRole = (): string | null => {
  const userRaw = getStoredUserRaw();
  if (!userRaw) return null;

  try {
    const user = JSON.parse(userRaw);

    // 🛡️ Protección total contra undefined
    return user?.role?.id ?? null;
  } catch (error) {
    console.error("Error parseando el objeto user del storage", error);
    return null;
  }
};

/**
 * Helpers de validación rápida
 */
export const isSuperUser = () =>
  getUserRole() === ROLES.SUPER_USER;

export const isAdmin = () =>
  getUserRole() === ROLES.ADMIN;

export const isCapturista = () =>
  getUserRole() === ROLES.CAPTURISTA;

/**
 * Verifica si el usuario tiene permisos de gestión
 */
export const canManageAll = (): boolean => {
  const role = getUserRole();
  if (!role) return false;

  return [ROLES.SUPER_USER, ROLES.ADMIN].includes(role);
};
