import { test, expect, openApp } from "../support/fixtures";

/**
 * Humo de TODO el sistema: recorre cada módulo del menú y valida tres cosas.
 *
 *   1. La ruta carga y pinta su contenido (no pantalla en blanco ni 404).
 *   2. El endpoint principal del módulo responde 200.
 *   3. NINGUNA llamada que dispara esa pantalla termina en 4xx o 5xx.
 *
 * El punto 3 es el que más valor da: detecta contratos rotos en cualquier
 * módulo sin tener que escribir una aserción por campo.
 */

interface Modulo {
  nombre: string;
  ruta: string;
  /** Texto que prueba que el módulo realmente pintó */
  listo: string;
  /** Endpoint principal que debe responder al entrar */
  endpoint?: string;
  /** Rutas cuyo error no invalida la prueba (permisos, módulos opcionales) */
  ignorar?: string[];
}

const MODULOS: Modulo[] = [
  { nombre: "Inicio", ruta: "/", listo: "body" },

  // Configuraciones
  { nombre: "Usuarios", ruta: "/configuraciones/usuarios", listo: "text=/Usuario/i", endpoint: "/user" },
  { nombre: "Empresas", ruta: "/configuraciones/empresas", listo: "text=Listado de Empresas", endpoint: "/company" },
  { nombre: "Rancheros", ruta: "/configuraciones/rancheros", listo: "body", endpoint: "/ranchers" },
  { nombre: "Parámetros generales", ruta: "/configuraciones/parametros", listo: "text=Parámetros generales", endpoint: "/parameters" },

  // Administración
  { nombre: "Ingresos y egresos", ruta: "/administracion/ingresos-egresos", listo: "text=Operaciones del día", endpoint: "/operation" },

  // Reportes
  { nombre: "Reportes", ruta: "/reportes", listo: "text=Reportes Operativos" },

  // Inventarios
  { nombre: "Inventario · Administrar", ruta: "/inventarios/administrar", listo: "body" },
  { nombre: "Inventario · Catálogos", ruta: "/inventarios/catalogos", listo: "body" },

  // Ganadería
  { nombre: "Bovinos", ruta: "/ganaderia/bovinos", listo: "text=Inventario de Bovinos", endpoint: "/bovine" },
  { nombre: "Catálogos Ganado", ruta: "/ganaderia/catalogos", listo: "body" },
  { nombre: "Engorda", ruta: "/ganaderia/engorda", listo: "body", endpoint: "/batch" },
  { nombre: "Producción de Leche", ruta: "/ganaderia/leche", listo: "body", endpoint: "/batch" },
  { nombre: "Vacunación", ruta: "/ganaderia/vacunacion", listo: "body", endpoint: "/batch" },
  { nombre: "Venta de Ganado", ruta: "/ganaderia/venta", listo: "text=Ganado Disponible", endpoint: "/bovine" },

  // Maquinaria y personal
  { nombre: "Maquinaria", ruta: "/maquinaria", listo: "body", endpoint: "/machinery" },
  { nombre: "Personal · Administrar", ruta: "/personal/administrar", listo: "body", endpoint: "/personal" },
  { nombre: "Personal · Puestos", ruta: "/personal/puestos", listo: "body", endpoint: "/position" },
];

test.describe("Humo de todos los módulos", () => {
  for (const modulo of MODULOS) {
    test(`${modulo.nombre} carga sin errores de API`, async ({ authedPage: page, api }) => {
      await openApp(page, modulo.ruta, modulo.listo);

      // La ruta existe: el router no mandó al login ni a una pantalla vacía
      expect(page.url(), `${modulo.nombre} redirigió fuera de su ruta`).toContain(
        modulo.ruta === "/" ? "" : modulo.ruta
      );

      if (modulo.endpoint) {
        const call = await api.waitFor("GET", modulo.endpoint);
        expect(call.status, `${modulo.endpoint} respondió ${call.status}`).toBe(200);
      }

      // Darle un respiro a las peticiones que arrancan tarde
      await page.waitForTimeout(1500);

      const fallidas = api.failures(modulo.ignorar);
      expect(
        fallidas.map((f) => `${f.method} ${f.path} -> ${f.status}`),
        `${modulo.nombre} disparó llamadas con error`
      ).toEqual([]);
    });
  }
});
