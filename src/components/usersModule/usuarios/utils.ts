import { MenuSelectItemType } from "@/app/common/components/filters/types";
import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";
import { FilterType, UserType } from "@/components/usersModule/usuarios/types";
import {
  Img1,
  Img2,
  Img3,
  Img4,
  Img5,
  Img6,
  Img7,
  Img8,
  Img9,
} from "@/assets/images/products/utils";
import { TableHeaderType } from "@/app/common/types/table.types";
import { OptionType } from "@/app/common/types/option.type";

export const productBreadcrumb: BreadcrumbType[] = [
  {
    title: "Modulo de usuarios",
    disabled: false,
  },
  {
    title: "usuarios",
    disabled: true,
  },
];

export const filter: FilterType = {
  query: "",
  brands: [],
  category: "",
  discount: "",
};

export const brandOptions: MenuSelectItemType[] = [
  { value: "boat", label: "Boat" },
  { value: "puma", label: "Puma" },
  { value: "adidas", label: "Adidas" },
  { value: "realMe", label: "RealMe" },
];

export const categoryOptions: MenuSelectItemType[] = [
  { value: "Appliances", label: "Appliances" },
  { value: "Automotive Accessories", label: "Automotive Accessories" },
  { value: "Electronics", label: "Electronics" },
  { value: "Fashion", label: "Fashion" },
  { value: "Furniture", label: "Furniture" },
  { value: "Grocery", label: "Grocery" },
  { value: "Headphones", label: "Headphones" },
  { value: "Kids", label: "Kids" },
  { value: "Luggage", label: "Luggage" },
  { value: "Sports", label: "Sports" },
  { value: "Watches", label: "Watches" },
];

export const discountOptions: MenuSelectItemType[] = [
  { value: "50$", label: "50% or more" },
  { value: "40%", label: "40% or more" },
  { value: "30%", label: "30% or more" },
  { value: "20%", label: "20% or more" },
  { value: "10%", label: "10% or more" },
  { value: "0%", label: "Less than 10%" },
];

export const productsHeader: TableHeaderType[] = [
  { title: "Products" },
  { title: "Category" },
  { title: "Stock" },
  { title: "Price" },
  { title: "Orders" },
  { title: "Rating" },
  { title: "Publish" },
  { title: "Action" },
];

export const productAction: OptionType[] = [
  {
    title: "View",
    icon: "ph-eye",
    value: "view",
    to: "/ecommerce/product-details",
  },
  {
    title: "Edit",
    icon: "ph-pencil",
    value: "edit",
  },
  {
    title: "Remove",
    icon: "ph-trash",
    value: "remove",
  },
];

//NUEVAS DEFINICIONES

export const usersHeader: TableHeaderType[] = [
  { title: "Rol" },
  { title: "Nombre" },
  { title: "Apellido" },
  { title: "Telefono" },
  { title: "Correo" },
  { title: "Acciones" },
];

export const userAction: OptionType[] = [
  {
    title: "Editar",
    icon: "ph-pencil",
    value: "edit",
  },
   {
    title: "Resetear contraseña",
    icon: "ph-password",
    value: "password",
  },
  {
    title: "Borrar",
    icon: "ph-trash",
    value: "remove",
  },
 
];

export const users: UserType[] = [
  {
    uuid: "",
    name: "",
    last_name: "",
    phone: "",
    uuidRol: "",
    mail: "",
    password: "",
    nameRol: "",
    role: {
      uuid: "",
      name: "",
    },
  },
];
