import { test, expect, openApp } from "../support/fixtures";
import { env } from "../support/env";

const PARAMS = {
  FACTOR_VENTA: "Factor Venta",
  PRECIO_POR_KILO: "Factor de Compra",
  DIAS_CELO: "Dias Celo",
  DIAS_PRENEZ: "Dias Preñez",
};

test.describe("Configuraciones · Parámetros generales", () => {
  test("lista los parámetros y respeta el contrato de la API", async ({
    authedPage: page,
    api,
  }) => {
    await openApp(page, "/configuraciones/parametros", "text=Parámetros generales");
    await expect(page.getByText("Factor Venta")).toBeVisible();

    const call = api.last("GET", "/parameters");
    expect(call, "no se llamó GET /parameters").toBeTruthy();
    expect(call!.status).toBe(200);

    // Contrato: arreglo de { name, value }
    const list = call!.responseBody?.data;
    expect(Array.isArray(list), "data debe ser un arreglo").toBe(true);

    for (const item of list) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("value");
    }

    // Los cuatro parámetros que el sistema espera deben existir
    const names = list.map((p: any) => p.name);
    for (const expected of Object.values(PARAMS)) {
      expect(names, `falta el parámetro "${expected}"`).toContain(expected);
    }
  });

  test("muestra el nombre de negocio junto a la clave técnica", async ({
    authedPage: page,
  }) => {
    await openApp(page, "/configuraciones/parametros", "text=Parámetros generales");

    // "Factor de Compra" es la llave del API, pero el usuario lee "Precio por kilo".
    // Ambos conviven en el mismo renglón: el nombre de negocio y, debajo, la clave.
    const row = page.locator("tr", { hasText: PARAMS.PRECIO_POR_KILO });
    await expect(row).toContainText("Precio por kilo");
    await expect(row).toContainText(PARAMS.PRECIO_POR_KILO);

    // El resto también debe mostrar su nombre de negocio
    await expect(page.locator("tr", { hasText: PARAMS.DIAS_PRENEZ })).toContainText(
      "Días de preñez"
    );
  });

  test("el valor en pantalla es el que devolvió la API", async ({
    authedPage: page,
    api,
  }) => {
    await openApp(page, "/configuraciones/parametros", "text=Parámetros generales");
    await expect(page.getByText("Factor Venta")).toBeVisible();

    const list = api.last("GET", "/parameters")!.responseBody.data;
    const precioPorKilo = list.find((p: any) => p.name === PARAMS.PRECIO_POR_KILO);

    const row = page.locator("tr", { hasText: PARAMS.PRECIO_POR_KILO });
    await expect(row).toContainText(String(precioPorKilo.value));
  });

  test("valida el valor antes de permitir guardar", async ({ authedPage: page }) => {
    await openApp(page, "/configuraciones/parametros", "text=Parámetros generales");

    const row = page.locator("tr", { hasText: PARAMS.DIAS_PRENEZ });
    await row.getByRole("button").first().click();

    await expect(page.getByText("Editar parámetro")).toBeVisible();

    // Días de preñez solo acepta enteros dentro de rango
    const input = page.getByLabel("Valor *");
    await input.fill("12.5");
    await input.blur();
    await expect(page.getByText("Debe ser un número entero")).toBeVisible();

    await input.fill("999");
    await input.blur();
    await expect(page.getByText(/No puede ser mayor a/)).toBeVisible();

    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
    await page.getByRole("button", { name: "Cancelar" }).click();
  });

  test.describe("edición", () => {
    test.skip(
      !env.allowIrreversible,
      "Los parámetros son globales: afectan a toda la operación real. Habilita E2E_ALLOW_IRREVERSIBLE=1"
    );

    test("guarda el valor y lo restaura", async ({ authedPage: page, api }) => {
      await openApp(page, "/configuraciones/parametros", "text=Parámetros generales");
      await expect(page.getByText("Factor Venta")).toBeVisible();

      const list = api.last("GET", "/parameters")!.responseBody.data;
      const original = list.find((p: any) => p.name === PARAMS.DIAS_CELO).value;
      const nuevo = String(Number(original) + 1);

      const editar = async (valor: string) => {
        const row = page.locator("tr", { hasText: PARAMS.DIAS_CELO });
        await row.getByRole("button").first().click();
        await page.getByLabel("Valor *").fill(valor);

        const patch = page.waitForResponse(
          (r) => r.url().includes("/parameters") && r.request().method() === "PATCH"
        );
        await page.getByRole("button", { name: "Guardar" }).click();
        return patch;
      };

      const response = await editar(nuevo);
      expect(response.status()).toBeLessThan(400);

      // Contrato del PATCH: { name, value } con el valor como texto
      const patchCall = api.last("PATCH", "/parameters")!;
      expect(patchCall.requestBody).toEqual({ name: PARAMS.DIAS_CELO, value: nuevo });

      // Y la lista debe reflejarlo
      const row = page.locator("tr", { hasText: PARAMS.DIAS_CELO });
      await expect(row).toContainText(nuevo);

      // Restaurar
      await editar(String(original));
      await expect(page.locator("tr", { hasText: PARAMS.DIAS_CELO })).toContainText(
        String(original)
      );
    });
  });
});
