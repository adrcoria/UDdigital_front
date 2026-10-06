import { test, expect, openApp } from "../support/fixtures";

/**
 * Cambio de rancho desde Bovinos.
 *
 * Dos cosas que deben cumplirse a la vez:
 *   1. El usuario NO sale de la pantalla en la que estaba.
 *   2. Esa pantalla vuelve a pedir sus datos con el token nuevo.
 */
test.describe("Cambio de rancho", () => {
  test("no saca al usuario de la pantalla y recarga sus datos", async ({
    authedPage: page,
    api,
  }) => {
    await openApp(page, "/ganaderia/bovinos", "text=Inventario de Bovinos");

    const antes = await api.waitFor("GET", "/bovine", 30_000);
    const idsAntes = (antes.responseBody?.data?.list ?? []).map((b: any) => b.id).sort();

    const botonCambiar = page.getByRole("button").filter({ has: page.locator(".ph-swap") });
    test.skip(
      (await botonCambiar.count()) === 0,
      "El cambio de rancho solo está disponible para Super Usuario"
    );

    api.reset();
    await botonCambiar.first().click();
    // "Cambiar Rancho" también es el tooltip del botón: se espera algo del diálogo
    await expect(page.getByLabel("Rancho actual").first()).toBeVisible({ timeout: 30_000 });

    // Elegir el primer rancho destino disponible
    await page.locator(".v-input", { hasText: "Rancho destino" }).first().click();
    const opcion = page.locator(".v-overlay .v-list-item").first();
    await opcion.waitFor({ state: "visible", timeout: 15_000 });
    const destino = (await opcion.textContent())?.trim() ?? "";
    await opcion.click();

    const cambio = page.waitForResponse(
      (r: any) =>
        r.url().includes("/auth/switch-company") && r.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Cambiar" }).click();

    expect((await cambio).status(), "el cambio de rancho falló").toBeLessThan(400);

    // 1. Sigue en Bovinos: el cambio de rancho no es una navegación
    await expect(page).toHaveURL(/\/ganaderia\/bovinos/);
    await expect(page.getByText("Inventario de Bovinos")).toBeVisible();

    // 2. La vista se remontó y volvió a consultar con el token nuevo
    const despues = await api.waitFor("GET", "/bovine", 30_000);
    expect(despues.status).toBe(200);

    // 3. Y el token que usó ya es el del rancho destino
    const token = await page.evaluate(
      () => localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    );
    const claims = JSON.parse(
      Buffer.from(String(token).split(".")[1], "base64").toString()
    );
    const empresa = await page.evaluate(() => {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      return raw ? JSON.parse(raw).company : null;
    });
    expect(claims.companyId, "el token no quedó con la empresa destino").toBe(empresa.id);
    expect(destino, "la empresa guardada no es la elegida").toContain(empresa.name);

    // 4. Con el backend filtrando por empresa, el inventario debe cambiar
    const idsDespues = (despues.responseBody?.data?.list ?? []).map((b: any) => b.id).sort();
    expect(
      idsDespues.join(","),
      "el listado trae el mismo ganado: el backend no está filtrando por empresa"
    ).not.toBe(idsAntes.join(","));
  });
});
