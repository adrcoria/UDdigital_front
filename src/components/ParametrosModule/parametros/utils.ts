import { BreadcrumbType } from "@/app/common/types/breadcrumb.type";
import { PARAMETER_NAMES, PARAMETER_LABELS } from "@/app/http/services/parameterService";

export const parametrosBreadcrumb: BreadcrumbType[] = [
  {
    title: "Configuraciones",
    disabled: false,
  },
  {
    title: "Parámetros generales",
    disabled: true,
  },
];

export interface Parameter {
  name: string;
  value: string;
}

/**
 * Metadatos de los parámetros conocidos.
 *
 * `name` es la llave exacta del API: con ella viaja el PATCH, así que no se
 * traduce ni se normaliza. `label` y `description` son solo presentación.
 *
 * Un parámetro que el backend agregue y no esté aquí se muestra igual, con su
 * nombre tal cual y validación numérica libre.
 */
export interface ParameterMeta {
  name: string;
  label: string;
  description: string;
  unit?: string;
  /** false = solo enteros */
  decimals: boolean;
  min?: number;
  max?: number;
}

export const PARAMETER_META: ParameterMeta[] = [
  {
    name: PARAMETER_NAMES.FACTOR_VENTA,
    label: PARAMETER_LABELS[PARAMETER_NAMES.FACTOR_VENTA],
    description:
      "Multiplica el peso neto del bovino para calcular su valor de venta al registrarlo.",
    unit: "$ / kg",
    decimals: true,
    min: 0,
  },
  {
    // La llave del API dice "Factor de Compra", pero el valor es el precio por
    // kilo. Se respeta la llave porque con ella viaja el PATCH.
    name: PARAMETER_NAMES.PRECIO_POR_KILO,
    label: PARAMETER_LABELS[PARAMETER_NAMES.PRECIO_POR_KILO],
    description:
      "Precio por kilo del ganado. Calcula el valor de compra del bovino y precarga el precio en Venta de Ganado.",
    unit: "$ / kg",
    decimals: true,
    min: 0,
  },
  {
    name: PARAMETER_NAMES.DIAS_CELO,
    label: PARAMETER_LABELS[PARAMETER_NAMES.DIAS_CELO],
    description: "Duración del ciclo de celo, en días.",
    unit: "días",
    decimals: false,
    min: 1,
    max: 365,
  },
  {
    name: PARAMETER_NAMES.DIAS_PRENEZ,
    label: PARAMETER_LABELS[PARAMETER_NAMES.DIAS_PRENEZ],
    description: "Duración de la gestación, en días. Define la fecha probable de parto.",
    unit: "días",
    decimals: false,
    min: 1,
    max: 400,
  },
];

/** Metadatos del parámetro, o un fallback para los que el backend agregue después */
export const getParameterMeta = (name: string): ParameterMeta =>
  PARAMETER_META.find((p) => p.name === name) ?? {
    name,
    label: name,
    description: "",
    decimals: true,
  };
