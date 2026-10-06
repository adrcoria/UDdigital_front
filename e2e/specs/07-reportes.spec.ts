import { test, expect, openApp } from "../support/fixtures";

const abrirReportes = async (page: any) => {
  await openApp(page, "/reportes", "text=Reportes Operativos");
};

const elegirTab = async (page: any, nombre: string | RegExp) => {
  await page.getByRole("tab", { name: nombre }).click();
};

test.describe("Reportes operativos", () => {
  test("ofrece los diez módulos de reportes", async ({ authedPage: page }) => {
    await abrirReportes(page);

    for (const tab of [
      "Desarrollo del hato",
      "Ganaderia",
      "Engorda",
      "Leche",
      "Vacunacion",
      "Ventas",
      "Personal",
      "Maquinaria",
      "Inventarios",
      "Contabilidad",
    ]) {
      await expect(
        page.getByRole("tab", { name: tab }),
        `falta el tab "${tab}"`
      ).toBeVisible();
    }
  });

  test.describe("R-28 · Desarrollo del hato", () => {
    test("envía los porcentajes como enteros y pinta la matriz a 10 años", async ({
      authedPage: page,
      api,
    }) => {
      await abrirReportes(page);
      await elegirTab(page, "Desarrollo del hato");

      await expect(page.getByLabel("Pariciones (%)").first()).toBeVisible({
        timeout: 30_000,
      });

      await page.getByRole("button", { name: "Generar" }).click();

      const call = await api.waitFor("GET", "/reports/herd-development", 60_000);
      expect(call.status, "el reporte del hato falló").toBe(200);

      // Contrato: los porcentajes viajan como entero, no como fracción
      const params = new URL(call.url).searchParams;
      expect(params.get("paricionPorcentaje")).toBe("85");
      expect(params.get("lecheParaVentaPorcentaje")).toBe("80");
      expect(params.get("diasLactanciaAnio")).toBe("210");
      expect(params.get("format")).toBe("json");

      // Contrato de la respuesta: situación actual + proyecciones
      const data = call.responseBody?.data;
      expect(data?.currentComposition, "falta currentComposition").toBeTruthy();
      expect(Array.isArray(data?.projections), "projections debe ser arreglo").toBe(true);
      expect(data.projections.length, "deben ser 10 años").toBe(10);

      for (const grupo of ["composition", "purchases", "mortality", "sales", "milkProduction"]) {
        expect(data.projections[0], `al año 1 le falta "${grupo}"`).toHaveProperty(grupo);
      }

      // Y la matriz debe pintarse con sus 11 columnas
      await expect(page.getByText("Sit. Actual")).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Anio 10" })).toBeVisible();

      // Sin filas huérfanas: el aviso de conceptos no encontrados no debe salir
      await expect(page.getByText(/El response no trae/)).toHaveCount(0);

      // El total de cabezas del año 0 debe ser el que devolvió la API
      const fila = page.locator("tr", { hasText: "Total de cabezas" });
      await expect(fila).toContainText(
        Number(data.currentComposition.totalCabezas).toLocaleString("es-MX", {
          maximumFractionDigits: 2,
        })
      );
    });

    test("valida los supuestos antes de consultar", async ({ authedPage: page }) => {
      await abrirReportes(page);
      await elegirTab(page, "Desarrollo del hato");

      const hembras = page.getByLabel("Pariciones hembras (%)").first();
      await expect(hembras).toBeVisible({ timeout: 30_000 });

      // Hembras + machos deben sumar 100
      await hembras.fill("70");
      await expect(page.getByText(/deben sumar 100%/).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Generar" })).toBeDisabled();

      await hembras.fill("50");
      await expect(page.getByRole("button", { name: "Generar" })).toBeEnabled();
    });
  });

  test("un reporte estándar responde en modo Tabla", async ({ authedPage: page, api }) => {
    await abrirReportes(page);
    await elegirTab(page, "Ganaderia");

    const selector = page.getByLabel("Selecciona el reporte a generar").first();
    await selector.click();
    await page.locator(".v-overlay .v-list-item", { hasText: "R-01" }).first().click();

    await page.getByRole("button", { name: "Tabla" }).click();
    await page.getByRole("button", { name: "Consultar" }).click();

    const call = await api.waitFor("GET", "/reports/livestock/herd-inventory", 60_000);
    expect(call.status).toBe(200);
    expect(new URL(call.url).searchParams.get("format")).toBe("json");

    // El modal de resultados abre con sus encabezados en español
    await expect(page.getByText(/Total:\s*\d+\s*registros/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("columnheader", { name: "Arete Interno" })).toBeVisible();
  });

  test("descarga el Excel de un reporte", async ({ authedPage: page }) => {
    await abrirReportes(page);
    await elegirTab(page, "Ganaderia");

    const selector = page.getByLabel("Selecciona el reporte a generar").first();
    await selector.click();
    await page.locator(".v-overlay .v-list-item", { hasText: "R-01" }).first().click();

    // "Excel" exacto: el botón de formato, no el de "Descargar Excel"
    await page.getByRole("button", { name: "Excel", exact: true }).click();

    const descarga = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("button", { name: "Descargar Excel" }).click();

    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toMatch(/^R-01_INVENTARIO_HATO_.*\.xlsx$/);
  });

  test("previsualiza el PDF de un reporte", async ({ authedPage: page, api }) => {
    await abrirReportes(page);
    await elegirTab(page, "Ganaderia");

    const selector = page.getByLabel("Selecciona el reporte a generar").first();
    await selector.click();
    await page.locator(".v-overlay .v-list-item", { hasText: "R-01" }).first().click();

    await page.getByRole("button", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Previsualizar PDF" }).click();

    const call = await api.waitFor("GET", "/reports/livestock/herd-inventory", 60_000);
    expect(new URL(call.url).searchParams.get("format")).toBe("pdf");

    // El visor abre con su botón de descarga
    await expect(page.getByRole("button", { name: "Descargar" })).toBeVisible({
      timeout: 30_000,
    });
  });
});
