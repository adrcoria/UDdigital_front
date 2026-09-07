export interface FilterDef {
  type:
    | "date-range"
    | "text"
    | "number"
    | "select"
    | "catalog"
    | "company"
    | "batch"
    | "machinery"
    | "position"
    | "product"
    // Contabilidad: se encadenan compañía → cuenta → categoría → concepto
    | "ledger-account"
    | "concept-category"
    | "concept";
  key?: string;
  label?: string;
  hint?: string;
  items?: { title: string; value: any }[];
  catalog?: string;
  batchTypeId?: string;
  keyFrom?: string;
  keyTo?: string;
  labelFrom?: string;
  labelTo?: string;
  /** Bloquea la generación del reporte hasta que el filtro tenga valor */
  required?: boolean;
  /** Precarga el rango de fechas con el día de hoy */
  defaultToday?: boolean;
}

export interface ColumnDef {
  key: string;
  title: string;
}

export interface ReportConfig {
  id: string;
  title: string;
  icon: string;
  description: string;
  fileName: string;
  filters: FilterDef[];
  columns: ColumnDef[];
  serviceFn: (params: Record<string, any>) => Promise<any>;
}
