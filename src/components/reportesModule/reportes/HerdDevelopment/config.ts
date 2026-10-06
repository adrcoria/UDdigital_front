/**
 * R-28 · Desarrollo del Hato Bovino Doble Proposito — proyeccion a 10 anios
 *
 * Traduccion del Excel "DESARROLLO DEL HATO BOVINO" (hoja DESARROLLO DEL HATO,
 * rangos B8:N50 y B52:L71). El front NO calcula: captura, llama al endpoint y
 * renderiza. Todas las formulas viven en el backend.
 */

export const PROJECTION_YEARS = 10;

/* ─────────────────────────────────────────────────────────────────────────────
 * CONTRATO DEL ENDPOINT
 *
 * GET /reports/herd-development recibe UNICAMENTE los parametros de abajo.
 * El estado inicial del hato (situacion actual) NO se captura: el backend lo
 * deriva del inventario de la empresa (idCompany). Si idCompany se omite, usa
 * la empresa del usuario autenticado.
 *
 * Los porcentajes viajan como ENTEROS (85 = 85%), no como fraccion.
 * ───────────────────────────────────────────────────────────────────────────── */

/** Supuestos tecnicos del modelo: son todos los parametros del endpoint */
export interface AssumptionDef {
  key: string;
  /** Nombre del query param en el endpoint */
  param: string;
  label: string;
  /** Solo afecta la presentacion (sufijo %) y el rango valido 0-100 */
  isPercentage: boolean;
  default: number | null;
  min?: number;
  max?: number;
  group: "reproduccion" | "mortalidad" | "leche" | "terreno";
  /** Nota al pie del campo */
  hint?: string;
}

export const ASSUMPTIONS: AssumptionDef[] = [
  { key: "paricion",            param: "paricionPorcentaje",             label: "Pariciones (%)",                 isPercentage: true,  default: 85,  group: "reproduccion" },
  { key: "paricionHembras",     param: "paricionHembrasPorcentaje",      label: "Pariciones hembras (%)",         isPercentage: true,  default: 50,  group: "reproduccion" },
  { key: "paricionMachos",      param: "paricionMachosPorcentaje",       label: "Pariciones machos (%)",          isPercentage: true,  default: 50,  group: "reproduccion" },
  { key: "criasDestetadas",     param: "criasDestetadasPorcentaje",      label: "Crias destetadas (%)",           isPercentage: true,  default: 90,  group: "reproduccion" },
  { key: "vacasDesecho",        param: "vacasDesechoPorcentaje",         label: "Vacas de desecho (%)",           isPercentage: true,  default: 15,  group: "mortalidad" },
  { key: "sementalesDesecho",   param: "sementalesDesechoPorcentaje",    label: "Sementales de desecho (%)",      isPercentage: true,  default: 25,  group: "mortalidad" },
  { key: "mortalidadAdultos",   param: "mortalidadAdultosPorcentaje",    label: "Mortalidad de adultos (%)",      isPercentage: true,  default: 2,   group: "mortalidad" },
  { key: "mortalidadCrias",     param: "mortalidadCriasPosdestePorcentaje", label: "Mortalidad crias posdestete (%)", isPercentage: true, default: 3, group: "mortalidad" },
  { key: "lactanciaDia",        param: "lactanciaDiaLitros",             label: "Lactancia/vaca/dia (lts)",       isPercentage: false, default: 13,  min: 0,  group: "leche" },
  { key: "diasLactancia",       param: "diasLactanciaAnio",              label: "Dias de lactancia/anio",          isPercentage: false, default: 210, min: 1, max: 365, group: "leche" },
  { key: "lecheParaCrias",      param: "lecheParaCriasPorcentaje",       label: "Leche para crias (%)",           isPercentage: true,  default: 20,  group: "leche" },
  { key: "lecheParaVenta",      param: "lecheParaVentaPorcentaje",       label: "Leche para venta (%)",           isPercentage: true,  default: 80,  group: "leche" },
  {
    key: "hectareasPorUA", param: "hectareasPorUA", label: "Hectareas por Unidad Animal",
    isPercentage: false, default: 0.76, min: 0, group: "terreno",
    hint: "Coeficiente de agostadero (ha por U.A.)",
  },
];

export const ASSUMPTION_GROUPS = [
  { value: "reproduccion", label: "Reproduccion", icon: "ph-heartbeat" },
  { value: "mortalidad",   label: "Mortalidad y desecho", icon: "ph-warning" },
  { value: "leche",        label: "Produccion de leche", icon: "ph-drop" },
  { value: "terreno",      label: "Terreno", icon: "ph-map-trifold" },
] as const;

