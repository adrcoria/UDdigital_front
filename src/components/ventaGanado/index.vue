<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import AvailableBovinesPanel from "./AvailableBovinesPanel.vue";
import SaleOrderPanel from "./SaleOrderPanel.vue";
import {
  ventaGanadoService,
  ledgerAccountService,
  conceptService,
  usuariosService,
  parameterService,
} from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";
import { SALE_TYPES } from "./types";
import type { SaleOrderItem, SaleTypeValue } from "./types";

/* ──────────────────── Búsqueda ──────────────────── */
const filters = reactive({ query: "" });
const searchInput = ref("");
const onSearch = () => { filters.query = searchInput.value; };

/* ──────────────────── Formulario ──────────────────── */
const saleType = ref<SaleTypeValue | null>(null);
const idAccount = ref("");
const idConcept = ref("");
const idResponsible = ref("");
const operationDate = ref(localDateStr());

/* ──────────────────── Catálogos ──────────────────── */
const accounts = ref<any[]>([]);
const concepts = ref<any[]>([]);
const users = ref<any[]>([]);
const loadingCatalogs = ref(false);

const loadCatalogs = async () => {
  try {
    loadingCatalogs.value = true;
    const [resAccounts, resConcepts, resUsers] = await Promise.allSettled([
      ledgerAccountService.getAccounts(),
      conceptService.getConcepts(),
      usuariosService.getUsers(),
    ]);
    if (resAccounts.status === "fulfilled")
      accounts.value = resAccounts.value.data.data || resAccounts.value.data || [];
    if (resConcepts.status === "fulfilled")
      concepts.value = resConcepts.value.data.data || resConcepts.value.data || [];
    if (resUsers.status === "fulfilled")
      users.value = (resUsers.value.data.data?.list ?? resUsers.value.data.data ?? resUsers.value.data ?? [])
        .map((u: any) => ({ ...u, fullName: `${u.name} ${u.lastName}`.trim() }));
  } finally {
    loadingCatalogs.value = false;
  }
};

/* ──────────────────── Precio por kilo ──────────────────── */
/**
 * El valor de venta se calcula peso × precio por kilo.
 * El precio se precarga de un parámetro global (GET /parameters) y se puede
 * ajustar durante la venta.
 *
 * El parámetro es "Valor Venta" de GET /parameters.
 * OJO: "Factor Venta" es otro concepto y no debe usarse aquí, por eso el
 * nombre se compara exacto.
 */
const PRICE_PER_KG_PARAM = "VALOR VENTA";

const pricePerKg = ref(0);
const defaultPricePerKg = ref(0);
const priceParamFound = ref(false);
const loadingPrice = ref(false);

const loadPricePerKg = async () => {
  try {
    loadingPrice.value = true;
    const res = await parameterService.getParameters({ page: 1, limit: 100 });
    const list = res.data?.data?.list ?? res.data?.data ?? [];
    const param = list.find(
      (p: any) => String(p?.name || "").trim().toUpperCase() === PRICE_PER_KG_PARAM
    );

    priceParamFound.value = Number(param?.value) > 0;
    defaultPricePerKg.value = priceParamFound.value ? Number(param.value) : 0;
  } catch {
    // Sin parámetro no inventamos precio: se captura a mano
    priceParamFound.value = false;
    defaultPricePerKg.value = 0;
  } finally {
    pricePerKg.value = defaultPricePerKg.value;
    loadingPrice.value = false;
  }
};

const calcSaleValue = (weight: number) =>
  Number(((weight || 0) * (pricePerKg.value || 0)).toFixed(2));

/* ──────────────────── Refs ──────────────────── */
const availablePanel = ref<InstanceType<typeof AvailableBovinesPanel> | null>(null);

/* ──────────────────── Orden ──────────────────── */
const orderItems = ref<SaleOrderItem[]>([]);
const orderIds = computed(() => orderItems.value.map((i) => i.bovineId));
const submitting = ref(false);

const onAddBovine = (item: SaleOrderItem) => {
  if (orderIds.value.includes(item.bovineId)) return;
  orderItems.value.push({ ...item, saleValue: calcSaleValue(item.weight) });
};

// Al ajustar el precio por kilo se recalcula toda la orden
watch(pricePerKg, () => {
  orderItems.value.forEach((item) => {
    item.saleValue = calcSaleValue(item.weight);
  });
});

/**
 * Corrección del peso durante la venta: recalcula el valor con el precio por kilo.
 * El peso corregido solo aplica a esta venta, no modifica al bovino.
 *
 * El guard de igualdad evita trabajo de más cuando el campo reemite el mismo peso.
 */
const onWeightChange = (bovineId: string, weight: number) => {
  const item = orderItems.value.find((i) => i.bovineId === bovineId);
  if (!item || item.weight === weight) return;

  item.weight = weight;
  item.saleValue = calcSaleValue(weight);
};

const onRemoveBovine = (bovineId: string) => {
  orderItems.value = orderItems.value.filter((i) => i.bovineId !== bovineId);
};

/* ──────────────────── Validación ──────────────────── */
const isFormReady = computed(() =>
  !!saleType.value &&
  !!idAccount.value &&
  !!idConcept.value &&
  !!idResponsible.value &&
  !!operationDate.value &&
  orderItems.value.length > 0
);

