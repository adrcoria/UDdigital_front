import {
  MenuItemType,
  BrandsListType,
  CartItemType,
  NotificationType
} from "@/components/layouts/types";
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

const superUser = "44d66fc5-797f-4610-9ce0-13c32c8877c1";
const admin = "87557cc4-333c-4486-ab8e-d9b0dde000d1";
const operativo = "049d1192-be01-418c-b3f1-44020f39ab2d";
const tecnico = "506a9d23-c308-47dc-b132-80c68cd28cd1";

export const menuItems: MenuItemType[] = [
  {
    label: "Administración",
    icon: "ph-gear",
    id: "sidebarAdmin",
    roles: [], // visible para todos
    subMenu: [
      {
        label: "Ingresos y egresos",
        link: "/administracion/ingresos-egresos",
        roles: []
      }
    ]
  }
];

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
