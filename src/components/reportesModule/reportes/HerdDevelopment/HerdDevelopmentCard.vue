<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { companyService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { buildReportFileName, downloadBlob, triggerDownload } from "../exportUtils";
import type { ReportConfig } from "../types";
import {
  PROJECTION_YEARS,
  SEND_PENDING_CONTRACT_PARAMS,
  HERD_CATEGORIES,
  ASSUMPTIONS,
  ASSUMPTION_GROUPS,
  ROW_SECTIONS,
  formatCell,
  pickValue,
} from "./config";

const props = defineProps<{ config: ReportConfig }>();

/* ── Estado ──────────────────────────────────────────────────────────────── */
const loading = ref(false);
const format = ref<"json" | "excel" | "pdf">("json");
const showAdvanced = ref(false);
const companies = ref<any[]>([]);
const idCompany = ref<string | null>(null);

const years = ref<Record<string, any>[]>([]);
const generated = ref(false);

// Previsualizacion de PDF (mismo comportamiento que el resto de reportes)
const pdfDialog = ref(false);
const pdfUrl = ref("");
const pdfFileName = ref("");

/* ── Formulario ──────────────────────────────────────────────────────────── */
const initialHerd = ref<Record<string, number>>(
  Object.fromEntries(HERD_CATEGORIES.map((c) => [c.key, c.initialDefault]))
);

const uaCoefficients = ref<Record<string, number>>(
  Object.fromEntries(HERD_CATEGORIES.map((c) => [c.key, c.uaDefault]))
);

const assumptions = ref<Record<string, number | null>>(
  Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a.default]))
);

// Compra de vaquillas al parto: anio 0 a 10 (anio 0 = 20 por defecto)
const heiferPurchases = ref<number[]>(
  Array.from({ length: PROJECTION_YEARS + 1 }, (_, i) => (i === 0 ? 20 : 0))
);

// Venta de vaquillas: anio 1 a 10
const heiferSales = ref<number[]>(Array.from({ length: PROJECTION_YEARS }, () => 0));

const resetForm = () => {
  initialHerd.value = Object.fromEntries(HERD_CATEGORIES.map((c) => [c.key, c.initialDefault]));
  uaCoefficients.value = Object.fromEntries(HERD_CATEGORIES.map((c) => [c.key, c.uaDefault]));
  assumptions.value = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a.default]));
  heiferPurchases.value = Array.from({ length: PROJECTION_YEARS + 1 }, (_, i) => (i === 0 ? 20 : 0));
  heiferSales.value = Array.from({ length: PROJECTION_YEARS }, () => 0);
};

const assumptionsByGroup = (group: string) => ASSUMPTIONS.filter((a) => a.group === group);

/* ── Validaciones ────────────────────────────────────────────────────────── */
const errors = computed(() => {
  const list: string[] = [];
  const a = assumptions.value;

  if (!idCompany.value) list.push("Selecciona la empresa / unidad de produccion.");

  for (const def of ASSUMPTIONS) {
    const v = a[def.key];

    if (v === null || v === undefined || v === ("" as any) || Number.isNaN(Number(v))) {
      list.push(`${def.label}: captura un valor.`);
      continue;
    }

    const num = Number(v);
    if (def.isPercentage && (num < 0 || num > 100)) {
      list.push(`${def.label}: debe estar entre 0 y 100.`);
    }
    if (def.min !== undefined && num < def.min) {
      list.push(`${def.label}: no puede ser menor a ${def.min}.`);
    }
    if (def.max !== undefined && num > def.max) {
      list.push(`${def.label}: no puede ser mayor a ${def.max}.`);
    }
  }

  const birthSum = Number(a.paricionHembras ?? 0) + Number(a.paricionMachos ?? 0);
  if (Math.round(birthSum) !== 100) {
    list.push(`Pariciones hembras + machos deben sumar 100% (suman ${birthSum}%).`);
  }

  const milkSum = Number(a.lecheParaCrias ?? 0) + Number(a.lecheParaVenta ?? 0);
  if (Math.round(milkSum) !== 100) {
    list.push(`Leche para crias + para venta deben sumar 100% (suman ${milkSum}%).`);
  }

  for (const c of HERD_CATEGORIES) {
    const v = Number(initialHerd.value[c.key]);
    if (!Number.isInteger(v) || v < 0) {
      list.push(`${c.label}: debe ser un entero mayor o igual a 0.`);
    }
  }

  const badPurchase = heiferPurchases.value.some((v) => !Number.isInteger(Number(v)) || Number(v) < 0);
  if (badPurchase) list.push("Compra de vaquillas al parto: enteros mayores o iguales a 0.");

  const badSale = heiferSales.value.some((v) => !Number.isInteger(Number(v)) || Number(v) < 0);
  if (badSale) list.push("Venta de vaquillas: enteros mayores o iguales a 0.");

  return list;
});

