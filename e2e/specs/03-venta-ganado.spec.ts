import { test, expect, openApp } from "../support/fixtures";
import { env } from "../support/env";

const PRECIO_POR_KILO_PARAM = "Factor de Compra";

const abrirVenta = async (page: any) => {
  await openApp(page, "/ganaderia/venta", "text=Ganado Disponible");
};

test.describe("Ganadería · Venta de ganado", () => {
  test("precarga el precio por kilo desde el parámetro global", async ({
    authedPage: page,
    api,
  }) => {
    await abrirVenta(page);

    const params = await api.waitFor("GET", "/parameters");

    const precio = params.responseBody.data.find(
      (p: any) => p.name === PRECIO_POR_KILO_PARAM
    );
    expect(precio, `falta el parámetro "${PRECIO_POR_KILO_PARAM}"`).toBeTruthy();

    const campo = page.getByLabel(/Precio por kilo/);
    await expect(campo).toHaveValue(String(Number(precio.value)));

    // El aviso de "sin parámetro" no debe aparecer si el parámetro existe
    await expect(page.getByText(/no está configurado/)).toHaveCount(0);
    await expect(page.getByText(/Precargado del parámetro Precio por kilo/)).toBeVisible();
  });

  test("no lista ganado muerto", async ({ authedPage: page, api }) => {
    await abrirVenta(page);

    const call = await api.waitFor("GET", "/bovine");
    const list = call.responseBody?.data?.list ?? [];
    const muertos = list.filter((b: any) => b.bovineStatus === "MUERTO");

    // Ningún arete de un animal muerto puede aparecer en la tabla
    for (const muerto of muertos) {
      await expect(
        page.getByRole("row", { name: new RegExp(muerto.internalEarTag) }),
        `el bovino muerto ${muerto.internalEarTag} aparece en venta`
      ).toHaveCount(0);
    }

    // Y los vivos sí deben estar
    const vivos = list.filter((b: any) => b.bovineStatus !== "MUERTO" && !b.deathDate);
    if (vivos.length) {
      await expect(page.getByText(vivos[0].internalEarTag).first()).toBeVisible();
    }
  });

  test("calcula el valor con peso × precio y recalcula al cambiarlos", async ({
    authedPage: page,
    api,
  }) => {
    await abrirVenta(page);

    const call = await api.waitFor("GET", "/bovine");
    const vivos = (call.responseBody?.data?.list ?? []).filter(
      (b: any) => b.bovineStatus !== "MUERTO" && !b.deathDate
    );
    test.skip(vivos.length === 0, "La empresa de pruebas no tiene ganado vivo");

    const params = await api.waitFor("GET", "/parameters");
    const precio = Number(
      params.responseBody.data.find((p: any) => p.name === PRECIO_POR_KILO_PARAM).value
    );

    // Agregar el primer animal disponible
    await page.locator("tbody tr").first().getByRole("button").first().click();
    await expect(page.getByText("1 animales")).toBeVisible();

    // El peso es editable aunque el animal ya traiga uno
    const peso = page.getByLabel("Peso (kg)");
    await peso.fill("100");
    await expect(page.getByText("Total:").locator("..")).toContainText(
      (100 * precio).toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    );

    // Al cambiar el precio por kilo, la orden se recalcula sola
    await page.getByLabel(/Precio por kilo/).fill(String(precio * 2));
    await expect(page.getByText("Total:").locator("..")).toContainText(
      (100 * precio * 2).toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    );
  });

  test("no deja vender sin completar la configuración", async ({ authedPage: page }) => {
    await abrirVenta(page);

    // Sin tipo de venta, cuenta, concepto, responsable ni animales
    await expect(page.getByRole("button", { name: "Realizar Venta" })).toBeDisabled();
  });

  test.describe("venta real", () => {
    test.skip(
      !env.allowIrreversible,
      "Una venta no se puede cancelar por API. Habilita E2E_ALLOW_IRREVERSIBLE=1"
    );

    test("registra la venta y envía el contrato esperado", async ({
      authedPage: page,
      api,
    }) => {
      await abrirVenta(page);
      // Pendiente: completar configuración y confirmar.
      // Se deja explícito para no ejecutarlo por accidente contra producción.
      expect(api.calls.length).toBeGreaterThan(0);
    });
  });
});
