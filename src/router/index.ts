import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/signin', '/signup', '/pass-reset', '/pass-change'];
  const authRequired = !publicPages.includes(to.path);
  const loggedIn = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (authRequired && !loggedIn) {
    return next('/signin');
  }

  next();
});

export default router;