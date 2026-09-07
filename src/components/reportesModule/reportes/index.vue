<script lang="ts" setup>
import { ref } from "vue";
import { reportService } from "@/app/http/httpServiceProvider";
import { BATCH_TYPE_IDS } from "@/app/livestock.constants";
import ReportCard from "./ReportCard.vue";
import HerdDevelopmentCard from "./HerdDevelopment/HerdDevelopmentCard.vue";
import type { ReportConfig } from "./types";

const activeTab = ref("desarrollo-hato");

// Reporte seleccionado por tab (persiste al cambiar de tab y volver)
const selectedReports = ref<Record<string, ReportConfig | null>>({});

// ── Definicion de reportes por modulo ────────────────────────────────────────

const ganaderiaReports: ReportConfig[] = [
  {
    id: "R-01", title: "Inventario del hato", icon: "ph-paw-print", fileName: "INVENTARIO_HATO",
    description: "Lista completa de bovinos activos con arete, raza, sexo, peso y ubicacion",
    serviceFn: (p) => reportService.herdInventory(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "catalog", key: "idSex", label: "Sexo", catalog: "sex" },
      { type: "catalog", key: "idBreed", label: "Raza", catalog: "race" },
      { type: "batch", key: "idBatch" },
    ],
    columns: [
      { key: "earTag", title: "Arete Interno" },
      { key: "siniigaEarTag", title: "Arete SINIIGA" },
      { key: "name", title: "Nombre" },
      { key: "breed", title: "Raza" },
      { key: "sex", title: "Sexo" },
      { key: "type", title: "Tipo" },
      { key: "birthDate", title: "Fecha Nacimiento" },
      { key: "ageMonths", title: "Edad (meses)" },
      { key: "currentWeight", title: "Peso Actual (kg)" },
      { key: "ranch", title: "Rancho" },
      { key: "batch", title: "Lote" },
      { key: "status", title: "Estatus" },
    ],
  },
  {
    id: "R-02", title: "Historial de pesos", icon: "ph-scales", fileName: "HISTORIAL_PESOS",
    description: "Evolucion de peso de un bovino en un rango de fechas",
    serviceFn: (p) => reportService.weightHistory(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "text", key: "earTag", label: "Arete", hint: "Busqueda parcial" },
      { type: "date-range" },
    ],
    columns: [
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "ranch", title: "Rancho" },
      { key: "registerDate", title: "Fecha Registro" },
      { key: "weight", title: "Peso (kg)" },
      { key: "gain", title: "Ganancia (kg)" },
      { key: "gdp", title: "GDP (kg/dia)" },
      { key: "registeredBy", title: "Registrado por" },
    ],
  },
  {
    id: "R-03", title: "Registro de nacimientos", icon: "ph-baby", fileName: "NACIMIENTOS",
    description: "Nacimientos por periodo: madre, cria, fecha y peso al nacer",
    serviceFn: (p) => reportService.births(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "date-range" },
    ],
    columns: [
      { key: "birthDate", title: "Fecha Parto" },
      { key: "calfEarTag", title: "Arete Cria" },
      { key: "calfName", title: "Nombre Cria" },
      { key: "calfSex", title: "Sexo Cria" },
      { key: "breed", title: "Raza" },
      { key: "birthWeight", title: "Peso al Nacer (kg)" },
      { key: "motherEarTag", title: "Arete Madre" },
      { key: "motherName", title: "Nombre Madre" },
      { key: "fatherEarTag", title: "Arete Padre" },
      { key: "ranch", title: "Rancho" },
      { key: "comments", title: "Comentarios" },
    ],
  },
  {
    id: "R-04", title: "Registro de bajas", icon: "ph-skull", fileName: "BAJAS",
    description: "Animales dados de baja con causa y fecha",
    serviceFn: (p) => reportService.discharges(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "catalog", key: "idDeathCause", label: "Causa de baja", catalog: "death-cause" },
      { type: "date-range" },
    ],
    columns: [
      { key: "deathDate", title: "Fecha Baja" },
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "breed", title: "Raza" },
      { key: "sex", title: "Sexo" },
      { key: "type", title: "Tipo" },
      { key: "ageMonths", title: "Edad (meses)" },
      { key: "cause", title: "Causa" },
      { key: "subCause", title: "Subcausa" },
      { key: "ranch", title: "Rancho" },
      { key: "comments", title: "Comentarios" },
    ],
  },
  {
    id: "R-05", title: "Historial de traslados", icon: "ph-arrows-left-right", fileName: "TRASLADOS",
    description: "Movimientos de animales entre ranchos o lotes por periodo",
    serviceFn: (p) => reportService.transfers(p),
    filters: [
      { type: "company", key: "idCompanyOrigin", label: "Rancho Origen" },
      { type: "company", key: "idCompanyDestination", label: "Rancho Destino" },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "sex", title: "Sexo" },
      { key: "ranchOrigin", title: "Rancho Origen" },
      { key: "ranchDestination", title: "Rancho Destino" },
      { key: "comments", title: "Comentarios" },
    ],
  },
  {
    id: "R-06", title: "Registro de gestaciones", icon: "ph-heartbeat", fileName: "GESTACIONES",
    description: "Vacas prenadas con fecha probable de parto y estado",
    serviceFn: (p) => reportService.gestations(p),
    filters: [
      { type: "company", key: "idCompany" },
      {
        type: "select", key: "status", label: "Estado",
        items: [{ title: "Activa", value: "active" }, { title: "Finalizada", value: "finished" }],
      },
      {
        type: "date-range",
        keyFrom: "expectedBirthDateFrom", keyTo: "expectedBirthDateTo",
        labelFrom: "Parto esperado desde", labelTo: "Parto esperado hasta",
      },
    ],
    columns: [
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "ranch", title: "Rancho" },
      { key: "dateInit", title: "Fecha Inicio" },
      { key: "pregnancyType", title: "Tipo Gestacion" },
      { key: "maleBovine", title: "Arete Semental" },
      { key: "expectedBirthDate", title: "F. Probable Parto" },
      { key: "gestationDays", title: "Dias Gestacion" },
      { key: "origin", title: "Origen" },
      { key: "status", title: "Estatus" },
      { key: "comments", title: "Comentarios" },
    ],
  },
  {
    id: "R-07", title: "Registro de calores / celo", icon: "ph-fire", fileName: "CALORES",
    description: "Eventos de celo registrados con fecha y resultado",
    serviceFn: (p) => reportService.heats(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "date-range" },
    ],
    columns: [
      { key: "dateInit", title: "Fecha Inicio" },
      { key: "dateEnd", title: "Fecha Fin" },
      { key: "durationDays", title: "Duracion (dias)" },
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "ranch", title: "Rancho" },
      { key: "status", title: "Estatus" },
      { key: "registeredBy", title: "Registrado por" },
      { key: "comments", title: "Comentarios" },
    ],
  },
  {
    id: "R-08", title: "Historial de cambios de arete", icon: "ph-tag", fileName: "CAMBIOS_ARETE",
    description: "Trazabilidad de reemplazos de identificadores por animal",
    serviceFn: (p) => reportService.tagChanges(p),
    filters: [
      { type: "text", key: "earTag", label: "Arete" },
      {
        type: "select", key: "tagType", label: "Tipo de arete",
        items: [{ title: "Interno", value: "internal" }, { title: "SINIIGA", value: "siniiga" }],
      },
      { type: "date-range" },
    ],
    columns: [
      { key: "changeDate", title: "Fecha Cambio" },
      { key: "deprecatedEarTag", title: "Arete Anterior" },
      { key: "tagType", title: "Tipo Arete" },
    ],
  },
];

