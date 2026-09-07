export const SALE_TYPES = [
  { value: "PIE_DE_CRIA", label: "Pie de cría" },
  { value: "RASTRO",      label: "RASTRO" },
  { value: "CANAL",       label: "CANAL" },
  { value: "RESUELLO",    label: "RESUELLO" },
  { value: "TRUEQUE",     label: "Trueque" },
  { value: "OTRO",        label: "OTRO" },
] as const;

export type SaleTypeValue = (typeof SALE_TYPES)[number]["value"];

export interface SaleOrderItem {
  bovineId: string;
  internalEarTag: string;
  siniigaEarTag?: string;
  name?: string;
  sex?: string;
  races: string;
  weight: number;
  saleValue: number;   // calculado: peso × precio por kilo (no se captura a mano)
}

export interface SaleFilters {
  query: string;
}
