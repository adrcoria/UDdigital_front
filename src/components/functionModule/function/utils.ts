import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";
import { FilterType } from "@/components/functionModule/function/types";
import { TableHeaderType } from "@/app/common/types/table.types";
import { OptionType } from "@/app/common/types/option.type";

export const breadcrumb: BreadcrumbType[] = [
  {
    title: "Modulo pecuario",
    disabled: false,
  },
  {
    title: "Funciones",
    disabled: true,
  },
];

export const filter: FilterType = {
  query: "",
  brands: [],
  category: "",
  discount: "",
};

//NUEVAS DEFINICIONES

export const headers: TableHeaderType[] = [
  { title: "Función" },
  { title: "Código" },
  { title: "Especie" },
  { title: "Acciones" },
];


export const actions: OptionType[] = [

  {
    title: "Editar",
    icon: "ph-pencil",
    value: "edit",
  },
  {
    title: "Borrar",
    icon: "ph-trash",
    value: "remove",
  },
];