const engordaReports: ReportConfig[] = [
  {
    id: "R-09", title: "Lotes de engorda activos", icon: "ph-stack", fileName: "LOTES_ENGORDA_ACTIVOS",
    description: "Estado actual de cada lote: bovinos, peso promedio y dias en lote",
    serviceFn: (p) => reportService.activeFeedlotBatches(p),
    filters: [
      { type: "company", key: "idCompany" },
      {
        type: "select", key: "idBatchType", label: "Tipo de lote",
        items: [
          { title: "Engorda", value: BATCH_TYPE_IDS.ENGORDA },
          { title: "Produccion de Leche", value: BATCH_TYPE_IDS.PRODUCCION_LECHE },
          { title: "Vacunacion", value: BATCH_TYPE_IDS.VACUNACION },
        ],
      },
    ],
    columns: [
      { key: "batchName", title: "Nombre Lote" },
      { key: "batchType", title: "Tipo Lote" },
      { key: "ranch", title: "Rancho" },
      { key: "startDate", title: "Fecha Inicio" },
      { key: "daysInBatch", title: "Dias en Lote" },
      { key: "numBovines", title: "No. Bovinos" },
      { key: "avgCurrentWeight", title: "Peso Prom. Actual (kg)" },
    ],
  },
  {
    id: "R-10", title: "Ganancia de peso por lote", icon: "ph-trend-up", fileName: "GANANCIA_PESO",
    description: "Comparativo peso inicial vs peso actual por lote y por animal",
    serviceFn: (p) => reportService.feedlotWeightGain(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "batch", key: "idBatch", batchTypeId: BATCH_TYPE_IDS.ENGORDA },
      { type: "date-range" },
    ],
    columns: [
      { key: "batchName", title: "Lote" },
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "sex", title: "Sexo" },
      { key: "entryWeight", title: "Peso Entrada (kg)" },
      { key: "currentWeight", title: "Peso Actual (kg)" },
      { key: "gain", title: "Ganancia (kg)" },
      { key: "days", title: "Dias" },
      { key: "gdp", title: "GDP (kg/dia)" },
    ],
  },
  {
    id: "R-11", title: "Historial de lotes cerrados", icon: "ph-archive", fileName: "LOTES_CERRADOS",
    description: "Lotes de engorda finalizados con resumen de rendimiento",
    serviceFn: (p) => reportService.closedFeedlotBatches(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "date-range", labelFrom: "Fecha cierre desde", labelTo: "Fecha cierre hasta" },
    ],
    columns: [
      { key: "batchName", title: "Nombre Lote" },
      { key: "batchType", title: "Tipo Lote" },
      { key: "ranch", title: "Rancho" },
      { key: "startDate", title: "Fecha Inicio" },
      { key: "closeDate", title: "Fecha Cierre" },
      { key: "totalDays", title: "Total Dias" },
      { key: "numBovines", title: "No. Bovinos" },
      { key: "avgEntryWeight", title: "Peso Prom. Entrada (kg)" },
      { key: "avgExitWeight", title: "Peso Prom. Salida (kg)" },
      { key: "avgGdp", title: "GDP Prom. (kg/dia)" },
    ],
  },
];

