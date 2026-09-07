<script lang="ts" setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  companyService, liveStockService, batchService,
  machineryService, positionService, inventoryService,
  ledgerAccountService, conceptCategoryService, conceptService,
} from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";
import { buildReportFileName, downloadBlob, triggerDownload } from "./exportUtils";
import type { FilterDef, ReportConfig } from "./types";

const props = defineProps<{ config: ReportConfig }>();

const loading = ref(false);
const formValues = ref<Record<string, any>>({});
const format = ref<"excel" | "pdf" | "json">("excel");
const jsonPage = ref(1);
const jsonResult = ref<{ items: any[]; total: number; totalPages: number } | null>(null);
const tableDialog = ref(false);

// Previsualizacion de PDF en modal
const pdfDialog = ref(false);
const pdfUrl = ref<string>("");
const pdfFileName = ref<string>("");

const buildFileName = (ext: string) =>
  buildReportFileName(props.config.id, props.config.fileName, ext);

const downloadPdf = () => triggerDownload(pdfUrl.value, pdfFileName.value);

const closePdfDialog = () => {
  pdfDialog.value = false;
  if (pdfUrl.value) window.URL.revokeObjectURL(pdfUrl.value);
  pdfUrl.value = "";
};

const LIMIT = 100;

const cats = ref<{
  companies: any[];
  batches: any[];
  machinery: any[];
  positions: any[];
  products: any[];
  accounts: any[];
  categories: any[];
  concepts: any[];
  [key: string]: any[];
}>({
  companies: [], batches: [], machinery: [], positions: [], products: [],
  accounts: [], categories: [], concepts: [],
});

/* ── Filtros encadenados de contabilidad ─────────────────────────────────── */
const hasType = (type: FilterDef["type"]) =>
  props.config.filters.some((f) => f.type === type);

const keyOf = (type: FilterDef["type"], fallback: string) =>
  props.config.filters.find((f) => f.type === type)?.key ?? fallback;

const companyKey = keyOf("company", "idCompany");
const accountKey = keyOf("ledger-account", "idAccount");
const categoryKey = keyOf("concept-category", "idConceptCategory");
const conceptKey = keyOf("concept", "idConcept");

const loadingAccounts = ref(false);
const loadingCategories = ref(false);
const loadingConcepts = ref(false);

const safe = (res: any): any[] => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  return [];
};

// Response: { statusCode, message, data: { data: [...], meta: { totalItems, totalPages, page, limit } } }
const safeJson = (res: any): { items: any[]; total: number; totalPages: number } => {
  // El array puede venir en res.data.data.data (envuelto) o res.data.data (plano)
  const payload = res?.data?.data;
  const items = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];
  const meta = payload?.meta ?? res?.data?.meta;
  const total = meta?.totalItems ?? items.length;
  const totalPages = meta?.totalPages ?? 1;
  return { items, total, totalPages };
};

// Compañía → Cuentas
watch(() => formValues.value[companyKey], async (id) => {
  if (!hasType("ledger-account")) return;

  formValues.value[accountKey] = null;
  formValues.value[categoryKey] = null;
  formValues.value[conceptKey] = null;
  cats.value.accounts = [];
  cats.value.categories = [];
  cats.value.concepts = [];
  if (!id) return;

  try {
    loadingAccounts.value = true;
    cats.value.accounts = safe(await ledgerAccountService.getAccounts(id));
  } catch {} finally {
    loadingAccounts.value = false;
  }
});

// Cuenta → Categorías
watch(() => formValues.value[accountKey], async (id) => {
  if (!hasType("concept-category")) return;

  formValues.value[categoryKey] = null;
  formValues.value[conceptKey] = null;
  cats.value.categories = [];
  cats.value.concepts = [];
  if (!id) return;

  try {
    loadingCategories.value = true;
    cats.value.categories = safe(await conceptCategoryService.getConceptCategories(id));
  } catch {} finally {
    loadingCategories.value = false;
  }
});

// Categoría → Conceptos
watch(() => formValues.value[categoryKey], async (id) => {
  if (!hasType("concept")) return;

  formValues.value[conceptKey] = null;
  cats.value.concepts = [];
  if (!id) return;

  try {
    loadingConcepts.value = true;
    cats.value.concepts = safe(await conceptService.getConcepts(id));
  } catch {} finally {
    loadingConcepts.value = false;
  }
});