const isValid = computed(() => errors.value.length === 0);

// Error por campo, para marcar el input en rojo
const fieldError = (label: string) =>
  errors.value.filter((e) => e.startsWith(`${label}:`)).map((e) => e.replace(`${label}: `, ""));

/* ── Mapeo de params (porcentaje → fraccion) ─────────────────────────────── */
const buildParams = () => {
  const params: Record<string, any> = { idCompany: idCompany.value };

  for (const def of ASSUMPTIONS) {
    const raw = Number(assumptions.value[def.key]);
    params[def.param] = def.isPercentage ? raw / 100 : raw;
  }

  /**
   * PENDIENTE DE CONTRATO: estado inicial, compras/ventas manuales y
   * coeficientes U.A. Los nombres son tentativos — confirmar con backend.
   * Ver la nota completa en ./config.ts (SEND_PENDING_CONTRACT_PARAMS).
   */
  if (SEND_PENDING_CONTRACT_PARAMS) {
    for (const c of HERD_CATEGORIES) {
      params[`inicial${c.key.charAt(0).toUpperCase()}${c.key.slice(1)}`] =
        Number(initialHerd.value[c.key]);
      params[`coefUA${c.key.charAt(0).toUpperCase()}${c.key.slice(1)}`] =
        Number(uaCoefficients.value[c.key]);
    }
    // Series por anio: anio 0..10 y anio 1..10, separadas por coma
    params.compraVaquillasAlParto = heiferPurchases.value.map(Number).join(",");
    params.ventaVaquillas = heiferSales.value.map(Number).join(",");
  }

  return params;
};

/* ── Respuesta ───────────────────────────────────────────────────────────── */
const normalizeYears = (res: any): Record<string, any>[] => {
  const payload = res?.data?.data ?? res?.data;
  const list =
    payload?.years ??
    payload?.data?.years ??
    (Array.isArray(payload) ? payload : []);

  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => Number(a?.year ?? 0) - Number(b?.year ?? 0));
};

const yearLabel = (year: any) => (Number(year) === 0 ? "Sit. Actual" : `Anio ${year}`);

const cellValue = (row: Record<string, any>, keys: string[]) => pickValue(row, keys);

const isNegative = (value: any) => Number(value) < 0;

// Filas que el response no trajo: sirven para cuadrar el contrato con backend
const unmatchedRows = computed(() => {
  const first = years.value[0];
  if (!first) return [];
  return ROW_SECTIONS.flatMap((s) => s.rows)
    .filter((r) => pickValue(first, r.keys) === undefined)
    .map((r) => r.label);
});

const receivedKeys = computed(() => Object.keys(years.value[0] ?? {}));

/* ── Acciones ────────────────────────────────────────────────────────────── */
const closePdfDialog = () => {
  pdfDialog.value = false;
  if (pdfUrl.value) window.URL.revokeObjectURL(pdfUrl.value);
  pdfUrl.value = "";
};

const downloadPdf = () => triggerDownload(pdfUrl.value, pdfFileName.value);