const lecheReports: ReportConfig[] = [
  {
    id: "R-12", title: "Produccion diaria de leche", icon: "ph-drop", fileName: "PRODUCCION_DIARIA",
    description: "Litros producidos por dia, por lote y por periodo",
    serviceFn: (p) => reportService.dailyMilkProduction(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "batch", key: "idBatch", label: "Lote lechero", batchTypeId: BATCH_TYPE_IDS.PRODUCCION_LECHE },
      { type: "date-range" },
    ],
    columns: [
      { key: "registerDate", title: "Fecha Registro" },
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "ranch", title: "Rancho" },
      { key: "batch", title: "Lote" },
      { key: "liters", title: "Litros" },
      { key: "registeredBy", title: "Registrado por" },
    ],
  },
  {
    id: "R-13", title: "Produccion acumulada por lote", icon: "ph-chart-bar", fileName: "PRODUCCION_ACUMULADA",
    description: "Total producido en la vida del lote lechero",
    serviceFn: (p) => reportService.accumulatedMilkProduction(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "batch", key: "idBatch", label: "Lote lechero", batchTypeId: BATCH_TYPE_IDS.PRODUCCION_LECHE },
    ],
    columns: [
      { key: "batchName", title: "Nombre Lote" },
      { key: "batchType", title: "Tipo Lote" },
      { key: "ranch", title: "Rancho" },
      { key: "startDate", title: "Fecha Inicio" },
      { key: "daysActive", title: "Dias Activos" },
      { key: "numCows", title: "No. Vacas" },
      { key: "totalLiters", title: "Total Litros" },
      { key: "dailyAvg", title: "Prom. Diario (L)" },
      { key: "perCowDailyAvg", title: "Prom. Vaca/Dia (L)" },
    ],
  },
  {
    id: "R-14", title: "Produccion por vaca", icon: "ph-paw-print", fileName: "PRODUCCION_POR_VACA",
    description: "Rendimiento individual de cada vaca dentro del lote",
    serviceFn: (p) => reportService.perCowProduction(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "batch", key: "idBatch", label: "Lote lechero", batchTypeId: BATCH_TYPE_IDS.PRODUCCION_LECHE },
      { type: "text", key: "earTag", label: "Arete (opcional)" },
    ],
    columns: [
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "ranch", title: "Rancho" },
      { key: "batch", title: "Lote" },
      { key: "totalLiters", title: "Total Litros" },
      { key: "logCount", title: "No. Registros" },
      { key: "dailyAvg", title: "Prom. Diario (L)" },
    ],
  },
];

