import { createRouter, createWebHistory,createWebHashHistory  } from 'vue-router';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(),
  // history: createWebHashHistory (),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const publicPages = ['/signin', '/signup', '/pass-reset', '/pass-change'];
  const authRequired = !publicPages.includes(to.path) && !to.path.startsWith('/pass-reset');
  const loggedIn = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  // Limpiar flag obsoleto por si quedó de sesiones anteriores
  localStorage.removeItem('mustChangePassword');
  sessionStorage.removeItem('mustChangePassword');

  if (authRequired && !loggedIn) {
    return next('/signin');
  }

  /**
   * Permisos por sección: que no baste con esconder la opción del menú,
   * también se bloquea entrar por URL.
   *
   * La importación es dinámica a propósito: el store usa los servicios HTTP,
   * que a su vez importan este router, y cargarlo arriba crearía un ciclo.
   * Si no hay permisos configurados, `canAccess` devuelve null y no estorba.
   */
  if (authRequired && loggedIn) {
    try {
      const { usePermissionsStore } = await import('@/store/permissions');
      const permissions = usePermissionsStore();
      await permissions.load();

      if (permissions.canAccess(to.path) === false) {
        return next('/');
      }
    } catch {
      // Ante cualquier falla se deja pasar: el backend sigue protegiendo los datos
    }
  }

  next();
});

export default router;