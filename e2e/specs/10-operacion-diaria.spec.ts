import { test, expect, openApp } from "../support/fixtures";

/**
 * Módulos de apoyo: inventarios, personal, maquinaria, usuarios y empresas.
 * Se valida el contrato del listado y que el alta esté disponible, sin crear
 * registros: su limpieza depende de reglas de negocio (un usuario borrado,
 * una empresa con datos colgando) que no conviene tocar en producción.
 */

interface Modulo {
  nombre: string;
  ruta: string;
  listo: string;
  endpoint: string;
  /** Texto del botón que abre el alta */
  alta?: string | RegExp;
}

const MODULOS: Modulo[] = [
  {
    nombre: "Inventario · Administrar",
    ruta: "/inventarios/administrar",
    listo: "body",
    endpoint: "/inventory",
  },
  {
    nombre: "Inventario · Catálogos",
    ruta: "/inventarios/catalogos",
    listo: "body",
    endpoint: "/product",
  },
  {
    nombre: "Personal",
    ruta: "/personal/administrar",
    listo: "body",
    endpoint: "/personal",
  },
  {
    nombre: "Puestos",
    ruta: "/personal/puestos",
    listo: "body",
    endpoint: "/position",
  },
  {
    nombre: "Maquinaria",
    ruta: "/maquinaria",
    listo: "body",
    endpoint: "/machinery",
  },
  {
    nombre: "Usuarios",
    ruta: "/configuraciones/usuarios",
    listo: "body",
    endpoint: "/user",
  },
  {
    nombre: "Empresas",
    ruta: "/configuraciones/empresas",
    listo: "text=Listado de Empresas",
    endpoint: "/company",
    alta: "Nueva Empresa",
  },
];

test.describe("Módulos de apoyo", () => {
  for (const modulo of MODULOS) {
    test(`${modulo.nombre} responde con un listado válido`, async ({
      authedPage: page,
      api,
    }) => {
      await openApp(page, modulo.ruta, modulo.listo);

      const call = await api.waitFor("GET", modulo.endpoint, 30_000);
      expect(call.status, `${modulo.endpoint} respondió ${call.status}`).toBe(200);

      // El contrato del proyecto: todo listado viene envuelto en data
      expect(call.responseBody, `${modulo.endpoint} no devolvió JSON`).toBeTruthy();
      expect(call.responseBody).toHaveProperty("data");

      const payload = call.responseBody.data;
      const lista = Array.isArray(payload)
        ? payload
        : payload?.list ?? payload?.data ?? null;
      expect(
        Array.isArray(lista),
        `${modulo.endpoint} no devolvió un arreglo (data, data.list o data.data)`
      ).toBe(true);

      await page.waitForTimeout(1000);
      expect(
        api.failures().map((f) => `${f.method} ${f.path} -> ${f.status}`),
        `${modulo.nombre} disparó llamadas con error`
      ).toEqual([]);

      if (modulo.alta) {
        await expect(
          page.getByRole("button", { name: modulo.alta }),
          `${modulo.nombre} no ofrece el alta`
        ).toBeVisible();
      }
    });
  }

  test("Empresas incluye la empresa de pruebas", async ({ authedPage: page, api }) => {
    await openApp(page, "/configuraciones/empresas", "text=Listado de Empresas");

    const call = await api.waitFor("GET", "/company", 30_000);
    const empresas = call.responseBody.data;

    const prueba = empresas.find((e: any) => e.code === "ABC");
    expect(prueba, "no está la empresa de pruebas (código ABC)").toBeTruthy();

    await expect(page.getByText(prueba.name).first()).toBeVisible();
  });
});