const vacunacionReports: ReportConfig[] = [
  {
    id: "R-15", title: "Vacunaciones aplicadas", icon: "ph-syringe", fileName: "VACUNACIONES_APLICADAS",
    description: "Campanas realizadas: vacuna, fecha y bovinos incluidos",
    serviceFn: (p) => reportService.appliedVaccinations(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "product", key: "idProduct", label: "Vacuna / Producto" },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "product", title: "Producto / Vacuna" },
      { key: "earTag", title: "Arete" },
      { key: "bovineName", title: "Nombre Bovino" },
      { key: "ranch", title: "Rancho" },
      { key: "batch", title: "Lote" },
      { key: "rancher", title: "Ganadero" },
    ],
  },
  {
    id: "R-16", title: "Historial sanitario por bovino", icon: "ph-first-aid-kit", fileName: "HISTORIAL_SANITARIO",
    description: "Todas las vacunas aplicadas a un animal especifico",
    serviceFn: (p) => reportService.healthHistory(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "text", key: "earTag", label: "Arete del bovino" },
    ],
    columns: [
      { key: "earTag", title: "Arete" },
      { key: "bovineName", title: "Nombre Bovino" },
      { key: "ranch", title: "Rancho" },
      { key: "date", title: "Fecha" },
      { key: "product", title: "Producto / Vacuna" },
      { key: "batch", title: "Lote" },
      { key: "rancher", title: "Ganadero" },
    ],
  },
  {
    id: "R-17", title: "Bovinos sin vacunar", icon: "ph-warning", fileName: "SIN_VACUNAR",
    description: "Animales que no han recibido una vacuna especifica en X dias",
    serviceFn: (p) => reportService.unvaccinatedBovines(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "product", key: "idProduct", label: "Vacuna / Producto" },
      { type: "number", key: "period", label: "Periodo (dias)", hint: "Ej: 90" },
    ],
    columns: [
      { key: "earTag", title: "Arete" },
      { key: "name", title: "Nombre" },
      { key: "sex", title: "Sexo" },
      { key: "ranch", title: "Rancho" },
      { key: "batch", title: "Lote" },
    ],
  },
];

const ventasReports: ReportConfig[] = [
  {
    id: "R-18", title: "Ordenes de venta", icon: "ph-receipt", fileName: "ORDENES_VENTA",
    description: "Ventas realizadas: comprador, animales, precio y total",
    serviceFn: (p) => reportService.cattleSaleOrders(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "earTag", title: "Arete" },
      { key: "bovineName", title: "Nombre Bovino" },
      { key: "sex", title: "Sexo" },
      { key: "ranch", title: "Rancho" },
      { key: "saleType", title: "Tipo Venta" },
      { key: "weight", title: "Peso (kg)" },
      { key: "price", title: "Precio" },
      { key: "saleValue", title: "Valor Venta" },
      { key: "total", title: "Total" },
    ],
  },
  {
    id: "R-19", title: "Bovinos vendidos", icon: "ph-currency-dollar", fileName: "BOVINOS_VENDIDOS",
    description: "Detalle de animales vendidos con caracteristicas al momento de venta",
    serviceFn: (p) => reportService.soldBovines(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "earTag", title: "Arete" },
      { key: "bovineName", title: "Nombre Bovino" },
      { key: "sex", title: "Sexo" },
      { key: "ranch", title: "Rancho" },
      { key: "saleType", title: "Tipo Venta" },
      { key: "weight", title: "Peso (kg)" },
      { key: "price", title: "Precio" },
      { key: "total", title: "Total" },
    ],
  },
];

