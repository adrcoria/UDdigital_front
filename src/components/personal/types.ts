export const SEX_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO",  label: "Femenino" },
] as const;

export const CONTRACT_TYPES = [
  { value: "FIJO",     label: "Fijo",     color: "success" },
  { value: "TEMPORAL", label: "Temporal", color: "info" },
] as const;

export const ESCOLARITY_OPTIONS = [
  { value: "PRIMARIA",       label: "Primaria" },
  { value: "SECUNDARIA",     label: "Secundaria" },
  { value: "PREPARATORIA",   label: "Preparatoria" },
  { value: "TECNICA",        label: "Carrera técnica" },
  { value: "LICENCIATURA",   label: "Licenciatura" },
  { value: "POSGRADO",       label: "Posgrado" },
  { value: "NINGUNA",        label: "Ninguna" },
] as const;

export type SexValue = (typeof SEX_OPTIONS)[number]["value"];
export type ContractType = (typeof CONTRACT_TYPES)[number]["value"];

export interface Personal {
  id: string;
  name: string;
  lastName: string;
  secondLastName?: string;
  address?: string;
  phone?: string;
  curp?: string;
  sex?: string;
  position?: { id: string; name: string };
  birthDate?: string;
  age?: number;
  salary?: string | number;
  escolarity?: string | null;
  entryDate?: string;
  contractType?: string;
  photo?: string | null;
  company?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}