const generate = async () => {
  if (!isValid.value) return showErrorAlert("Revisa los campos marcados antes de generar");

  try {
    loading.value = true;
    const res = await props.config.serviceFn({ ...buildParams(), format: format.value });

    if (format.value === "excel") {
      downloadBlob(res.data, buildReportFileName(props.config.id, props.config.fileName, "xlsx"));
      showSuccessAlert("Reporte generado correctamente");
      return;
    }

    if (format.value === "pdf") {
      if (pdfUrl.value) window.URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      pdfFileName.value = buildReportFileName(props.config.id, props.config.fileName, "pdf");
      pdfDialog.value = true;
      return;
    }

    years.value = normalizeYears(res);
    generated.value = true;

    if (!years.value.length) showErrorAlert("El reporte no devolvio proyeccion");
  } catch {
    showErrorAlert("Error al generar el reporte");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    const res = await companyService.getCompanies();
    companies.value = res.data?.data ?? res.data ?? [];
  } catch {
    showErrorAlert("No se pudieron cargar las empresas");
  }
});
</script>

<template>
  <v-card border elevation="0" rounded="lg">
    <!-- Header -->
    <div class="d-flex align-center pa-4 border-b bg-grey-lighten-5">
      <v-avatar color="primary" size="42" class="mr-3" rounded="lg">
        <v-icon color="white" size="22">{{ config.icon }}</v-icon>
      </v-avatar>
      <div class="flex-grow-1 min-w-0">
        <div class="text-subtitle-2 font-weight-black text-uppercase">
          {{ config.id }} · {{ config.title }}
        </div>
        <div class="text-caption text-grey-darken-1">{{ config.description }}</div>
      </div>

      <v-btn-toggle
        v-model="format"
        mandatory
        density="compact"
        variant="outlined"
        color="primary"
        class="ml-3 flex-shrink-0"
      >
        <v-btn value="json" size="small">
          <v-icon size="16" class="mr-1">ph-table</v-icon>Tabla
        </v-btn>
        <v-btn value="excel" size="small">
          <v-icon size="16" class="mr-1">ph-file-xls</v-icon>Excel
        </v-btn>
        <v-btn value="pdf" size="small">
          <v-icon size="16" class="mr-1">ph-file-pdf</v-icon>PDF
        </v-btn>
      </v-btn-toggle>
    </div>

    <div class="pa-4">
      <!-- Empresa -->
      <v-autocomplete
        v-model="idCompany"
        :items="companies"
        item-title="name"
        item-value="id"
        label="Empresa / Unidad de produccion *"
        variant="outlined"
        density="compact"
        prepend-inner-icon="ph-buildings"
        no-data-text="Sin datos"
        hide-details
        class="mb-5"
      />

      <!-- A · Estado inicial -->
      <div class="text-caption font-weight-black text-uppercase text-grey-darken-2 mb-2">
        <v-icon size="16" class="mr-1">ph-paw-print</v-icon>
        Estado inicial del hato (situacion actual)
      </div>
      <v-row dense class="mb-4">
        <v-col v-for="c in HERD_CATEGORIES" :key="c.key" cols="6" sm="4" md="3">
          <v-text-field
            v-model.number="initialHerd[c.key]"
            :label="c.label"
            type="number"
            min="0"
            step="1"
            variant="outlined"
            density="compact"
            :error-messages="fieldError(c.label)"
            hide-details="auto"
          />
        </v-col>
      </v-row>

      <!-- C · Parametros tecnicos -->
      <template v-for="g in ASSUMPTION_GROUPS" :key="g.value">
        <div class="text-caption font-weight-black text-uppercase text-grey-darken-2 mb-2">
          <v-icon size="16" class="mr-1">{{ g.icon }}</v-icon>{{ g.label }}
        </div>
        <v-row dense class="mb-4">
          <v-col v-for="a in assumptionsByGroup(g.value)" :key="a.key" cols="12" sm="6" md="3">
            <v-text-field
              v-model.number="assumptions[a.key]"
              :label="a.label"
              type="number"
              :min="a.isPercentage ? 0 : a.min"
              :max="a.isPercentage ? 100 : a.max"
              :suffix="a.isPercentage ? '%' : undefined"
              step="any"
              variant="outlined"
              density="compact"
              :error-messages="fieldError(a.label)"
              hide-details="auto"
            />
          </v-col>
        </v-row>
      </template>

      <!-- B · Compras y ventas manuales -->
      <div class="text-caption font-weight-black text-uppercase text-grey-darken-2 mb-2">
        <v-icon size="16" class="mr-1">ph-shopping-cart</v-icon>
        Compras y ventas manuales por anio
      </div>
      <div class="border rounded mb-2 pa-3 bg-grey-lighten-5">
        <div class="text-caption text-medium-emphasis mb-2">
          Compra de vaquillas al parto — la compra de sementales la calcula el sistema
        </div>
        <v-row dense class="mb-3">
          <v-col v-for="(_, i) in heiferPurchases" :key="`buy-${i}`" cols="4" sm="3" md="1">
            <v-text-field
              v-model.number="heiferPurchases[i]"
              :label="i === 0 ? 'Sit. Actual' : `Anio ${i}`"
              type="number"
              min="0"
              step="1"
              variant="outlined"
              density="compact"
              hide-details
              bg-color="white"
            />
          </v-col>
        </v-row>

        <div class="text-caption text-medium-emphasis mb-2">Venta de vaquillas</div>
        <v-row dense>
          <v-col v-for="(_, i) in heiferSales" :key="`sell-${i}`" cols="4" sm="3" md="1">
            <v-text-field
              v-model.number="heiferSales[i]"
              :label="`Anio ${i + 1}`"
              type="number"
              min="0"
              step="1"
              variant="outlined"
              density="compact"
              hide-details
              bg-color="white"
            />
          </v-col>
        </v-row>
      </div>

      <!-- D · Coeficientes U.A. (avanzado) -->
      <v-expansion-panels v-model="showAdvanced" variant="accordion" class="mb-2">
        <v-expansion-panel>
          <v-expansion-panel-title class="text-caption font-weight-bold text-uppercase">
            <v-icon size="16" class="mr-2">ph-sliders</v-icon>
            Avanzado · Coeficientes Unidad Animal
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="text-caption text-medium-emphasis mb-3">
              Constantes del modelo. Cambiarlas altera las unidades animal y la superficie requerida.
            </div>
            <v-row dense>
              <v-col v-for="c in HERD_CATEGORIES" :key="`ua-${c.key}`" cols="6" sm="4" md="3">
                <v-text-field
                  v-model.number="uaCoefficients[c.key]"
                  :label="c.label"
                  type="number"
                  min="0"
                  step="0.05"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Errores + accion -->
    <div class="pa-4 pt-0">
      <v-alert
        v-if="!isValid"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        <div class="text-caption font-weight-bold mb-1">
          Corrige lo siguiente para generar el reporte:
        </div>
        <ul class="pl-4 text-caption">
          <li v-for="(e, i) in errors" :key="i">{{ e }}</li>
        </ul>
      </v-alert>

      <div class="d-flex justify-end ga-2">
        <v-btn variant="text" size="small" prepend-icon="ph-arrow-counter-clockwise" @click="resetForm">
          Restaurar valores
        </v-btn>
        <v-btn
          :color="format === 'excel' ? 'success' : format === 'pdf' ? 'red-darken-1' : 'primary'"
          variant="flat"
          size="small"
          class="font-weight-bold"
          :loading="loading"
          :disabled="!isValid"
          :prepend-icon="format === 'excel' ? 'ph-file-xls' : format === 'pdf' ? 'ph-eye' : 'ph-magnifying-glass'"
          @click="generate"
        >
          {{ format === "excel" ? "Descargar Excel" : format === "pdf" ? "Previsualizar PDF" : "Generar" }}
        </v-btn>
      </div>
    </div>

    <!-- Resultado: matriz concepto x anios -->
    <template v-if="format === 'json'">
      <v-divider />

      <div v-if="loading" class="pa-4">
        <v-skeleton-loader type="table-row@6" />
      </div>

      <div
        v-else-if="!generated"
        class="d-flex flex-column align-center justify-center py-10 text-grey-lighten-1"
      >
        <v-icon size="48" class="mb-2">ph-chart-line-up</v-icon>
        <div class="text-caption text-grey-darken-1">
          Captura los datos y genera la proyeccion a {{ PROJECTION_YEARS }} anios
        </div>
      </div>

      <template v-else-if="years.length">
        <v-alert
          v-if="unmatchedRows.length"
          type="info"
          variant="tonal"
          density="compact"
          class="ma-4 mb-0"
        >
          <div class="text-caption">
            El response no trae {{ unmatchedRows.length }} concepto(s):
            <strong>{{ unmatchedRows.join(", ") }}</strong>.
            Llaves recibidas: {{ receivedKeys.join(", ") }}
          </div>
        </v-alert>

        <div class="pa-4" style="overflow-x: auto;">
          <v-table density="compact" class="matrix">
            <thead>
              <tr>
                <th class="concept-col text-caption font-weight-bold bg-grey-lighten-4">Concepto</th>
                <th
                  v-for="y in years"
                  :key="`h-${y.year}`"
                  class="text-caption font-weight-bold text-no-wrap text-end bg-grey-lighten-4"
                >
                  {{ yearLabel(y.year) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="section in ROW_SECTIONS" :key="section.title">
                <tr>
                  <td
                    :colspan="years.length + 1"
                    class="text-caption font-weight-black text-uppercase bg-blue-grey-lighten-5"
                  >
                    {{ section.title }}
                  </td>
                </tr>
                <tr
                  v-for="row in section.rows"
                  :key="`${section.title}-${row.label}`"
                  :class="row.emphasis ? 'bg-grey-lighten-5 font-weight-bold' : ''"
                >
                  <td class="concept-col text-caption text-no-wrap">{{ row.label }}</td>
                  <td
                    v-for="y in years"
                    :key="`${row.label}-${y.year}`"
                    class="text-caption text-no-wrap text-end"
                    :class="isNegative(cellValue(y, row.keys)) ? 'text-error' : ''"
                  >
                    {{ formatCell(cellValue(y, row.keys), row.format) }}
                  </td>
                </tr>
              </template>
            </tbody>
          </v-table>
        </div>
      </template>

      <div v-else class="text-center py-10 text-grey">
        Sin proyeccion para los datos capturados
      </div>
    </template>

    <!-- Previsualizacion de PDF -->
    <v-dialog v-model="pdfDialog" fullscreen persistent transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column" style="height: 100vh;">
        <div class="d-flex align-center pa-3 border-b bg-grey-lighten-5 flex-shrink-0">
          <v-icon color="red-darken-1" class="mr-2">ph-file-pdf</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-truncate flex-grow-1">
            {{ pdfFileName }}
          </span>
          <v-btn
            color="red-darken-1"
            variant="flat"
            size="small"
            prepend-icon="ph-download-simple"
            class="font-weight-bold mr-2"
            @click="downloadPdf"
          >
            Descargar
          </v-btn>
          <v-btn icon="ph-x" variant="text" size="small" @click="closePdfDialog" />
        </div>
        <iframe
          v-if="pdfUrl"
          :src="pdfUrl"
          title="Previsualizacion PDF"
          class="flex-grow-1"
          style="width: 100%; border: 0; min-height: 0;"
        />
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.border-b { border-bottom: 1px solid rgba(0, 0, 0, 0.08); }

/* Primera columna fija: la matriz crece a 11 columnas y hay scroll horizontal */
.matrix .concept-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #fff;
  min-width: 220px;
}

.matrix thead .concept-col {
  z-index: 2;
}
</style>
