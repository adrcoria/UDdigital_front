import { test as base, expect, type Page } from "@playwright/test";
import { env } from "./env";

/** Una llamada a la API observada durante la prueba */
export interface ApiCall {
  method: string;
  url: string;
  path: string;
  status: number;
  requestBody: any;
  responseBody: any;
}

/**
 * Graba las llamadas a la API que dispara la interfaz.
 * Es lo que permite validar el contrato (request y response) sin salirse
 * del flujo real del front.
 */
export class ApiRecorder {
  calls: ApiCall[] = [];

  constructor(private page: Page) {
    page.on("response", async (response) => {
      const url = response.url();
      // Solo las llamadas al backend: ni assets de Vite, ni fuentes, ni CDNs
      if (!url.startsWith(env.apiURL)) return;

      const request = response.request();
      let responseBody: any = null;
      let requestBody: any = null;

      try {
        const type = response.headers()["content-type"] || "";
        if (type.includes("application/json")) responseBody = await response.json();
      } catch { /* respuestas binarias (xlsx, pdf) o vacias */ }

      try {
        const post = request.postData();
        if (post) requestBody = JSON.parse(post);
      } catch { requestBody = request.postData(); }

      this.calls.push({
        method: request.method(),
        url,
        path: new URL(url).pathname,
        status: response.status(),
        requestBody,
        responseBody,
      });
    });
  }

  /** Llamadas que coinciden con un metodo y un fragmento de ruta */
  find(method: string, pathFragment: string): ApiCall[] {
    return this.calls.filter(
      (c) => c.method === method.toUpperCase() && c.path.includes(pathFragment)
    );
  }

  last(method: string, pathFragment: string): ApiCall | undefined {
    return this.find(method, pathFragment).pop();
  }

  /**
   * Espera a que la llamada quede registrada.
   * El handler de `response` parsea el cuerpo de forma asincrona, asi que la
   * llamada aparece un instante despues de que la interfaz ya se pinto.
   */
  async waitFor(method: string, pathFragment: string, timeout = 20_000): Promise<ApiCall> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const call = this.last(method, pathFragment);
      if (call) return call;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(
      `No se registró ${method} ${pathFragment}. Llamadas vistas: ` +
        (this.calls.map((c) => `${c.method} ${c.path}`).join(", ") || "ninguna")
    );
  }

  /** Llamadas con error, excluyendo las rutas que la prueba espera que fallen */
  failures(ignore: string[] = []): ApiCall[] {
    return this.calls.filter(
      (c) => c.status >= 400 && !ignore.some((i) => c.path.includes(i))
    );
  }

  reset() {
    this.calls = [];
  }
}

/**
 * Abre una ruta y espera a que la app monte.
 * El primer render de Vite en dev puede tardar bastante mas que el
 * timeout normal de una accion, por eso la espera es explicita y generosa.
 */
export const openApp = async (page: Page, path: string, readySelector: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.locator(readySelector).first().waitFor({ state: "visible", timeout: 90_000 });
};

/** Inicia sesion por la interfaz, como lo hace un usuario */
export const login = async (page: Page) => {
  await openApp(page, "/signin", 'input[placeholder="administrador@gmail.com"]');

  await page.getByPlaceholder("administrador@gmail.com").fill(env.mail);
  await page.getByPlaceholder("Ej: ART").fill(env.companyCode);
  await page.getByPlaceholder("••••••••").fill(env.password);

  const loginCall = page.waitForResponse(
    (r) => r.url().includes("/auth/login") && r.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  const response = await loginCall;
  expect(
    response.status(),
    "El login falló: revisa las credenciales de e2e/.env.e2e"
  ).toBeLessThan(400);

  // El alta de sesion redirige al inicio
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 30_000 });
};

/** Navega por el menu lateral: valida que el modulo sea alcanzable como lo haria un usuario */
export const openMenu = async (page: Page, menu: string, submenu?: string) => {
  await page.getByRole("button", { name: menu, exact: false }).first().click();
  if (submenu) {
    await page.getByRole("link", { name: submenu, exact: false }).first().click();
  }
};

/** Marca de tiempo para que los datos de prueba sean identificables y unicos */
export const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes()
  ).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
};

/** Prefijo de todo dato que crean las pruebas, para poder identificarlo y limpiarlo */
export const testName = (label: string) => `E2E-${label}-${stamp()}`;

type Fixtures = {
  api: ApiRecorder;
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  api: async ({ page }, use) => {
    const recorder = new ApiRecorder(page);
    await use(recorder);
  },

  authedPage: async ({ page, api }, use) => {
    await login(page);
    api.reset();
    await use(page);
  },
});

export { expect };
