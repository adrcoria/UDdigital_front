import {
  MenuItemType,
  BrandsListType,
  CartItemType,
  NotificationType
} from "@/components/layouts/types";

// Importamos el objeto ROLES para usar los UUIDs originales
import { ROLES,getUserRole  } from "@/app/utils/authHelper";
console.log("ROL ACTUAL:", getUserRole());
console.log("ROL SUPER:", ROLES.SUPER_USER);

// Imágenes de marcas y assets (mantenemos tus imports actuales)
import {
  gitHub,
  bitBucket,
  dribbble,
  dropbox,
  mail_chimp,
  slack
} from "@/assets/images/brands/utils";
import { Img1, Img5, Img10 } from "@/assets/images/products/utils";
import { Avatar2, Avatar8 } from "@/assets/images/users/utils";

/* ======================================================
 * CONFIGURACIÓN DEL MENÚ POR ROLES
 * ====================================================== */
export const menuItems: MenuItemType[] = [
  {
    label: "Inicio",
    icon: "ph-house",
    id: "sidebarHome",
    roles: [], // Visible para todos
    link: "/"
  },
  {
    label: "Configuraciones",
    icon: "ph-gear",
    id: "sidebarConfig",
    // Solo Super Usuario y Admin
    roles: [ROLES.SUPER_USER, ROLES.ADMIN],
    subMenu: [
      {
        label: "Usuarios",
        link: "/configuraciones/usuarios",
        // Super Usuario y Admin
        roles: [ROLES.SUPER_USER, ROLES.ADMIN]
      },
      {
        label: "Empresas",
        link: "/configuraciones/empresas",
        // SOLO Super Usuario
        roles: [ROLES.SUPER_USER]
      }
    ]
  },
  {
    label: "Administración",
    icon: "ph-chart-line-up",
    id: "sidebarAdmin",
    // Visible para los tres roles
    roles: [ROLES.SUPER_USER, ROLES.ADMIN, ROLES.CAPTURISTA],
    subMenu: [
      {
        label: "Ingresos y egresos",
        link: "/administracion/ingresos-egresos",
        roles: [ROLES.SUPER_USER, ROLES.ADMIN, ROLES.CAPTURISTA]
      }
    ]
  }
];

/* ======================================================
 * RESTO DE CONFIGURACIONES (Brands, Cart, Notifications)
 * ====================================================== */
export const brandsList: BrandsListType[] = [
  { src: gitHub, title: "GitHub" },
  { src: bitBucket, title: "Bitbucket" },
  { src: dribbble, title: "Dribbble" },
  { src: dropbox, title: "Dropbox" },
  { src: mail_chimp, title: "Mail Chimp" },
  { src: slack, title: "Slack" }
];

export const cartItems: CartItemType[] = [
  {
    id: 1,
    src: Img1,
    subTitle: "Fashion",
    title: "Blive Printed Men Round Neck",
    price: 327.49,
    items: 2
  },
  {
    id: 2,
    src: Img5,
    subTitle: "Sportwear",
    title: "Willage Volleyball Ball",
    price: 49.06,
    items: 3
  },
  {
    id: 3,
    src: Img10,
    subTitle: "Fashion",
    title: "Cotton collar t-shirts for men",
    price: 53.33,
    items: 3
  }
];

export const notifications: NotificationType[] = [
  {
    isSelected: false,
    id: "unread-1",
    src: Avatar2,
    title: "Angela Bernier",
    message: "Answered to your comment on the cash flow forecast's graph 🔔.",
    time: "48 min ago",
    isRead: false
  },
  {
    isSelected: false,
    id: "unread-2",
    icon: "bx bx-badge-check bx-xs",
    message: `<h4>Your <b>Elite</b> author Graphic Optimization <span class="text-secondary">reward</span> is ready!</h4>`,
    time: "Just 30 sec ago",
    isRead: false
  },
  {
    isSelected: false,
    id: "unread-3",
    icon: "bx bx-message-square-dots",
    message: `<h4>You have received <b class="text-success">20</b> new messages in the conversation</h4>`,
    time: "2 hrs ago",
    isRead: false
  },
  {
    isSelected: false,
    id: "read-1",
    src: Avatar8,
    title: "Maureen Gibson",
    message: "We talked about a project on linkedin.",
    time: "4 hrs ago",
    isRead: true
  }
];
