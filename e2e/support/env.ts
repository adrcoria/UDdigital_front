import fs from "node:fs";
import path from "node:path";

/**
 * Carga e2e/.env.e2e sin dependencias externas.
 * Las credenciales viven solo en ese archivo, que esta en .gitignore.
 */
export const config = () => {
  const file = path.resolve(process.cwd(), "e2e/.env.e2e");
  if (!fs.existsSync(file)) return;

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) process.env[key] = value;
  }
};

/** Valor obligatorio: si falta, la prueba falla con un mensaje claro */
export const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Falta ${key}. Copia e2e/.env.e2e.example como e2e/.env.e2e y llenalo.`
    );
  }
  return value;
};

export const env = {
  get mail() { return required("E2E_MAIL"); },
  get password() { return required("E2E_PASSWORD"); },
  get companyCode() { return required("E2E_COMPANY_CODE"); },
  get companyName() { return process.env.E2E_COMPANY_NAME || "test"; },
  get baseURL() { return process.env.E2E_BASE_URL || "http://localhost:3000"; },
  /** Origen de la API: solo las llamadas a este host cuentan como del sistema */
  get apiURL() {
    return process.env.E2E_API_URL || "https://api.agroindustriaselarteaguense.cloud";
  },
  /** Las pruebas sin reverso solo corren si se habilitan a proposito */
  get allowIrreversible() { return process.env.E2E_ALLOW_IRREVERSIBLE === "1"; },
};
