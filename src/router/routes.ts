import { DefaultLayout, AuthLayout } from "@/layouts/index";

/* ======================================================
 * AUTH / ACCOUNT
 * ====================================================== */
const accountRoutes = [
  {
    path: "/signin",
    name: "AccountSignIn",
    component: () => import("@/views/account/SignIn.vue"),
    meta: {
      title: "Inicio de sesión",
      authRequired: false,
      layout: AuthLayout
    }
  },
  {
    path: "/pass-reset/:mail?",
    name: "AccountResetPassword",
    component: () => import("@/views/account/ResetPassword.vue"),
    meta: {
      title: "Restablecer contraseña",
      authRequired: false,
      layout: AuthLayout
    }
  },
  {
    path: "/logout",
    name: "Logout",
    component: () => import("@/views/account/Logout.vue"),
    meta: {
      title: "Cerrar sesión",
      authRequired: false
    }
  }
];

/* ======================================================
 * HOME / PAGES
 * ====================================================== */
const pagesRoutes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/pages/Home.vue"),
    meta: {
      title: "Inicio",
      authRequired: false,
      layout: DefaultLayout
    }
  }
];

/* ======================================================
 * CONFIGURACIÓN
 * ====================================================== */
const usersRoutes = [
  {
    path: "/configuracion/usuarios",
    name: "Usuarios",
    component: () => import("@/views/usersModule/Usuarios.vue"),
    meta: {
      title: "Usuarios",
      authRequired: false,
      layout: DefaultLayout
    }
  }
];

const adminRoutes = [
  {
    path: "/administracion/ingresos-egresos",
    name: "IngresosEgresos",
    component: () => import("@/views/contabilidad/Contabilidad.vue"),
    meta: {
      title: "Ingresos y egresos",
      authRequired: true,
      layout: DefaultLayout
    }
  }
];



/* ======================================================
 * EXPORT FINAL
 * ====================================================== */
export const routes = [
  ...accountRoutes,
  ...pagesRoutes,
  ...usersRoutes,
  ...adminRoutes
];
