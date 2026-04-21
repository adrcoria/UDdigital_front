<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { localDateStr } from "@/app/utils/date";
import { 
  companyService, 
  ledgerAccountService, 
  conceptCategoryService, 
  conceptService 
} from "@/app/http/httpServiceProvider";
import { showErrorAlert } from "@/app/services/alertService";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
});

const reportTypes = [
  { title: "Detalle de operaciones", value: "DETAIL", subtitle: "" },
  { title: "Consolidado por empresa", value: "SUMMARY_COMPANY", subtitle: "" },
  { title: "Consolidado agroindustrias", value: "SUMMARY_ALL", subtitle: "" }
];

const catalogs = ref({ companies: [], accounts: [], categories: [], concepts: [] });
const loadingAccounts = ref(false);

onMounted(async () => {
  try {
    const resComp = await companyService.getCompanies();
    catalogs.value.companies = resComp.data.data;
  } catch (error) {
    showErrorAlert("Error al cargar catálogos maestros");
  }
});

/* ------------------ Watchers de Limpieza y Cascada ------------------ */

// RESET DE FILTROS AL CAMBIAR TIPO DE REPORTE
watch(() => props.modelValue.reportType, (newType) => {
  if (newType) {
    emit('update:modelValue', {
      ...props.modelValue,
      companyId: null,
      accountId: null,
      categoryId: null,
      conceptId: null,
      reportType: newType 
    });
    catalogs.value.accounts = [];
    catalogs.value.categories = [];
    catalogs.value.concepts = [];
  }
});

// Jerarquía: Compañía -> Cuentas
watch(() => props.modelValue.companyId, async (newId) => {
  emit('update:modelValue', { ...props.modelValue, accountId: null, categoryId: null, conceptId: null });
  catalogs.value.accounts = [];
  if (!newId) return;
  try {
    loadingAccounts.value = true;
    const res = await ledgerAccountService.getAccounts(newId);
    catalogs.value.accounts = res.data.data;
  } finally {
    loadingAccounts.value = false;
  }
});

// Jerarquía: Cuenta -> Categorías
watch(() => props.modelValue.accountId, async (newId) => {
  emit('update:modelValue', { ...props.modelValue, categoryId: null, conceptId: null });
  catalogs.value.categories = [];
  if (newId) {
    const res = await conceptCategoryService.getConceptCategories(newId);
    catalogs.value.categories = res.data.data;
  }
});

// Jerarquía: Categoría -> Conceptos
watch(() => props.modelValue.categoryId, async (newId) => {
  emit('update:modelValue', { ...props.modelValue, conceptId: null });
  catalogs.value.concepts = [];
  if (newId) {
    const res = await conceptService.getConcepts(newId);
    catalogs.value.concepts = res.data.data;
  }
});

const onClear = () => {
  emit("update:modelValue", {
    reportType: null,
    companyId: null,
    accountId: null,
    categoryId: null,
    conceptId: null,
    dateFrom: localDateStr(),
    dateTo: localDateStr(),
  });
};
</script>

<template>
  <v-card variant="flat" border class="pa-5 bg-white rounded-lg shadow-sm">
    <div class="d-flex align-center mb-5">
      <v-icon color="primary" class="mr-2" size="24">ph-funnel-simple</v-icon>
      <span class="text-subtitle-1 font-weight-bold text-grey-darken-3 text-uppercase">Configuración de Reporte Operativo</span>
    </div>

    <v-row dense>
      <v-col cols="12" md="4">
        <v-select
          label="1. Tipo de reporte *"
          v-model="props.modelValue.reportType"
          :items="reportTypes"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          hide-details
          prepend-inner-icon="ph-file-search"
          color="primary"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="item.raw.subtitle"></v-list-item>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" sm="6" md="2">
        <v-text-field type="date" label="Fecha Inicio" v-model="props.modelValue.dateFrom" :disabled="!props.modelValue.reportType" variant="outlined" density="comfortable" hide-details prepend-inner-icon="ph-calendar" />
      </v-col>
      <v-col cols="12" sm="6" md="2">
        <v-text-field type="date" label="Fecha Fin" v-model="props.modelValue.dateTo" :disabled="!props.modelValue.reportType" variant="outlined" density="comfortable" hide-details prepend-inner-icon="ph-calendar" />
      </v-col>

      <v-col cols="12" md="4">
        <v-autocomplete
          :label="props.modelValue.reportType === 'SUMMARY_COMPANY' ? ' Compañía *' : ' Compañía ( Todas)'"
          placeholder="Seleccione o deje vacío para todas"
          v-model="props.modelValue.companyId"
          :items="catalogs.companies"
          item-title="name"
          item-value="id"
          :disabled="!props.modelValue.reportType || props.modelValue.reportType === 'SUMMARY_ALL'"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="ph-buildings"
          color="primary"
          no-data-text="No se encontraron compañías"
        />
      </v-col>
    </v-row>

    <v-divider v-if="props.modelValue.reportType === 'DETAIL'" class="my-6 border-opacity-25"></v-divider>

    <v-row dense v-if="props.modelValue.reportType === 'DETAIL'">
      <v-col cols="12" md="4">
        <v-autocomplete
          label="Cuenta Contable ( Todas)"
          placeholder="Seleccione cuenta"
          v-model="props.modelValue.accountId"
          :items="catalogs.accounts"
          item-title="name"
          item-value="id"
          :disabled="!props.modelValue.companyId"
          :loading="loadingAccounts"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="ph-wallet"
          no-data-text="Seleccione una compañía primero"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          label="Categoría ( Todas)"
          placeholder="Seleccione categoría"
          v-model="props.modelValue.categoryId"
          :items="catalogs.categories"
          item-title="name"
          item-value="id"
          :disabled="!props.modelValue.accountId"
          variant="outlined" density="comfortable" hide-details clearable prepend-inner-icon="ph-tag"
          no-data-text="Seleccione una cuenta primero"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-autocomplete
          label="Concepto ( Todos)"
          placeholder="Seleccione concepto"
          v-model="props.modelValue.conceptId"
          :items="catalogs.concepts"
          item-title="name"
          item-value="id"
          :disabled="!props.modelValue.categoryId"
          variant="outlined" density="comfortable" hide-details clearable prepend-inner-icon="ph-list-checks"
          no-data-text="Seleccione una categoría primero"
        />
      </v-col>
    </v-row>

    <div class="d-flex justify-end mt-5">
      <v-btn color="grey-lighten-4" @click="onClear" elevation="0" class="text-grey-darken-3 font-weight-bold px-6">
        RESETEAR SELECCIÓN <v-icon class="ml-2" size="18">ph-arrow-counter-clockwise</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>