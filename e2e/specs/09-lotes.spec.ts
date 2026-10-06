import { test, expect, openApp } from "../support/fixtures";

/**
 * Los tres módulos de lotes comparten componente y endpoint (/batch), y se
 * distinguen por el tipo de lote. Se valida que cada uno pida SU tipo: si el
 * filtro se rompe, Engorda mostraría lotes de Vacunación.
 */
const MODULOS = [
  { nombre: "Engorda", ruta: "/ganaderia/engorda" },
  { nombre: "Producción de Leche", ruta: "/ganaderia/leche" },
  { nombre: "Vacunación", ruta: "/ganaderia/vacunacion" },
];

test.describe("Ganadería · Lotes", () => {
  for (const modulo of MODULOS) {
    test(`${modulo.nombre} carga sus lotes filtrados por tipo`, async ({
      authedPage: page,
      api,
    }) => {
      await openApp(page, modulo.ruta, "body");

      const call = await api.waitFor("GET", "/batch", 30_000);
      expect(call.status).toBe(200);

      // Cada módulo consulta su propio tipo de lote
      const tipo = new URL(call.url).searchParams.get("idBatchType");
      expect(tipo, `${modulo.nombre} no filtró por tipo de lote`).toBeTruthy();

      // Contrato de /batch: { data: { data: [...], total, page } }
      const payload = call.responseBody?.data;
      expect(payload, "la respuesta no trae data").toBeTruthy();
      expect(Array.isArray(payload.data), "data.data debe ser un arreglo").toBe(true);
      expect(payload).toHaveProperty("total");

      const lotes = payload.data;

      // Y lo que regresa corresponde a ese tipo
      for (const lote of lotes.slice(0, 5)) {
        if (lote.batchType?.id) {
          expect(
            lote.batchType.id,
            `${modulo.nombre} recibió un lote de otro tipo (${lote.batchType?.name})`
          ).toBe(tipo);
        }
      }

      await page.waitForTimeout(1000);
      expect(
        api.failures().map((f) => `${f.method} ${f.path} -> ${f.status}`),
        `${modulo.nombre} disparó llamadas con error`
      ).toEqual([]);
    });
  }

  test("los tres módulos piden tipos de lote distintos", async ({ authedPage: page, api }) => {
    const tipos: string[] = [];

    for (const modulo of MODULOS) {
      api.reset();
      await openApp(page, modulo.ruta, "body");
      const call = await api.waitFor("GET", "/batch", 30_000);
      tipos.push(String(new URL(call.url).searchParams.get("idBatchType")));
    }

    expect(new Set(tipos).size, `los tipos se repiten: ${tipos.join(", ")}`).toBe(3);
  });
});
