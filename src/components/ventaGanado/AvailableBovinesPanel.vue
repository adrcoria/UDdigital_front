<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import { ventaGanadoService } from "@/app/http/httpServiceProvider";
import { showErrorAlert } from "@/app/services/alertService";
import type { SaleOrderItem } from "./types";

const props = defineProps<{
  filters: { query: string };
  orderIds: string[];
}>();

const emit = defineEmits<{
  (e: "add", item: SaleOrderItem): void;
}>();

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const config = ref({
  page: 1,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 100,
});

const headers = [
  { title: "Arete Int." },
  { title: "Arete Siniiga" },
  { title: "Nombre" },
  { title: "Sexo" },
  { title: "Raza" },
  { title: "Peso (kg)" },
  { title: "Agregar", align: "center" },
];

const formatRaces = (raceAssignments: any[]) => {
  if (!raceAssignments || raceAssignments.length === 0) return "S/R";
  return raceAssignments.map((ra: any) => ra.bovineRace?.name || "S/R").join(", ");
};

/**
 * Peso vigente para calcular la venta: el último registro de weightLogs y,
 * si el animal no tiene historial, el netWeight del bovino.
 */
const getWeight = (bovine: any): number => {
  const logs = bovine?.weightLogs;

  if (Array.isArray(logs) && logs.length > 0) {
    const latest = [...logs].sort((a: any, b: any) =>
      String(b.registerDate).localeCompare(String(a.registerDate))
    )[0];
    const logWeight = Number(latest?.weight);
    if (logWeight > 0) return logWeight;
  }

  return Number(bovine?.netWeight ?? bovine?.birthWeight ?? 0) || 0;
};

const getRaces = (bovine: any) =>
  formatRaces(bovine?.raceAssignments || bovine?.bovineRaceAssignments || []);

const isInOrder = (id: string) => props.orderIds.includes(id);

/**
 * El ganado fallecido no se puede vender.
 * Si el backend no manda estatus no lo ocultamos, para no esconder registros válidos.
 */
const isSellable = (bovine: any) => {
  const status = String(bovine?.bovineStatus || "").toUpperCase();
  return status !== "MUERTO" && !bovine?.deathDate;
};

const onAdd = (bovine: any) => {
  const item: SaleOrderItem = {
    bovineId: bovine.id,
    internalEarTag: bovine.internalEarTag || "---",
    siniigaEarTag: bovine.siniigaEarTag || "",
    name: bovine.name || "",
    sex: bovine.sex?.name || bovine.bovineType?.name || "",
    races: getRaces(bovine),
    weight: getWeight(bovine),
    saleValue: 0,
  };
  emit("add", item);
};

const getBovines = async () => {
  try {
    loading.value = true;
    const response = await ventaGanadoService.getAvailableBovines({
      page: page.value,
      limit: config.value.itemsPerPage,
      search: props.filters?.query || "",
    });
    const list = response.data.data.list || [];
    tableData.value = list.filter(isSellable);
    config.value.noOfItems = response.data.data.total || 0;
    config.value.end = tableData.value.length;
  } catch {
    showErrorAlert("No se pudo cargar el ganado disponible");
  } finally {
    loading.value = false;
  }
};

onMounted(getBovines);
watch([page, () => config.value.itemsPerPage, () => props.filters.query], getBovines);

defineExpose({ refresh: getBovines });
</script>

<template>
  <Table
    :header-items="headers"
    :is-pagination="true"
    v-model="page"
    :config="config"
    :loading="loading"
  >
    <template #body>
      <template v-if="tableData.length === 0 && !loading">
        <tr>
          <td :colspan="headers.length" class="text-center py-6 text-medium-emphasis">
            Sin ganado disponible para venta
          </td>
        </tr>
      </template>
      <tr
        v-for="bovine in tableData"
        :key="bovine.id"
        :class="isInOrder(bovine.id) ? 'bg-green-lighten-5' : ''"
      >
        <td>{{ bovine.internalEarTag || "---" }}</td>
        <td>{{ bovine.siniigaEarTag || "---" }}</td>
        <td>{{ bovine.name || "---" }}</td>
        <td>{{ bovine.sex?.name || bovine.bovineType?.name || "---" }}</td>
        <td>{{ getRaces(bovine) }}</td>
        <td>{{ getWeight(bovine) > 0 ? `${getWeight(bovine)} kg` : "---" }}</td>
        <td class="text-center">
          <v-btn
            v-if="!isInOrder(bovine.id)"
            icon="ph-plus"
            size="small"
            color="primary"
            variant="tonal"
            @click="onAdd(bovine)"
          />
          <v-icon v-else color="success" icon="ph-check-circle" size="22" />
        </td>
      </tr>
    </template>
  </Table>
</template>
