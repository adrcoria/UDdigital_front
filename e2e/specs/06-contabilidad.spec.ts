import { test, expect, openApp, apiClient, testName } from "../support/fixtures";

const SUPER_USER = "09f145c3-9bcc-4573-aa43-7f72f033a28f";

const abrir = async (page: any) => {
  await openApp(page, "/administracion/ingresos-egresos", "text=Operaciones del día");
};

/** Primer día del mes en curso: el inicio del periodo abierto */
const inicioDelPeriodo = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
};

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

/**
 * Un autocomplete de Vuetify expone dos elementos con la misma etiqueta,
 * así que siempre se toma el primero para no caer en strict mode.
 */
const campo = (page: any, label: string | RegExp) => page.getByLabel(label).first();

/** Elige una opción de un autocomplete de Vuetify buscándola por texto */
const elegirOpcion = async (page: any, label: string | RegExp, texto: string) => {
  const campo = page.getByLabel(label).first();
  await campo.click();
  await campo.fill(texto);

  const opcion = page
    .locator(".v-overlay .v-list-item", { hasText: new RegExp(texto, "i") })
    .first();
  await opcion.waitFor({ state: "visible", timeout: 15_000 });
  await opcion.click();
};

const elegirPrimera = async (page: any, label: string | RegExp) => {
  await page.getByLabel(label).first().click();
  const opcion = page.locator(".v-overlay .v-list-item").first();
  await opcion.waitFor({ state: "visible", timeout: 15_000 });
  const texto = (await opcion.textContent())?.trim() ?? "";
  await opcion.click();
  return texto;
};

test.describe("Administración · Ingresos y egresos", () => {
  test("lista las operaciones y respeta el contrato de la API", async ({
    authedPage: page,
    api,
  }) => {
    await abrir(page);

    const call = await api.waitFor("GET", "/operation");
    expect(call.status).toBe(200);

    const payload = call.responseBody?.data;
    expect(payload, "la respuesta no trae data").toBeTruthy();
    expect(Array.isArray(payload.data), "data.data debe ser un arreglo").toBe(true);
    expect(payload).toHaveProperty("total");

    // El listado filtra por el día en curso
    const params = new URL(call.url).searchParams;
    expect(params.get("dateInit"), "no se mandó el rango de fechas").toBeTruthy();
    expect(params.get("dateEnd")).toBeTruthy();
  });

  test("el candado de meses vencidos aplica según el rol", async ({ authedPage: page }) => {
    await abrir(page);

    const user = await page.evaluate(() => {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    });

    await page.getByRole("button", { name: /Registrar operación/ }).click();
    const fecha = campo(page, "Fecha *");
    await expect(fecha).toBeVisible({ timeout: 30_000 });

    const min = await fecha.getAttribute("min");

    if (user?.role?.id === SUPER_USER) {
      // El Super Usuario puede ajustar meses cerrados: sin tope inferior
      expect(min, "el Super Usuario no debería tener candado").toBeFalsy();
    } else {
      // Todos los demás quedan atados al mes en curso
      expect(min, "falta el candado de meses vencidos").toBe(inicioDelPeriodo());

      // Y si fuerzan una fecha vencida, el formulario lo rechaza
      await fecha.fill("2020-01-15");
      await expect(page.getByText(/Mes cerrado/i).first()).toBeVisible();
    }
  });

  test("registra una operación y la elimina", async ({ authedPage: page, api }) => {
    const client = await apiClient(page);

    // Escenario: cuenta -> categoría -> concepto, creados para esta prueba
    const sufijo = testName("CONT");
    const cuenta = (
      await client.post("/account", {
        name: sufijo,
        description: "Cuenta de prueba E2E",
        currentBalance: 0,
      })
    ).data;

    const categoria = (
      await client.post("/concept-category", {
        name: `${sufijo}-CAT`,
        description: "Categoría de prueba E2E",
        accountId: cuenta.id,
      })
    ).data;

    const concepto = (
      await client.post("/concept", {
        name: `${sufijo}-CON`,
        description: "Concepto de prueba E2E",
        polarity: 1,
        idConceptCategory: categoria.id,
      })
    ).data;

    let operacionId: string | undefined;

    try {
      await abrir(page);
      await page.getByRole("button", { name: /Registrar operación/ }).click();
      await expect(campo(page, "Cuenta *")).toBeVisible({ timeout: 30_000 });

      await elegirOpcion(page, "Cuenta *", sufijo);
      await elegirOpcion(page, "Categoría *", `${sufijo}-CAT`);
      await elegirOpcion(page, "Concepto *", `${sufijo}-CON`);

      await campo(page, "Comentarios *").fill("Operación de prueba E2E");
      await campo(page, "Cantidad *").fill("2");
      await elegirPrimera(page, "Unidad de Medida *");
      await campo(page, "Monto *").fill("150");
      await campo(page, "Fecha *").fill(hoyISO());
      await elegirPrimera(page, "Responsable *");

      const alta = page.waitForResponse(
        (r: any) =>
          r.url().includes("/operation") && r.request().method() === "POST"
      );
      await page.getByRole("button", { name: "Guardar" }).click();

      const response = await alta;
      expect(response.status(), "el alta de la operación falló").toBeLessThan(400);

      // Contrato de lo que el front envía
      const post = await api.waitFor("POST", "/operation");
      expect(post.requestBody.idAccount).toBe(cuenta.id);
      expect(post.requestBody.idConcept).toBe(concepto.id);
      expect(post.requestBody.amount).toBe(150);
      expect(post.requestBody.quantity).toBe(2);
      expect(post.requestBody.operationDate).toContain(hoyISO());
      expect(post.requestBody.idResponsible, "falta el responsable").toBeTruthy();

      operacionId = post.responseBody?.data?.id;
      expect(operacionId, "la API no devolvió el id de la operación").toBeTruthy();

      // Y debe aparecer en el listado del día
      await expect(page.getByText("Operación de prueba E2E").first()).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      // Limpieza en orden inverso a las dependencias
      if (operacionId) await client.remove(`/operation/${operacionId}`);
      await client.remove(`/concept/${concepto.id}`);
      await client.remove(`/concept-category/${categoria.id}`);
      await client.remove(`/account/${cuenta.id}`);
    }
  });

  test("no permite guardar con campos incompletos", async ({ authedPage: page }) => {
    await abrir(page);

    await page.getByRole("button", { name: /Registrar operación/ }).click();
    await expect(campo(page, "Cuenta *")).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
});