const personalReports: ReportConfig[] = [
  {
    id: "R-20", title: "Plantilla de personal activo", icon: "ph-users", fileName: "PLANTILLA_ACTIVA",
    description: "Lista del personal con puesto, fecha de ingreso y datos de contacto",
    serviceFn: (p) => reportService.activeStaff(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "position", key: "idPosition" },
    ],
    columns: [
      { key: "name", title: "Nombre" },
      { key: "lastName", title: "Apellidos" },
      { key: "position", title: "Puesto" },
      { key: "entryDate", title: "Fecha Ingreso" },
      { key: "phone", title: "Telefono" },
      { key: "ranch", title: "Rancho" },
      { key: "sex", title: "Sexo" },
    ],
  },
  {
    id: "R-21", title: "Altas y bajas de personal", icon: "ph-users-three", fileName: "MOVIMIENTOS_PERSONAL",
    description: "Movimientos de personal por periodo",
    serviceFn: (p) => reportService.staffMovements(p),
    filters: [
      { type: "company", key: "idCompany" },
      {
        type: "select", key: "movementType", label: "Tipo de movimiento",
        items: [{ title: "Alta", value: "hire" }, { title: "Baja", value: "termination" }],
      },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "type", title: "Tipo Movimiento" },
      { key: "name", title: "Nombre" },
      { key: "lastName", title: "Apellidos" },
      { key: "position", title: "Puesto" },
      { key: "ranch", title: "Rancho" },
    ],
  },
];

const maquinariaReports: ReportConfig[] = [
  {
    id: "R-22", title: "Historial de mantenimientos", icon: "ph-wrench", fileName: "HISTORIAL_MANTENIMIENTO",
    description: "Todos los mantenimientos realizados por maquina y periodo",
    serviceFn: (p) => reportService.maintenanceHistory(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "machinery", key: "idMachinery" },
      {
        type: "select", key: "type", label: "Tipo de mantenimiento",
        items: [{ title: "Preventivo", value: "preventivo" }, { title: "Correctivo", value: "correctivo" }],
      },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "machinery", title: "Maquinaria" },
      { key: "type", title: "Tipo" },
      { key: "description", title: "Descripcion" },
      { key: "totalCost", title: "Costo Total" },
      { key: "nextMaintenance", title: "Prox. Mantenimiento" },
      { key: "ranch", title: "Rancho" },
    ],
  },
  {
    id: "R-23", title: "Mantenimientos pendientes", icon: "ph-timer", fileName: "MANTENIMIENTOS_PENDIENTES",
    description: "Equipos proximos a mantenimiento o con mantenimiento vencido",
    serviceFn: (p) => reportService.pendingMaintenance(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "machinery", key: "idMachinery" },
    ],
    columns: [
      { key: "machinery", title: "Maquinaria" },
      { key: "type", title: "Tipo" },
      { key: "programedDate", title: "Fecha Programada" },
      { key: "daysOverdue", title: "Dias Vencido" },
      { key: "ranch", title: "Rancho" },
    ],
  },
  {
    id: "R-24", title: "Costo de mantenimientos", icon: "ph-money", fileName: "COSTOS_MANTENIMIENTO",
    description: "Gasto acumulado por equipo o por periodo",
    serviceFn: (p) => reportService.maintenanceCosts(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "machinery", key: "idMachinery" },
      { type: "date-range" },
    ],
    columns: [
      { key: "doneDate", title: "Fecha" },
      { key: "machinery", title: "Maquinaria" },
      { key: "type", title: "Tipo" },
      { key: "description", title: "Descripcion" },
      { key: "totalCost", title: "Costo Total" },
      { key: "ranch", title: "Rancho" },
    ],
  },
];

