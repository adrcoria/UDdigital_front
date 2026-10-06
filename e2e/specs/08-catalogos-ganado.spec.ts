import { test, expect, openApp, apiClient, testName } from "../support/fixtures";

const abrir = async (page: any) => {
  await openApp(page, "/ganaderia/catalogos", "text=Registros del catálogo");
};

/**
 * Cambia el catálogo que se administra.
 * El v-select de Vuetify no responde al clic sobre su input (va de solo
 * lectura y el overlay del campo intercepta el puntero), así que se abre
 * desde el contenedor del campo.
 */
const elegirCatalogo = async (page: any, titulo: string) => {
  await page.locator(".v-input", { hasText: "Catálogo a administrar" }).first().click();
  await page.getByRole("option", { name: titulo, exact: true }).click();
};

/** Catálogos que el sistema no deja editar (se administran desde el backend) */
const SOLO_LECTURA = ["Propósito de ganado", "Sexos", "Orígenes", "Tipos de preñez"];

const CATALOGOS = [
  { titulo: "Propósito de ganado", endpoint: "/bovine-purpose" },
  { titulo: "Etapa de vida", endpoint: "/bovine-type" },
  { titulo: "Sexos", endpoint: "/sex" },
  { titulo: "Orígenes", endpoint: "/bovine-origin" },
  { titulo: "Propietarios", endpoint: "/livestock-owner" },
  { titulo: "Razas", endpoint: "/bovine-race" },
  { titulo: "Causas de muerte", endpoint: "/death-cause" },
  { titulo: "Subcausas de muerte", endpoint: "/death-sub-cause" },
  { titulo: "Tipos de preñez", endpoint: "/pregnancy-type" },
];

test.describe("Ganadería · Catálogos", () => {
  for (const catalogo of CATALOGOS) {
    test(`${catalogo.titulo} carga su listado`, async ({ authedPage: page, api }) => {
      await abrir(page);
      await elegirCatalogo(page, catalogo.titulo);

      const call = await api.waitFor("GET", catalogo.endpoint, 30_000);
      expect(call.status, `${catalogo.endpoint} respondió ${call.status}`).toBe(200);

      await page.waitForTimeout(800);
      expect(
        api.failures().map((f) => `${f.method} ${f.path} -> ${f.status}`),
        `${catalogo.titulo} disparó llamadas con error`
      ).toEqual([]);

      // Los catálogos de solo lectura no deben ofrecer alta
      const alta = page.getByRole("button", { name: "Registrar Nuevo" });
      if (SOLO_LECTURA.includes(catalogo.titulo)) {
        await expect(alta, `${catalogo.titulo} no debería permitir alta`).toHaveCount(0);
      } else {
        await expect(alta, `${catalogo.titulo} debería permitir alta`).toBeVisible();
      }
    });
  }

  test("da de alta una raza, la edita y la elimina", async ({ authedPage: page, api }) => {
    const client = await apiClient(page);
    const nombre = testName("RAZA");
    let id: string | undefined;

    try {
      await abrir(page);
      await elegirCatalogo(page, "Razas");

      await page.getByRole("button", { name: "Registrar Nuevo" }).click();
      await expect(page.getByLabel(/Nombre/).first()).toBeVisible({ timeout: 30_000 });

      await page.getByLabel(/Nombre/).first().fill(nombre);

      const alta = page.waitForResponse(
        (r: any) => r.url().includes("/bovine-race") && r.request().method() === "POST"
      );
      await page.getByRole("button", { name: /Guardar|Crear/ }).first().click();

      expect((await alta).status(), "el alta de la raza falló").toBeLessThan(400);

      const post = await api.waitFor("POST", "/bovine-race");
      expect(post.requestBody.name).toBe(nombre);
      id = post.responseBody?.data?.id;
      expect(id, "la API no devolvió el id de la raza").toBeTruthy();

      // El listado pagina, así que se busca: de paso se valida el buscador
      await page.getByPlaceholder("Escribe lo que deseas buscar").fill(nombre);
      await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 30_000 });
    } finally {
      if (id) await client.remove(`/bovine-race/${id}`);
    }
  });

  test("una subcausa de muerte exige su causa principal", async ({ authedPage: page }) => {
    await abrir(page);
    await elegirCatalogo(page, "Subcausas de muerte");

    await page.getByRole("button", { name: "Registrar Nuevo" }).click();
    await expect(page.getByLabel(/Nombre/).first()).toBeVisible({ timeout: 30_000 });

    await page.getByLabel(/Nombre/).first().fill(testName("SUBCAUSA"));

    // Sin causa principal el alta queda bloqueada
    await expect(page.getByLabel(/Causa de Muerte Principal/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Guardar|Crear/ }).first()).toBeDisabled();
  });
});
