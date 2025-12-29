/**
 * Convierte una cadena a formato Camel Case: "juan pérez" → "Juan Pérez"
 */
export function toCamelCase(text: string): string {
  return text
    ?.toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Capitaliza la primera letra de la cadena: "hola mundo" → "Hola mundo"
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Recorta el texto y le añade "..." si excede el límite: "Hola mundo", 5 → "Hola..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

/**
 * Convierte snake_case a camelCase: "nombre_usuario" → "nombreUsuario"
 */
export function snakeToCamel(text: string): string {
  return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Elimina acentos: "José Álvarez" → "Jose Alvarez"
 */
export function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Limpia texto eliminando espacios extra, saltos de línea y tabs
 */
export function cleanString(text: string): string {
  return text?.replace(/\s+/g, " ").trim();
}


export function formatPhoneMX(value: string): string {
  if (!value) return "";
  const digits = value
    .replace(/^\+52/, "")   // elimina el +52 si lo trae
    .replace(/\D+/g, "")    // elimina cualquier otro carácter no numérico
    .slice(0, 10);          // asegura que solo sean 10 dígitos

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}