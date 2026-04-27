import { createRouter, createWebHistory,createWebHashHistory  } from 'vue-router';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(),
  // history: createWebHashHistory (),
  routes,
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/signin', '/signup', '/pass-reset', '/pass-change'];
  const authRequired = !publicPages.includes(to.path);
  const loggedIn = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  if (authRequired && !loggedIn) {
    return next('/signin');
  }

  const mustChange = localStorage.getItem('mustChangePassword') || sessionStorage.getItem('mustChangePassword');
  if (loggedIn && mustChange && to.path !== '/pass-change') {
    return next('/pass-change');
  }

  next();
});

export default router;