/* ── Filas de la matriz de resultado ─────────────────────────────────────────
 * El response trae la situacion actual y las proyecciones por separado:
 *
 *   data.currentComposition        -> anio 0 (solo composicion)
 *   data.projections[]             -> anios 1..10, con subgrupos:
 *     { year, composition, purchases, mortality, sales, milkProduction }
 *
 * normalizeYears() uniforma el anio 0 como { year: 0, composition: {...} },
 * asi que `keys` usa rutas con punto sobre esa estructura.
 * ─────────────────────────────────────────────────────────────────────────── */
export type CellFormat = "heads" | "liters" | "hectares";

export interface RowDef {
  label: string;
  keys: string[];
  format: CellFormat;
  /** Fila de subtotal: se resalta */
  emphasis?: boolean;
}

export interface RowSection {
  title: string;
  rows: RowDef[];
}

export const ROW_SECTIONS: RowSection[] = [
  {
    title: "Composicion del hato",
    rows: [
      { label: "Vacas",                             keys: ["composition.vacas"], format: "heads" },
      { label: "Vaquillas (2-3 anios)",             keys: ["composition.vaquillas2_3"], format: "heads" },
      { label: "Vaquillas (1-2 anios)",             keys: ["composition.vaquillas1_2"], format: "heads" },
      { label: "Becerras",                          keys: ["composition.becerras"], format: "heads" },
      { label: "Becerros",                          keys: ["composition.becerros"], format: "heads" },
      { label: "Toretes (1-2 anios)",               keys: ["composition.toretes1_2"], format: "heads" },
      { label: "Novillos (2-3 anios)",              keys: ["composition.novillos2_3"], format: "heads" },
      { label: "Sementales",                        keys: ["composition.sementales"], format: "heads" },
      { label: "Total de cabezas",                  keys: ["composition.totalCabezas"], format: "heads", emphasis: true },
      { label: "Unidades animal por anio",          keys: ["composition.unidadesAnimalAnio"], format: "heads", emphasis: true },
      { label: "Superficie terreno requerida (ha)", keys: ["composition.superficieRequerida"], format: "hectares", emphasis: true },
    ],
  },
  {
    title: "Compra de ganado",
    rows: [
      { label: "Vaquillas al parto", keys: ["purchases.vaquillasAlParto"], format: "heads" },
      { label: "Sementales",         keys: ["purchases.sementales"], format: "heads" },
    ],
  },
  {
    title: "Mortalidad",
    rows: [
      { label: "Vacas",      keys: ["mortality.vacas"], format: "heads" },
      { label: "Becerras",   keys: ["mortality.becerras"], format: "heads" },
      { label: "Becerros",   keys: ["mortality.becerros"], format: "heads" },
      { label: "Sementales", keys: ["mortality.sementales"], format: "heads" },
    ],
  },
  {
    title: "Ventas",
    rows: [
      { label: "Vacas de desecho",          keys: ["sales.vacasDesecho"], format: "heads" },
      { label: "Vaquillas",                 keys: ["sales.vaquillas"], format: "heads" },
      { label: "Becerros engordados",       keys: ["sales.becerros"], format: "heads" },
      { label: "Sementales de desecho",     keys: ["sales.sementalesDesecho"], format: "heads" },
      { label: "Leche litros (para venta)", keys: ["milkProduction.lecheParaVenta"], format: "liters" },
    ],
  },
  {
    title: "Produccion de leche",
    rows: [
      { label: "Total leche anio (lts)", keys: ["milkProduction.totalLecheAnio"], format: "liters", emphasis: true },
      { label: "Leche para crias",       keys: ["milkProduction.lecheParaCrias"], format: "liters" },
      { label: "Leche para venta",       keys: ["milkProduction.lecheParaVenta"], format: "liters" },
    ],
  },
];

/* ── Formato de celdas ───────────────────────────────────────────────────────
 * Cabezas y litros se muestran con hasta 2 decimales sin ceros de relleno:
 * el modelo trabaja con animales fraccionarios a proposito (39.1625 cabezas,
 * 243,652.5 litros) y recortarlos a entero desalinea los totales.
 * ─────────────────────────────────────────────────────────────────────────── */
export const formatCell = (value: any, format: CellFormat): string => {
  if (value === null || value === undefined || value === "") return "---";

  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  if (format === "hectares") {
    return num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return num.toLocaleString("es-MX", { maximumFractionDigits: 2 });
};

/**
 * Primera llave presente en el registro; undefined si el response no la trae.
 * Acepta rutas con punto ("composition.vacas").
 */
export const pickValue = (row: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce<any>((acc, part) => (acc === null || acc === undefined ? undefined : acc[part]), row);

    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};
