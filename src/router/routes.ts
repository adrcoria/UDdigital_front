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
const configRoutes = [
  {
    path: "/configuraciones/usuarios",
    name: "Usuarios",
    component: () => import("@/views/usuarios/Usuarios.vue"),
    meta: {
      title: "Usuarios",
      authRequired: true, // Cambiado a true si requiere login
      layout: DefaultLayout
    }
  },
  {
    path: "/configuraciones/empresas",
    name: "Empresas",
    component: () => import("@/views/empresas/Empresas.vue"),
    meta: {
      title: "Empresas",
      authRequired: true,
      layout: DefaultLayout
    }
  }
];

/* ======================================================
 * GANADERÍA
 * ====================================================== */
const livestockRoutes = [
  {
    path: "/ganaderia/catalogos",
    name: "LivestockCatalogs",
    component: () => import("@/views/livestock/LivestockCatalogPage.vue"),
    meta: {
      title: "Catálogos de Ganado",
      authRequired: true,
      layout: DefaultLayout
    }
  },
  {
    path: "/ganaderia/bovinos",
    name: "LivestockBovines",
    // Esta es la página que creamos con el Breadcrumb y el BovineIndex
    component: () => import("@/views/livestock/BovinePage.vue"),
    meta: {
      title: "Administración de Ganado",
      authRequired: true,
      layout: DefaultLayout
    }
  }
  ,
  {
    path: "/ganaderia/engorda",
    name: "LivestockEngorda",
    component: () => import("@/views/loteEngorda/LoteEngoarda.vue"),
    meta: {
      title: "Módulo de Engorda",
      authRequired: true,
      layout: DefaultLayout
    }
  },
  {
    path: "/ganaderia/leche",
    name: "LivestockLeche",
    component: () => import("@/views/loteLeche/LoteLeche.vue"),
    meta: {
      title: "Módulo de Producción de Leche",
      authRequired: true,
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
  },
  {
    path: "/administracion/reportes", // NUEVA RUTA
    name: "Reportes",
    // Apunta a la nueva vista que creamos
    component: () => import("@/views/reportes/Reportes.vue"),
    meta: {
      title: "Centro de Reportes",
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
  ...configRoutes,
  ...adminRoutes,
  ...livestockRoutes
];