/* ── Filtros obligatorios ────────────────────────────────────────────────── */
const missingRequired = computed(() =>
  props.config.filters.some((f) => {
    if (!f.required) return false;

    if (f.type === "date-range") {
      const from = formValues.value[f.keyFrom ?? "startDate"];
      const to = formValues.value[f.keyTo ?? "endDate"];
      return !from || !to;
    }

    const key =
      f.key ??
      (f.type === "company" ? "idCompany"
        : f.type === "ledger-account" ? "idAccount"
        : f.type === "concept-category" ? "idConceptCategory"
        : f.type === "concept" ? "idConcept"
        : "");

    return !key || !formValues.value[key];
  })
);

/**
 * Encabezados de la tabla. Si el reporte no declara columnas, o ninguna de las
 * declaradas existe en la respuesta, se derivan de las llaves del primer
 * registro para que el modo Tabla nunca quede en blanco.
 */
const tableHeaders = computed<{ key: string; title: string }[]>(() => {
  const declared = props.config.columns;
  const firstRow = jsonResult.value?.items?.[0];

  if (!firstRow) return declared;

  const matches = declared.some((c) => c.key in firstRow);
  if (declared.length && matches) return declared;

  return Object.keys(firstRow).map((key) => ({ key, title: key }));
});

// Etiqueta con asterisco cuando el filtro es obligatorio
const lbl = (f: FilterDef, fallback: string) =>
  `${f.label ?? fallback}${f.required ? " *" : ""}`;

