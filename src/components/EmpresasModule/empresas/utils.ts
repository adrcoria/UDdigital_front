import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";
import {  DisburserType, FilterType } from "@/components/disburserModule/disburser/types";
import { TableHeaderType } from "@/app/common/types/table.types";
import { OptionType } from "@/app/common/types/option.type";

export const productBreadcrumb: BreadcrumbType[] = [
  {
    title: "Administración",
    disabled: false,
  },
  {
    title: "Ingresos y Egresos",
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
  { title: "" },
  { title: "Folio constancia" },
  { title: "Folio suscripción" },
  { title: "Tipo suscripción" },
  { title: "Productor" },
  { title: "Fecha solicitud" },
  { title: "Estatus" },
  { title: "Orden de trabajo" },
  { title: "Agendado para" },
  
  { title: "Acciones" },
  { title: "Ver más" }
];


export const actions: OptionType[] = [
  {
    title: "Consultar",
    icon: "ph-eye",
    value: "view",
  },
  {
    title: "Orden",
    icon: "ph-user",
    value: "order",
  },
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



export const users: DisburserType[] = [{
  uuid: "",
  name: "",
  code: "" 
}]
