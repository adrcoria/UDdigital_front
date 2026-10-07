import { defineStore } from "pinia";
import { permitService } from "@/app/http/httpServiceProvider";
import { getUserRole } from "@/app/utils/authHelper";

/**
 * Permisos del usuario: qué secciones puede ver en su menú.
 *
 * Se cargan una vez por sesión desde GET /permit/role/:roleId y se cruzan
 * con el menú por la RUTA de cada entrada.
 *
 * Regla de seguridad al revés de lo habitual: si los permisos no se pueden
 * cargar, o el rol no tiene ninguno configurado, se cae al filtro por rol de
 * siempre en vez de dejar el menú vacío. Un menú en blanco por una API caída
 * deja al usuario sin poder trabajar, y el backend sigue protegiendo los
 * datos de todos modos.
 */
export const usePermissionsStore = defineStore("permissions", {
  state: () => ({
    allowedPaths: new Set<string>(),
    loaded: false,
    loading: false,
    /** true cuando no hay permisos utilizables y se usa el filtro por rol */
    usingFallback: true,
  }),

  getters: {
    /**
     * ¿La ruta es visible para el usuario?
     * Sin permisos configurados devuelve null, para que quien pregunte use
     * su propio criterio (el filtro por rol).
     */
    canAccess: (state) => {
      return (path?: string): boolean | null => {
        if (state.usingFallback || !path) return null;
        return state.allowedPaths.has(path.trim());
      };
    },
  },

  actions: {
    async load(force = false) {
      if (this.loading || (this.loaded && !force)) return;

      const roleId = getUserRole();
      if (!roleId) return;

      try {
        this.loading = true;
        const res = await permitService.getPermitsByRole(roleId);
        const permisos = res.data?.data ?? [];

        const rutas = (Array.isArray(permisos) ? permisos : [])
          // Una sección inactiva no se muestra aunque el rol la tenga asignada
          .filter((p: any) => p?.webSection?.isActive !== false)
          .map((p: any) => String(p?.webSection?.path || "").trim())
          .filter(Boolean);

        this.allowedPaths = new Set(rutas);
        this.usingFallback = rutas.length === 0;
        this.loaded = true;
      } catch {
        // API caída o módulo aún no configurado: se mantiene el filtro por rol
        this.allowedPaths = new Set();
        this.usingFallback = true;
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },

    reset() {
      this.allowedPaths = new Set();
      this.loaded = false;
      this.usingFallback = true;
    },
  },
});