const renderCell = (val: any): string => {
  if (val === null || val === undefined) return "---";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

onMounted(async () => {
  const types = props.config.filters.map((f) => f.type);

  // Rango de fechas precargado con hoy cuando el reporte lo pide
  for (const f of props.config.filters) {
    if (f.type === "date-range" && f.defaultToday) {
      formValues.value[f.keyFrom ?? "startDate"] = localDateStr();
      formValues.value[f.keyTo ?? "endDate"] = localDateStr();
    }
  }

  if (types.includes("company"))
    try { cats.value.companies = safe(await companyService.getCompanies()); } catch {}
  if (types.includes("batch"))
    try {
      const bf = props.config.filters.find((f) => f.type === "batch");
      cats.value.batches = safe(
        await batchService.getBatches(bf?.batchTypeId ? { idBatchType: bf.batchTypeId } : {})
      );
    } catch {}
  if (types.includes("machinery"))
    try { cats.value.machinery = safe(await machineryService.getMachinery()); } catch {}
  if (types.includes("position"))
    try { cats.value.positions = safe(await positionService.getPositions()); } catch {}
  if (types.includes("product"))
    try { cats.value.products = safe(await inventoryService.getProducts()); } catch {}
  for (const f of props.config.filters) {
    if (f.type === "catalog" && f.catalog && f.key)
      try {
        cats.value[f.key] = safe(
          await liveStockService.getItems(f.catalog, { page: 1, limit: 1000 })
        );
      } catch {}
  }
});

const onFormatChange = () => { jsonResult.value = null; jsonPage.value = 1; };

const execute = async () => {
  try {
    loading.value = true;
    const params: Record<string, any> = {
      ...Object.fromEntries(
        Object.entries(formValues.value).filter(([_, v]) => v !== null && v !== undefined && v !== "")
      ),
      format: format.value,
    };
    if (format.value === "json") {
      params.page = jsonPage.value;
      params.limit = LIMIT;
    }

    const res = await props.config.serviceFn(params);

    if (format.value === "pdf") {
      // Previsualizar en modal (no descargar directamente)
      const blob = new Blob([res.data], { type: "application/pdf" });
      if (pdfUrl.value) window.URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = window.URL.createObjectURL(blob);
      pdfFileName.value = buildFileName("pdf");
      pdfDialog.value = true;
    } else if (format.value === "excel") {
      downloadBlob(res.data, buildFileName("xlsx"));
      showSuccessAlert("Reporte generado correctamente");
    } else {
      const parsed = safeJson(res);
      // Si la pagina pedida quedo fuera de rango (p.ej. cambio de filtro con menos paginas),
      // regresa a la 1 y recarga. La pagina 1 siempre es valida, no hay recursion infinita.
      if (parsed.totalPages > 0 && jsonPage.value > parsed.totalPages) {
        jsonPage.value = 1;
        loading.value = false;
        return execute();
      }
      jsonResult.value = parsed;
      tableDialog.value = true;
    }
  } catch {
    showErrorAlert("Error al generar el reporte");
  } finally {
    loading.value = false;
  }
};

const changePage = (delta: number) => { jsonPage.value += delta; execute(); };

// Consulta nueva desde el boton principal: siempre reinicia a la pagina 1
const runReport = () => { jsonPage.value = 1; execute(); };
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

      <!-- Toggle formato -->
      <v-btn-toggle
        v-model="format"
        mandatory
        density="compact"
        variant="outlined"
        color="primary"
        class="ml-3 flex-shrink-0"
        @update:modelValue="onFormatChange"
      >
        <v-btn value="excel" size="small">
          <v-icon size="16" class="mr-1">ph-file-xls</v-icon>Excel
        </v-btn>
        <v-btn value="pdf" size="small">
          <v-icon size="16" class="mr-1">ph-file-pdf</v-icon>PDF
        </v-btn>
        <v-btn value="json" size="small">
          <v-icon size="16" class="mr-1">ph-table</v-icon>Tabla
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Filtros -->
    <div class="pa-4">
      <v-row dense>
        <template v-for="f in config.filters" :key="f.key ?? f.type">
          <template v-if="f.type === 'date-range'">
            <v-col cols="12" sm="6">
              <v-text-field
                type="date" :label="`${f.labelFrom ?? 'Fecha Inicio'}${f.required ? ' *' : ''}`"
                v-model="formValues[f.keyFrom ?? 'startDate']"
                variant="outlined" density="compact" hide-details
                prepend-inner-icon="ph-calendar"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                type="date" :label="`${f.labelTo ?? 'Fecha Fin'}${f.required ? ' *' : ''}`"
                v-model="formValues[f.keyTo ?? 'endDate']"
                variant="outlined" density="compact" hide-details
                prepend-inner-icon="ph-calendar"
              />
            </v-col>
          </template>

          <v-col v-else-if="f.type === 'text'" cols="12" sm="6">
            <v-text-field
              :label="f.label" :hint="f.hint" v-model="formValues[f.key!]"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-text-aa"
            />
          </v-col>

          <v-col v-else-if="f.type === 'number'" cols="12" sm="6">
            <v-text-field
              type="number" :label="f.label" v-model.number="formValues[f.key!]"
              variant="outlined" density="compact" hide-details min="1"
              prepend-inner-icon="ph-hash"
            />
          </v-col>

          <v-col v-else-if="f.type === 'select'" cols="12" sm="6">
            <v-select
              :label="f.label" v-model="formValues[f.key!]"
              :items="f.items" item-title="title" item-value="value"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-list"
            />
          </v-col>

          <v-col v-else-if="f.type === 'company'" cols="12" sm="6">
            <v-autocomplete
              :label="lbl(f, 'Rancho / Empresa')"
              v-model="formValues[f.key ?? 'idCompany']"
              :items="cats.companies" item-title="name" item-value="id"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-buildings" no-data-text="Sin datos"
            />
          </v-col>

          <v-col v-else-if="f.type === 'batch'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label ?? 'Lote'"
              v-model="formValues[f.key ?? 'idBatch']"
              :items="cats.batches" item-title="name" item-value="id"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-stack" no-data-text="Sin datos"
            />
          </v-col>

          <v-col v-else-if="f.type === 'machinery'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label ?? 'Maquinaria'"
              v-model="formValues[f.key ?? 'idMachinery']"
              :items="cats.machinery" item-title="name" item-value="id"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-truck" no-data-text="Sin datos"
            />
          </v-col>

          <v-col v-else-if="f.type === 'position'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label ?? 'Puesto'"
              v-model="formValues[f.key ?? 'idPosition']"
              :items="cats.positions" item-title="name" item-value="id"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-briefcase" no-data-text="Sin datos"
            />
          </v-col>

          <v-col v-else-if="f.type === 'product'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label ?? 'Producto'"
              v-model="formValues[f.key ?? 'idProduct']"
              :items="cats.products" item-title="name" item-value="id"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-package" no-data-text="Sin datos"
            />
          </v-col>

          <v-col v-else-if="f.type === 'catalog'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label" v-model="formValues[f.key!]"
              :items="cats[f.key!] ?? []" item-title="name" item-value="id"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-list-dashes" no-data-text="Sin datos"
            />
          </v-col>

          <!-- Contabilidad: cuenta → categoría → concepto -->
          <v-col v-else-if="f.type === 'ledger-account'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label ?? 'Cuenta contable (todas)'"
              v-model="formValues[f.key ?? 'idAccount']"
              :items="cats.accounts" item-title="name" item-value="id"
              :disabled="!formValues[companyKey]" :loading="loadingAccounts"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-wallet"
              no-data-text="Selecciona una compañía primero"
            />
          </v-col>

          <v-col v-else-if="f.type === 'concept-category'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label ?? 'Categoría (todas)'"
              v-model="formValues[f.key ?? 'idConceptCategory']"
              :items="cats.categories" item-title="name" item-value="id"
              :disabled="!formValues[accountKey]" :loading="loadingCategories"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-tag"
              no-data-text="Selecciona una cuenta primero"
            />
          </v-col>

          <v-col v-else-if="f.type === 'concept'" cols="12" sm="6">
            <v-autocomplete
              :label="f.label ?? 'Concepto (todos)'"
              v-model="formValues[f.key ?? 'idConcept']"
              :items="cats.concepts" item-title="name" item-value="id"
              :disabled="!formValues[categoryKey]" :loading="loadingConcepts"
              variant="outlined" density="compact" hide-details clearable
              prepend-inner-icon="ph-list-checks"
              no-data-text="Selecciona una categoría primero"
            />
          </v-col>
        </template>
      </v-row>
    </div>

    <!-- Boton de accion -->
    <div class="pa-4 pt-0 d-flex justify-end align-center">
      <span v-if="missingRequired" class="text-caption text-error font-weight-bold mr-3">
        Completa los campos obligatorios para generar el reporte
      </span>

      <v-btn
        :color="format === 'excel' ? 'success' : format === 'pdf' ? 'red-darken-1' : 'primary'"
        variant="flat" size="small" :loading="loading" :disabled="missingRequired"
        :prepend-icon="format === 'excel' ? 'ph-file-xls' : format === 'pdf' ? 'ph-eye' : 'ph-magnifying-glass'"
        class="font-weight-bold"
        @click="runReport"
      >
        {{ format === "excel" ? "Descargar Excel" : format === "pdf" ? "Previsualizar PDF" : "Consultar" }}
      </v-btn>
    </div>

    <!-- Modal resultado (modo Tabla) -->
    <v-dialog v-model="tableDialog" fullscreen persistent transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column" style="height: 100vh;">
        <div class="d-flex align-center pa-3 border-b bg-grey-lighten-5 flex-shrink-0">
          <v-avatar color="primary" size="36" class="mr-3" rounded="lg">
            <v-icon color="white" size="20">{{ config.icon }}</v-icon>
          </v-avatar>
          <div class="flex-grow-1 min-w-0">
            <div class="text-subtitle-2 font-weight-black text-uppercase text-truncate">
              {{ config.id }} · {{ config.title }}
            </div>
            <span v-if="jsonResult" class="text-caption text-grey-darken-1 font-weight-bold">
              Total: {{ jsonResult.total }} registros
            </span>
          </div>

          <!-- Paginacion -->
          <div v-if="jsonResult" class="d-flex align-center mr-3" style="gap: 6px;">
            <v-btn
              size="small" variant="outlined" density="compact"
              icon="ph-caret-left" :disabled="jsonPage <= 1 || loading"
              @click="changePage(-1)"
            />
            <span class="text-caption text-no-wrap">Pág. {{ jsonPage }} / {{ jsonResult.totalPages }}</span>
            <v-btn
              size="small" variant="outlined" density="compact"
              icon="ph-caret-right" :disabled="jsonPage >= jsonResult.totalPages || loading"
              @click="changePage(1)"
            />
          </div>

          <v-btn icon="ph-x" variant="text" size="small" @click="tableDialog = false" />
        </div>

        <!-- Tabla dinámica con headers en español -->
        <div class="flex-grow-1" style="overflow: auto; min-height: 0;">
          <v-table density="compact" fixed-header height="100%">
            <thead>
              <tr>
                <th
                  v-for="col in tableHeaders" :key="col.key"
                  class="text-caption font-weight-bold text-no-wrap bg-grey-lighten-4"
                >
                  {{ col.title }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in jsonResult?.items ?? []" :key="i">
                <td
                  v-for="col in tableHeaders" :key="col.key"
                  class="text-caption text-no-wrap"
                >
                  {{ renderCell(row[col.key]) }}
                </td>
              </tr>
              <tr v-if="jsonResult && !jsonResult.items.length">
                <td :colspan="tableHeaders.length || 1" class="text-center py-8 text-grey">
                  Sin resultados para los filtros seleccionados
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>
    </v-dialog>

    <!-- Modal de previsualizacion de PDF -->
    <v-dialog v-model="pdfDialog" fullscreen persistent transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column" style="height: 100vh;">
        <div class="d-flex align-center pa-3 border-b bg-grey-lighten-5 flex-shrink-0">
          <v-icon color="red-darken-1" class="mr-2">ph-file-pdf</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-truncate flex-grow-1">
            {{ pdfFileName }}
          </span>
          <v-btn
            color="red-darken-1" variant="flat" size="small"
            prepend-icon="ph-download-simple" class="font-weight-bold mr-2"
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
</style>
