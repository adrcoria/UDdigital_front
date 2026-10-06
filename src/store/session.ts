import { defineStore } from "pinia";

/**
 * Empresa (rancho) activa de la sesión.
 *
 * Existe para que el cambio de rancho no dependa de recargar la página: al
 * cambiar `company`, el `router-view` se remonta con una llave nueva y la
 * pantalla en la que está el usuario vuelve a pedir sus datos con el token
 * nuevo, sin perder la navegación.
 */

const leerUsuario = (): any | null => {
  const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const useSessionStore = defineStore("session", {
  state: () => ({
    company: leerUsuario()?.company ?? null as any,
  }),

  getters: {
    /** Llave del router-view: al cambiar, la vista actual se remonta */
    companyId: (state) => state.company?.id ?? "",

    companyLabel: (state) =>
      state.company?.name
        ? `${state.company.name}${state.company.code ? ` (${state.company.code})` : ""}`
        : "Sin empresa",
  },

  actions: {
    /** Relee lo almacenado: útil al iniciar sesión o al restaurar la sesión */
    sync() {
      this.company = leerUsuario()?.company ?? null;
    },

    /** Cambia la empresa activa y provoca el remontaje de la vista */
    setCompany(company: any) {
      this.company = company ?? null;
    },
  },
});