const inventariosReports: ReportConfig[] = [
  {
    id: "R-25", title: "Movimientos de inventario", icon: "ph-arrows-down-up", fileName: "MOVIMIENTOS_INVENTARIO",
    description: "Entradas y salidas por producto, fecha y motivo",
    serviceFn: (p) => reportService.inventoryMovements(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "product", key: "idProduct" },
      {
        type: "select", key: "type", label: "Tipo",
        items: [{ title: "Entrada", value: "1" }, { title: "Salida", value: "2" }],
      },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "product", title: "Producto" },
      { key: "type", title: "Tipo" },
      { key: "units", title: "Unidades" },
      { key: "purpose", title: "Motivo" },
      { key: "ranch", title: "Rancho" },
    ],
  },
  {
    id: "R-26", title: "Stock actual", icon: "ph-package", fileName: "STOCK_ACTUAL",
    description: "Existencias por producto con alertas de minimos",
    serviceFn: (p) => reportService.inventoryStock(p),
    filters: [
      { type: "company", key: "idCompany" },
    ],
    columns: [
      { key: "product", title: "Producto" },
      { key: "units", title: "Unidades" },
      { key: "ranch", title: "Rancho" },
    ],
  },
  {
    id: "R-27", title: "Consumo por periodo", icon: "ph-chart-line", fileName: "CONSUMO_PERIODO",
    description: "Productos mas consumidos en un rango de fechas",
    serviceFn: (p) => reportService.inventoryConsumption(p),
    filters: [
      { type: "company", key: "idCompany" },
      { type: "date-range" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "product", title: "Producto" },
      { key: "units", title: "Unidades" },
      { key: "purpose", title: "Motivo" },
      { key: "ranch", title: "Rancho" },
    ],
  },
];

const contabilidadReports: ReportConfig[] = [
  {
    id: "R-29", title: "Detalle de operaciones", icon: "ph-list-checks", fileName: "DETALLE_OPERACIONES",
    description: "Operaciones de ingresos y egresos con cuenta, categoria, concepto y montos",
    serviceFn: (p) => reportService.exportOperationsExcel(p),
    filters: [
      { type: "date-range", required: true, defaultToday: true },
      { type: "company", key: "idCompany" },
      { type: "ledger-account", key: "idAccount" },
      { type: "concept-category", key: "idConceptCategory" },
      { type: "concept", key: "idConcept" },
    ],
    columns: [
      { key: "date", title: "Fecha" },
      { key: "company", title: "Empresa" },
      { key: "account", title: "Cuenta" },
      { key: "category", title: "Categoria" },
      { key: "concept", title: "Concepto" },
      { key: "description", title: "Comentarios" },
      { key: "quantity", title: "Cantidad" },
      { key: "measurement", title: "Unidad" },
      { key: "amount", title: "Monto" },
      { key: "total", title: "Total Operacion" },
      { key: "balanceAfter", title: "Total Posterior" },
      { key: "responsible", title: "Responsable" },
    ],
  },
  {
    id: "R-30", title: "Consolidado por empresa", icon: "ph-buildings", fileName: "CONSOLIDADO_EMPRESA",
    description: "Resumen de ingresos y egresos de una empresa en el periodo",
    serviceFn: (p) => reportService.exportOperationsExcelSummary(p),
    filters: [
      { type: "date-range", required: true, defaultToday: true },
      { type: "company", key: "idCompany", required: true },
    ],
    columns: [
      { key: "company", title: "Empresa" },
      { key: "account", title: "Cuenta" },
      { key: "category", title: "Categoria" },
      { key: "concept", title: "Concepto" },
      { key: "income", title: "Ingresos" },
      { key: "expense", title: "Egresos" },
      { key: "balance", title: "Saldo" },
    ],
  },
  {
    id: "R-31", title: "Consolidado agroindustrias", icon: "ph-globe", fileName: "CONSOLIDADO_GLOBAL",
    description: "Resumen global de todas las empresas en el periodo",
    serviceFn: (p) => reportService.exportOperationsAllExcelSummary(p),
    filters: [
      { type: "date-range", required: true, defaultToday: true },
    ],
    columns: [
      { key: "company", title: "Empresa" },
      { key: "income", title: "Ingresos" },
      { key: "expense", title: "Egresos" },
      { key: "balance", title: "Saldo" },
    ],
  },
];

/**
 * Reporte especial: captura extensa y matriz concepto x anios.
 * Vive en su propio tab y se renderiza con HerdDevelopmentCard, no con ReportCard.
 */
const herdDevelopmentReport: ReportConfig = {
  id: "R-28", title: "Desarrollo del Hato Bovino Doble Proposito", icon: "ph-chart-line-up",
  fileName: "DESARROLLO_HATO",
  description: "Proyeccion a 10 anios de composicion del hato, mortalidad, ventas y produccion de leche",
  serviceFn: (p) => reportService.herdDevelopment(p),
  filters: [],
  columns: [],
};

