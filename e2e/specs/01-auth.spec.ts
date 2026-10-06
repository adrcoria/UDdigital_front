import { test, expect, login, openApp } from "../support/fixtures";
import { env } from "../support/env";

test.describe("Autenticación", () => {
  test("rechaza credenciales incorrectas", async ({ page }) => {
    await openApp(page, "/signin", 'input[placeholder="administrador@gmail.com"]');

    await page.getByPlaceholder("administrador@gmail.com").fill("no-existe@e2e.test");
    await page.getByPlaceholder("Ej: ART").fill(env.companyCode);
    await page.getByPlaceholder("••••••••").fill("credencial-invalida");

    const call = page.waitForResponse((r) => r.url().includes("/auth/login"));
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // La API debe rechazar y la UI debe avisar, no quedarse colgada
    const response = await call;
    expect(response.status()).toBeGreaterThanOrEqual(400);
    await expect(page.getByText("Credenciales incorrectas")).toBeVisible();
    await expect(page).toHaveURL(/signin/);
  });

  test("inicia sesión y guarda la sesión del usuario", async ({ page, api }) => {
    await login(page);

    const loginCall = api.last("POST", "/auth/login");
    expect(loginCall, "no se registró la llamada de login").toBeTruthy();

    // Contrato: el login debe devolver los tokens y el usuario con su rol
    const data = loginCall!.responseBody?.data;
    expect(data?.accessToken, "falta accessToken").toBeTruthy();
    expect(data?.refreshToken, "falta refreshToken").toBeTruthy();
    expect(data?.user?.role?.id, "falta el rol del usuario").toBeTruthy();

    // Y el front debe haberla guardado para las siguientes peticiones
    const token = await page.evaluate(
      () => localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    );
    expect(token, "el front no guardó el token").toBeTruthy();
  });

  test("el menú lateral corresponde al rol del usuario", async ({ authedPage: page }) => {
    // Inicio es visible para todos los roles
    await expect(page.getByText("Inicio", { exact: true }).first()).toBeVisible();

    const user = await page.evaluate(() => {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    });
    expect(user?.role?.id, "el usuario no trae rol").toBeTruthy();

    // Configuraciones solo lo ven Super Usuario y Admin
    const SUPER = "09f145c3-9bcc-4573-aa43-7f72f033a28f";
    const ADMIN = "e5c7c4cf-713c-4327-866b-4ee54cb76246";

    if ([SUPER, ADMIN].includes(user.role.id)) {
      await expect(page.getByText("Configuraciones").first()).toBeVisible();
    }
  });
});
