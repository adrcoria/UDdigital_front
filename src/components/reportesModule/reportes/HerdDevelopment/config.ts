/**
 * R-28 · Desarrollo del Hato Bovino Doble Proposito — proyeccion a 10 anios
 *
 * Traduccion del Excel "DESARROLLO DEL HATO BOVINO" (hoja DESARROLLO DEL HATO,
 * rangos B8:N50 y B52:L71). El front NO calcula: captura, llama al endpoint y
 * renderiza. Todas las formulas viven en el backend.
 */

export const PROJECTION_YEARS = 10;

/* ─────────────────────────────────────────────────────────────────────────────
 * PENDIENTE DE CONTRATO CON BACKEND
 *
 * El endpoint documentado (GET /reports/herd-development) solo expone los
 * supuestos tecnicos como query params. Pero el modelo tambien parte del
 * estado inicial del hato (celdas amarillas D11:D18), de las compras/ventas
 * manuales por anio (filas 23 y 32) y de los coeficientes U.A. (C11:C18).
 *
 * Los nombres de abajo son TENTATIVOS: hay que confirmarlos con el backend.
 * Si el endpoint valida con whitelist (forbidNonWhitelisted), un param
 * desconocido responde 400 y el reporte no genera. En ese caso pon
 * SEND_PENDING_CONTRACT_PARAMS en false: el reporte correra solo con los
 * supuestos confirmados, usando el inventario que el backend derive de
 * idCompany, mientras se acuerdan los nombres definitivos.
 * ───────────────────────────────────────────────────────────────────────────── */
export const SEND_PENDING_CONTRACT_PARAMS = true;

/** Categorias del hato: estado inicial (col. D) + coeficiente U.A. (col. C) */
export interface HerdCategory {
  /** Llave del formulario y sufijo del query param del estado inicial */
  key: string;
  label: string;
  /** Coeficiente Unidad Animal fijo del modelo */
  uaDefault: number;
  /** Cabezas iniciales por defecto (situacion actual del Excel) */
  initialDefault: number;
}

export const HERD_CATEGORIES: HerdCategory[] = [
  { key: "vacas",       label: "Vacas",                uaDefault: 1.0,  initialDefault: 85 },
  { key: "vaquillas23", label: "Vaquillas (2-3 anios)", uaDefault: 0.9,  initialDefault: 0 },
  { key: "vaquillas12", label: "Vaquillas (1-2 anios)", uaDefault: 0.7,  initialDefault: 0 },
  { key: "becerras",    label: "Becerras",             uaDefault: 0.3,  initialDefault: 0 },
  { key: "becerros",    label: "Becerros",             uaDefault: 0.3,  initialDefault: 0 },
  { key: "toretes",     label: "Toretes (1-2 anios)",   uaDefault: 0.7,  initialDefault: 0 },
  { key: "novillos",    label: "Novillos (2-3 anios)",  uaDefault: 0.9,  initialDefault: 0 },
  { key: "sementales",  label: "Sementales",           uaDefault: 1.25, initialDefault: 0 },
];

/** Supuestos tecnicos: se capturan en porcentaje entero y se envian como fraccion */
export interface AssumptionDef {
  key: string;
  /** Nombre del query param en el endpoint */
  param: string;
  label: string;
  /** true = el usuario captura 85 y se envia 0.85 */
  isPercentage: boolean;
  default: number | null;
  min?: number;
  max?: number;
  group: "reproduccion" | "mortalidad" | "leche" | "terreno";
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
  { key: "hectareasPorUA",      param: "hectareasPorUA",                 label: "Hectareas por Unidad Animal",    isPercentage: false, default: null, min: 0, group: "terreno" },
];

export const ASSUMPTION_GROUPS = [
  { value: "reproduccion", label: "Reproduccion", icon: "ph-heartbeat" },
  { value: "mortalidad",   label: "Mortalidad y desecho", icon: "ph-warning" },
  { value: "leche",        label: "Produccion de leche", icon: "ph-drop" },
  { value: "terreno",      label: "Terreno", icon: "ph-map-trifold" },
] as const;

/* ── Filas de la matriz de resultado ─────────────────────────────────────────
 * `keys` lista las llaves candidatas del response, en orden de preferencia:
 * el contrato exacto esta por confirmarse, asi que se aceptan variantes.
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
      { label: "Vacas",                            keys: ["vacas"], format: "heads" },
      { label: "Vaquillas (2-3 anios)",             keys: ["vaquillas23", "vaquillas2a3", "vaquillas_2_3"], format: "heads" },
      { label: "Vaquillas (1-2 anios)",             keys: ["vaquillas12", "vaquillas1a2", "vaquillas_1_2"], format: "heads" },
      { label: "Becerras",                         keys: ["becerras"], format: "heads" },
      { label: "Becerros",                         keys: ["becerros"], format: "heads" },
      { label: "Toretes (1-2 anios)",               keys: ["toretes", "toretes12", "toretes1a2"], format: "heads" },
      { label: "Novillos (2-3 anios)",              keys: ["novillos", "novillos23", "novillos2a3"], format: "heads" },
      { label: "Sementales",                       keys: ["sementales"], format: "heads" },
      { label: "Total de cabezas",                 keys: ["totalCabezas", "totalHeads"], format: "heads", emphasis: true },
      { label: "Unidades animal por anio",          keys: ["unidadesAnimal", "animalUnits"], format: "heads", emphasis: true },
      { label: "Superficie terreno requerida (ha)", keys: ["superficieHa", "superficieHectareas"], format: "hectares", emphasis: true },
    ],
  },
  {
    title: "Compra de ganado",
    rows: [
      { label: "Vaquillas al parto", keys: ["compraVaquillasAlParto", "compraVaqParto", "compraVaquillasParto"], format: "heads" },
      { label: "Sementales",         keys: ["compraSementales"], format: "heads" },
    ],
  },
  {
    title: "Mortalidad",
    rows: [
      { label: "Vacas",      keys: ["mortalidadVacas", "mortVacas"], format: "heads" },
      { label: "Becerras",   keys: ["mortalidadBecerras", "mortBecerras"], format: "heads" },
      { label: "Becerros",   keys: ["mortalidadBecerros", "mortBecerros"], format: "heads" },
      { label: "Sementales", keys: ["mortalidadSementales", "mortSementales"], format: "heads" },
    ],
  },
  {
    title: "Ventas",
    rows: [
      { label: "Vacas de desecho",       keys: ["ventaVacasDesecho"], format: "heads" },
      { label: "Vaquillas",              keys: ["ventaVaquillas"], format: "heads" },
      { label: "Becerros engordados",    keys: ["becerrosEngordados", "ventaBecerrosEngordados"], format: "heads" },
      { label: "Sementales de desecho",  keys: ["ventaSementalesDesecho"], format: "heads" },
      { label: "Leche litros (para venta)", keys: ["lecheParaVenta", "ventaLecheLitros"], format: "liters" },
    ],
  },
  {
    title: "Produccion de leche",
    rows: [
      { label: "Total leche anio (lts)", keys: ["totalLecheAnio", "totalLecheAno", "totalMilkYear"], format: "liters", emphasis: true },
      { label: "Leche para crias",      keys: ["lecheParaCrias"], format: "liters" },
      { label: "Leche para venta",      keys: ["lecheParaVenta"], format: "liters" },
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

/** Primera llave presente en el registro; undefined si el response no la trae */
export const pickValue = (row: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return undefined;
};
