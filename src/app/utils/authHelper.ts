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
 * CANDADO DE PERIODOS CONTABLES
 * Los meses vencidos (anteriores al mes en curso) quedan cerrados: no se pueden
 * registrar, editar ni eliminar operaciones con esa fecha.
 * Solo el Super Usuario puede realizar ajustes en un mes ya cerrado.
 */
export const canBypassPeriodLock = (): boolean => isSuperUser();

/**
 * Normaliza cualquier fecha a "YYYY-MM-DD" sin desfases de zona horaria
 * (respeta el día tal como viene si el string ya trae el formato ISO)
 */
export const toDateOnly = (value: string | Date | null | undefined): string => {
  if (!value) return "";

  if (typeof value === "string") {
    const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoDate) return isoDate[0];
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/** Primer día del mes en curso ("YYYY-MM-01"): inicio del periodo abierto */
export const getCurrentPeriodStart = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

/**
 * Fecha mínima capturable por el usuario actual.
 * Cadena vacía = sin límite (Super Usuario)
 */
export const getMinOperationDate = (): string =>
  canBypassPeriodLock() ? "" : getCurrentPeriodStart();

/** true si la fecha cae en un mes vencido y el usuario no puede saltarse el candado */
export const isPeriodLocked = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  if (canBypassPeriodLock()) return false;

  const dateOnly = toDateOnly(date);
  if (!dateOnly) return false;

  return dateOnly < getCurrentPeriodStart();
};

/** Mensaje único para mostrar al usuario cuando el candado se activa */
export const PERIOD_LOCK_MESSAGE =
  "El mes ya está cerrado. Solo el Super Usuario puede registrar o ajustar operaciones de meses vencidos.";

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