interface ReportTab {
  value: string;
  label: string;
  icon: string;
  reports: ReportConfig[];
  color: string;
  /** Tab de un solo reporte con componente propio: no muestra selector */
  custom?: "herd-development";
}

const tabs: ReportTab[] = [
  {
    value: "desarrollo-hato", label: "Desarrollo del hato", icon: "ph-chart-line-up",
    reports: [herdDevelopmentReport], color: "green-darken-3", custom: "herd-development",
  },
  { value: "ganaderia",    label: "Ganaderia",    icon: "ph-paw-print",           reports: ganaderiaReports,   color: "green-darken-2" },
  { value: "engorda",      label: "Engorda",       icon: "ph-trend-up",      reports: engordaReports,     color: "orange-darken-2" },
  { value: "leche",        label: "Leche",         icon: "ph-drop",          reports: lecheReports,       color: "blue-lighten-1" },
  { value: "vacunacion",   label: "Vacunacion",    icon: "ph-syringe",       reports: vacunacionReports,  color: "teal-darken-1" },
  { value: "ventas",       label: "Ventas",        icon: "ph-currency-dollar", reports: ventasReports,    color: "deep-purple-darken-1" },
  { value: "personal",     label: "Personal",      icon: "ph-users",         reports: personalReports,    color: "indigo-darken-1" },
  { value: "maquinaria",   label: "Maquinaria",    icon: "ph-truck",       reports: maquinariaReports,  color: "brown-darken-1" },
  { value: "inventarios",  label: "Inventarios",   icon: "ph-package",     reports: inventariosReports, color: "blue-grey-darken-1" },
  { value: "contabilidad", label: "Contabilidad",  icon: "ph-calculator",    reports: contabilidadReports, color: "red-darken-2" },
];
</script>

<template>
  <div class="pa-4">
    <!-- Header -->
    <div class="d-flex align-center mb-5">
      <v-icon size="32" color="primary" class="mr-3">ph-file-xls</v-icon>
      <div>
        <div class="text-h5 font-weight-black text-uppercase">Reportes Operativos</div>
        <div class="text-caption text-grey-darken-1">Cada reporte se puede consultar en tabla, descargar en Excel o previsualizar en PDF</div>
      </div>
    </div>

    <!-- Tabs de modulos -->
    <v-tabs
      v-model="activeTab"
      bg-color="white"
      color="primary"
      show-arrows
      class="border rounded-t-lg"
    >
      <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
        <v-icon start size="18">{{ tab.icon }}</v-icon>
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab" class="border border-t-0 rounded-b-lg bg-grey-lighten-5 pa-4">
      <!-- Todos los modulos usan el mismo flujo: Excel / PDF / Tabla -->
      <v-tabs-window-item
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
      >
        <!-- Tab de un solo reporte especial: va directo, sin selector -->
        <HerdDevelopmentCard
          v-if="tab.custom === 'herd-development'"
          :config="herdDevelopmentReport"
        />

        <template v-else>
        <!-- Selector de reporte -->
        <v-autocomplete
          v-model="selectedReports[tab.value]"
          :items="tab.reports"
          :item-title="(r: ReportConfig) => `${r.id} · ${r.title}`"
          return-object
          label="Selecciona el reporte a generar"
          placeholder="Escribe para filtrar..."
          variant="outlined"
          density="comfortable"
          clearable
          prepend-inner-icon="ph-magnifying-glass"
          class="mb-4"
          hide-details
          bg-color="white"
        >
          <template #item="{ props: p, item }">
            <v-list-item v-bind="p">
              <template #subtitle>{{ (item.raw as ReportConfig).description }}</template>
            </v-list-item>
          </template>
        </v-autocomplete>

        <!-- Formulario del reporte seleccionado -->
        <ReportCard
          v-if="selectedReports[tab.value]"
          :config="selectedReports[tab.value]!"
          :key="(selectedReports[tab.value] as ReportConfig).id"
        />

        <!-- Estado vacio -->
        <div v-else class="d-flex flex-column align-center justify-center py-14 text-grey-lighten-1">
          <v-icon size="64" class="mb-3">ph-file-search</v-icon>
          <div class="text-subtitle-1 text-grey-darken-1">Selecciona un reporte para continuar</div>
          <div class="text-caption text-grey">{{ tab.reports.length }} reportes disponibles en este modulo</div>
        </div>
        </template>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>
