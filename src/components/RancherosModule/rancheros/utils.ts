import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";
import { FilterType } from "@/components/RancherosModule/rancheros/types";

export const rancherosBreadcrumb: BreadcrumbType[] = [
  {
    title: "Configuraciones",
    disabled: false,
  },
  {
    title: "Rancheros",
    disabled: true,
  },
];

export const filter: FilterType = {
  query: "",
};
