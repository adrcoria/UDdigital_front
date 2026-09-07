import { createRouter, createWebHistory,createWebHashHistory  } from 'vue-router';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(),
  // history: createWebHashHistory (),
  routes,
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/signin', '/signup', '/pass-reset', '/pass-change'];
  const authRequired = !publicPages.includes(to.path) && !to.path.startsWith('/pass-reset');
  const loggedIn = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  // Limpiar flag obsoleto por si quedó de sesiones anteriores
  localStorage.removeItem('mustChangePassword');
  sessionStorage.removeItem('mustChangePassword');

  if (authRequired && !loggedIn) {
    return next('/signin');
  }

  next();
});

export default router;