import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";
import { FilterType } from "@/components/insuranceModule/insurance/types";
import { TableHeaderType } from "@/app/common/types/table.types";
import { OptionType } from "@/app/common/types/option.type";

export const breadcrumb: BreadcrumbType[] = [
  {
    title: "Modulo de aseguradora",
    disabled: false,
  },
  {
    title: "Aseguradoras",
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
  { title: "Nombre" },
  
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


