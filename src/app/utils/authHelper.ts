import router from "@/router"; // Asegúrate de que la ruta a tu router sea correcta

/**
 * IDs Únicos de Roles (UUIDs)
 */
export const ROLES = {
  SUPER_USER: "09f145c3-9bcc-4573-aa43-7f72f033a28f",
  ADMIN: "e5c7c4cf-713c-4327-866b-4ee54cb76246",
  CAPTURISTA: "0a68bf0d-1458-45cc-97dc-e89f1b5562ab"
} as const;

/**
 * Obtiene el objeto user parseado priorizando sessionStorage
 */
const getStoredUser = (): any | null => {
  const userRaw = sessionStorage.getItem("user") || localStorage.getItem("user");
  if (!userRaw) return null;
  try {
    return JSON.parse(userRaw);
  } catch (error) {
    return null;
  }
};

/**
 * HELPERS DE LECTURA
 */
export const getUserRole = (): string | null => getStoredUser()?.role?.id || null;
export const getCompanyId = (): string | null => getStoredUser()?.company?.id || null;

/**
 * HELPERS DE VALIDACIÓN
 */
export const isSuperUser = (): boolean => getUserRole() === ROLES.SUPER_USER;
export const isAdmin = (): boolean => getUserRole() === ROLES.ADMIN;
export const isCapturista = (): boolean => getUserRole() === ROLES.CAPTURISTA;
export const canManageAll = (): boolean => [ROLES.SUPER_USER, ROLES.ADMIN].includes(getUserRole() || "");
export const getLoggedUserId = (): string | null => getStoredUser()?.id || null;

/**
 * FUNCIÓN DE LOGOUT
 * Limpia la sesión pero preserva el "Recordarme" si existe
 */
export const logout = () => {
  // 1. Guardamos temporalmente las credenciales del "Recordarme"
  const savedMail = localStorage.getItem("mail");
  const savedPass = localStorage.getItem("password");
  const savedCode = localStorage.getItem("companyCode");

  // 2. Limpiamos absolutamente todo rastro de sesiones
  sessionStorage.clear();
  localStorage.clear();

  // 3. Si el usuario tenía activo el "Recordarme", restauramos sus credenciales
  if (savedMail && savedPass && savedCode) {
    localStorage.setItem("mail", savedMail);
    localStorage.setItem("password", savedPass);
    localStorage.setItem("companyCode", savedCode);
  }

  // 4. Redirigimos al login y forzamos recarga para limpiar estados de Vue/Pinia
  window.location.href = "/login";
};