/* ──────────────────── Confirmar Venta ──────────────────── */
const onConfirmSale = async () => {
  if (!saleType.value)      { showErrorAlert("Selecciona el tipo de venta"); return; }
  if (!idAccount.value)     { showErrorAlert("Selecciona la cuenta contable"); return; }
  if (!idConcept.value)     { showErrorAlert("Selecciona el concepto"); return; }
  if (!idResponsible.value) { showErrorAlert("Selecciona el responsable"); return; }
  if (!operationDate.value) { showErrorAlert("Ingresa la fecha de operación"); return; }
  if (orderItems.value.length === 0) { showErrorAlert("Agrega al menos un animal a la orden"); return; }

  const total = orderItems.value.reduce((acc, i) => acc + (i.saleValue || 0), 0);
  const result = await showConfirmAlert(
    "Confirmar venta",
    `¿Registrar la venta de ${orderItems.value.length} animal(es) por $${total.toFixed(2)} MXN?`,
    "Sí, vender",
    "Cancelar"
  );
  if (!result.isConfirmed) return;

  try {
    submitting.value = true;
    await ventaGanadoService.createSale({
      rows: orderItems.value.map((i) => ({
        idBovine: i.bovineId,
        saleType: saleType.value!,
        saleValue: i.saleValue || 0,
      })),
      idAccount: idAccount.value,
      idConcept: idConcept.value,
      idResponsible: idResponsible.value,
      operationDate: operationDate.value,
    });
    showSuccessAlert("Venta registrada exitosamente");
    orderItems.value = [];
    saleType.value = null;
    idAccount.value = "";
    idConcept.value = "";
    idResponsible.value = "";
    operationDate.value = localDateStr();
    pricePerKg.value = defaultPricePerKg.value;
    availablePanel.value?.refresh();
  } catch {
    showErrorAlert("No se pudo registrar la venta");
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadCatalogs();
  loadPricePerKg();
});
</script>

<template>
  <v-container fluid class="pt-0">

    <!-- ── Configuración ── -->
    <v-card class="mb-4" elevation="1">
      <v-card-title class="pa-3 pb-1 text-body-1 font-weight-bold">
        <v-icon icon="ph-tag" class="mr-2" /> Configuración de la venta
      </v-card-title>
      <v-card-text class="pa-3 pt-2">
        <v-row dense>
          <v-col cols="12" sm="2">
            <v-select
              v-model="saleType"
              :items="SALE_TYPES"
              item-title="label"
              item-value="value"
              label="Tipo de venta *"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
          </v-col>

          <v-col cols="12" sm="3">
            <v-autocomplete
              v-model="idAccount"
              :items="accounts"
              item-title="name"
              item-value="id"
              label="Cuenta contable *"
              density="compact"
              variant="outlined"
              hide-details
              :loading="loadingCatalogs"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="2">
            <v-autocomplete
              v-model="idConcept"
              :items="concepts"
              item-title="name"
              item-value="id"
              label="Concepto *"
              density="compact"
              variant="outlined"
              hide-details
              :loading="loadingCatalogs"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="3">
            <v-autocomplete
              v-model="idResponsible"
              :items="users"
              item-title="fullName"
              item-value="id"
              label="Responsable *"
              density="compact"
              variant="outlined"
              hide-details
              :loading="loadingCatalogs"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="2">
            <v-text-field
              v-model="operationDate"
              label="Fecha de operación *"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
        </v-row>

        <v-row dense class="mt-1">
          <v-col cols="12" sm="3">
            <v-text-field
              v-model.number="pricePerKg"
              label="Precio por kilo (MXN) *"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              density="compact"
              variant="outlined"
              :loading="loadingPrice"
              :hint="priceParamFound
                ? `Precargado del parámetro Valor Venta: $${defaultPricePerKg}`
                : 'Captura manual'"
              persistent-hint
            />
          </v-col>

          <v-col cols="12" sm="9" class="d-flex align-center">
            <v-alert
              v-if="!loadingPrice && !priceParamFound"
              type="warning"
              variant="tonal"
              density="compact"
              class="w-100"
            >
              El parámetro <strong>Valor Venta</strong> no está configurado: captura el precio
              por kilo manualmente para esta venta.
            </v-alert>

            <span v-else class="text-caption text-medium-emphasis">
              Al cambiar el precio por kilo o el peso de un animal, la orden se recalcula sola.
            </span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- ── Panel principal ── -->
    <v-row>
      <!-- Ganado disponible -->
      <v-col cols="12" md="8">
        <v-card elevation="1">
          <v-card-title class="pa-3 d-flex align-center">
            <v-icon icon="ph-cow" class="mr-2" />
            Ganado Disponible
          </v-card-title>
          <v-card-text class="pa-3 pt-0">
            <v-text-field
              v-model="searchInput"
              label="Buscar por arete o nombre..."
              density="compact"
              variant="outlined"
              hide-details
              clearable
              prepend-inner-icon="ph-magnifying-glass"
              @keyup.enter="onSearch"
              @click:clear="() => { searchInput = ''; filters.query = ''; }"
            >
              <template #append>
                <v-btn color="primary" variant="tonal" size="small" @click="onSearch">Buscar</v-btn>
              </template>
            </v-text-field>
          </v-card-text>

          <AvailableBovinesPanel
            ref="availablePanel"
            :filters="filters"
            :order-ids="orderIds"
            @add="onAddBovine"
          />
        </v-card>
      </v-col>

      <!-- Orden -->
      <v-col cols="12" md="4">
        <SaleOrderPanel
          :items="orderItems"
          :submitting="submitting"
          :is-form-ready="isFormReady"
          @remove="onRemoveBovine"
          @weight="onWeightChange"
          @confirm="onConfirmSale"
        />
      </v-col>
    </v-row>

  </v-container>
</template>
