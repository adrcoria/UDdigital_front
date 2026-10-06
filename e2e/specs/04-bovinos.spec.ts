import { test, expect, openApp } from "../support/fixtures";

/**
 * Alta de bovino por la interfaz, de principio a fin.
 *
 * Es el flujo que da de alta los datos de los que dependen venta, lotes y
 * reportes, por eso se captura completo y no por API. Al final se elimina
 * con DELETE /bovine/{id}, que sí tiene reverso.
 */

/** Arete de 12 dígitos único por corrida, reconocible como dato de prueba */
const areteE2E = () => {
  const base = String(Date.now()).slice(-10);
  return `99${base}`;
};

const abrirBovinos = async (page: any) => {
  await openApp(page, "/ganaderia/bovinos", "text=Inventario de Bovinos");
};

/** Selecciona la primera opción de un autocomplete de Vuetify por su etiqueta */
const elegirPrimera = async (page: any, label: RegExp | string) => {
  await page.getByLabel(label).click();
  const opcion = page.locator(".v-overlay .v-list-item").first();
  await opcion.waitFor({ state: "visible", timeout: 15_000 });
  const texto = (await opcion.textContent())?.trim() ?? "";
  await opcion.click();
  return texto;
};

test.describe("Ganadería · Bovinos", () => {
  test("lista el inventario y respeta el contrato de la API", async ({
    authedPage: page,
    api,
  }) => {
    await abrirBovinos(page);

    const call = await api.waitFor("GET", "/bovine");
    expect(call.status).toBe(200);

    const payload = call.responseBody?.data;
    expect(payload, "la respuesta no trae data").toBeTruthy();
    expect(Array.isArray(payload.list), "data.list debe ser un arreglo").toBe(true);
    expect(payload).toHaveProperty("total");

    // Campos de los que depende el resto del sistema
    if (payload.list.length) {
      const bovino = payload.list[0];
      for (const campo of ["id", "internalEarTag", "siniigaEarTag", "bovineStatus"]) {
        expect(bovino, `al bovino le falta "${campo}"`).toHaveProperty(campo);
      }
    }
  });

  test("registra un bovino y calcula sus valores con los parámetros globales", async ({
    authedPage: page,
    api,
  }) => {
    await abrirBovinos(page);

    const arete = areteE2E();
    const peso = 100;

    await page.getByRole("button", { name: /Registrar Bovino/ }).click();
    await expect(page.getByLabel("Arete Siniiga *")).toBeVisible({ timeout: 30_000 });

    // Los parámetros se consultan al abrir el diálogo, junto con los catálogos
    const params = await api.waitFor("GET", "/parameters");
    const valorDe = (nombre: string) =>
      Number(params.responseBody.data.find((p: any) => p.name === nombre)?.value ?? 0);

    const factorVenta = valorDe("Factor Venta");
    const precioPorKilo = valorDe("Factor de Compra");

    await page.getByLabel("Arete Siniiga *").fill(arete);
    await page.getByLabel("Arete Interno *").fill(arete);
    await page.getByLabel("Nombre / Apodo *").fill("E2E-PRUEBA");
    await page.getByLabel("Peso Neto (kg)").fill(String(peso));
    await page.getByLabel("Fecha Nac. *").fill("2024-01-15");
    await page.getByLabel("Fecha Ingreso Hato *").fill("2024-02-01");

    await elegirPrimera(page, "Sexo *");
    await elegirPrimera(page, "Etapa de vida *");
    await elegirPrimera(page, "Propósito *");
    const origen = await elegirPrimera(page, "Origen *");
    await elegirPrimera(page, "Propietario *");
    await elegirPrimera(page, /Raza/);

    // El valor de compra es calculado: peso x precio por kilo
    if (/COMPRA/i.test(origen)) {
      await expect(page.getByLabel("Valor de Compra *")).toHaveValue(
        String(peso * precioPorKilo)
      );
    }

    const alta = page.waitForResponse(
      (r: any) => r.url().includes("/bovine") && r.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Guardar|Registrar/ }).last().click();

    const response = await alta;
    expect(response.status(), "el alta del bovino falló").toBeLessThan(400);

    // Contrato de lo que el front envía
    const post = await api.waitFor("POST", "/bovine");
    expect(post.requestBody.siniigaEarTag).toBe(arete);
    expect(post.requestBody.netWeight).toBe(peso);
    // El valor de venta se calcula solo con el factor, nunca se captura
    expect(post.requestBody.saleValue).toBe(peso * factorVenta);
    expect(Array.isArray(post.requestBody.raceAssignments)).toBe(true);

    // Y debe aparecer en el listado
    await expect(page.getByText(arete).first()).toBeVisible({ timeout: 30_000 });

    // Limpieza: el bovino de prueba no se queda en la base
    const id = post.responseBody?.data?.id;
    expect(id, "la API no devolvió el id del bovino creado").toBeTruthy();

    const token = await page.evaluate(
      () => localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    );
    const borrado = await page.request.delete(
      `${new URL(post.url).origin}/bovine/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(borrado.status(), "no se pudo borrar el bovino de prueba").toBeLessThan(400);
  });

  test("exige los campos obligatorios antes de guardar", async ({ authedPage: page }) => {
    await abrirBovinos(page);

    await page.getByRole("button", { name: /Registrar Bovino/ }).click();
    await expect(page.getByLabel("Arete Siniiga *")).toBeVisible({ timeout: 30_000 });

    // Arete incompleto: la validación de 12 dígitos debe saltar
    await page.getByLabel("Arete Siniiga *").fill("123");
    await page.getByLabel("Arete Interno *").click();
    await expect(page.getByText(/12 dígitos|12 números/).first()).toBeVisible();
  });
});
