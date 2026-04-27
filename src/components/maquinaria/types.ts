export const MACHINERY_STATUS = [
  { value: "OPERATIVA",     label: "Operativa",        color: "success" },
  { value: "MANTENIMIENTO", label: "En mantenimiento", color: "warning" },
  { value: "FUERA_SERVICIO", label: "Fuera de servicio", color: "error" },
  { value: "BAJA",          label: "Baja",             color: "grey" },
] as const;

export const TRANSMISSION_TYPES = [
  { value: "AUTO",     label: "Automática" },
  { value: "MANUAL",   label: "Manual" },
  { value: "HIBRIDA",  label: "Híbrida" },
] as const;

export const FUEL_TYPES = [
  { value: "DIESEL",     label: "Diésel" },
  { value: "GASOLINA",   label: "Gasolina" },
  { value: "ELECTRICO",  label: "Eléctrico" },
  { value: "HIBRIDO",    label: "Híbrido" },
  { value: "GAS_LP",     label: "Gas LP" },
] as const;

export const MACHINERY_CATEGORIES = [
  { value: "TRACTORES",     label: "Tractores" },
  { value: "COSECHADORAS",  label: "Cosechadoras" },
  { value: "REMOLQUES",     label: "Remolques" },
  { value: "VEHICULOS",     label: "Vehículos" },
  { value: "IMPLEMENTOS",   label: "Implementos" },
  { value: "OTRO",          label: "Otro" },
] as const;

export const MAINTENANCE_TYPES = [
  { value: "PREVENTIVO",  label: "Preventivo",  color: "info" },
  { value: "CORRECTIVO",  label: "Correctivo",  color: "warning" },
  { value: "EMERGENCIA",  label: "Emergencia",  color: "error" },
  { value: "INSPECCION",  label: "Inspección",  color: "primary" },
  { value: "OVERHAUL",    label: "Overhaul",    color: "purple" },
] as const;

export const WORKSHOP_TYPES = [
  { value: "INTERNO", label: "Interno" },
  { value: "EXTERNO", label: "Externo" },
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]["value"];
export type WorkshopType = (typeof WORKSHOP_TYPES)[number]["value"];

export type MachineryStatus = (typeof MACHINERY_STATUS)[number]["value"];

export interface Machinery {
  id: string;
  internalCode?: string;
  name: string;
  category?: string;
  brand: string;
  model: string;
  year?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionCost?: string | number;
  odometer?: string | number;
  company?: { id: string; name: string };
  responsible?: { id: string; name: string; lastName: string };
  status: MachineryStatus;
  photo?: string | null;
  notes?: string;
  fuelType?: string;
  provider?: string;
  invoice?: string | null;
  transmission?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}
