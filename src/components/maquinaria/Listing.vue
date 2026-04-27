<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditMachineryDialog from "./Dialogs/CreateEditMachineryDialog.vue";
import MachineryMediaDialog from "./Dialogs/MachineryMediaDialog.vue";
import MaintenanceDialog from "./Dialogs/MaintenanceDialog.vue";
import { machineryService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import { MACHINERY_STATUS } from "./types";

const props = defineProps({
  filters: { type: Object, default: () => ({ query: "" }) },
});

/* ──────────────── Estado ──────────────── */
const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const config = ref({
  page: 1,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 10,
});

const createEditDialog = ref(false);
const mediaDialog = ref(false);
const maintenanceDialog = ref(false);
const confirmationDialog = ref(false);
const selectedItem = ref<any | null>(null);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

const headers = [
  { title: "Nombre" },
  { title: "Marca / Modelo" },
  { title: "Tipo" },
  { title: "Núm. serie" },
  { title: "Responsable" },
  { title: "Estado" },
  { title: "Acciones", align: "center" },
];

/* ──────────────── Helpers ──────────────── */
const getStatusInfo = (statusValue: string) =>
  MACHINERY_STATUS.find((s) => s.value === statusValue) || {
    value: statusValue,
    label: statusValue || "—",
    color: "grey",
  };

const getResponsibleName = (item: any) => {
  if (!item.responsible) return "—";
  return `${item.responsible.name || ""} ${item.responsible.lastName || ""}`.trim() || "—";
};

const getActionMenu = () => [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Mantenimientos", icon: "ph-wrench", value: "maintenance" },
  { title: "Foto / Factura", icon: "ph-paperclip", value: "media" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

const onSelectAction = (option: string, item: any) => {
  selectedItem.value = item;
  if (option === "edit") createEditDialog.value = true;
  else if (option === "maintenance") maintenanceDialog.value = true;
  else if (option === "media") mediaDialog.value = true;
  else if (option === "delete") {
    itemToDelete.value = item;
    confirmationDialog.value = true;
  }
};

/* ──────────────── Carga ──────────────── */
const getMachinery = async () => {
  try {
    loading.value = true;
    const response = await machineryService.getMachinery({
      page: page.value,
      limit: config.value.itemsPerPage,
      search: props.filters?.query || "",
    });
    tableData.value = response.data.data.list || [];
    config.value.noOfItems = response.data.data.total || 0;
    config.value.end = tableData.value.length;
    config.value.start = tableData.value.length > 0 ? 1 : 0;
  } catch {
    showErrorAlert("No se pudo cargar el listado de maquinaria");
  } finally {
    loading.value = false;
  }
};

/* ──────────────── Eliminar ──────────────── */
const onConfirmDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    deleting.value = true;
    await machineryService.deleteMachinery(itemToDelete.value.id);
    showSuccessAlert("Maquinaria eliminada");
    confirmationDialog.value = false;
    itemToDelete.value = null;
    await getMachinery();
  } catch {
    showErrorAlert("No se pudo eliminar la maquinaria");
  } finally {
    deleting.value = false;
  }
};

/* ──────────────── Crear (expuesto al index) ──────────────── */
const openCreate = () => {
  selectedItem.value = null;
  createEditDialog.value = true;
};

defineExpose({ openCreate, refresh: getMachinery });

onMounted(getMachinery);
watch([page, () => config.value.itemsPerPage, () => props.filters.query], getMachinery);
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
            Sin maquinaria registrada
          </td>
        </tr>
      </template>

      <tr v-for="item in tableData" :key="item.id">
        <td class="font-weight-medium">{{ item.name }}</td>
        <td>
          <div class="font-weight-medium">{{ item.brand }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.model }}</div>
        </td>
        <td>{{ item.type || "—" }}</td>
        <td>{{ item.serialNumber || "—" }}</td>
        <td>{{ getResponsibleName(item) }}</td>
        <td>
          <v-chip
            :color="getStatusInfo(item.status).color"
            size="small"
            variant="tonal"
            label
          >
            {{ getStatusInfo(item.status).label }}
          </v-chip>
        </td>
        <td class="text-center">
          <ListMenuWithIcon
            icon="ph-dots-three-vertical"
            :menu-items="getActionMenu()"
            variant="text"
            color="primary"
            @on-select="(opt) => onSelectAction(opt, item)"
          />
        </td>
      </tr>
    </template>
  </Table>

  <!-- ─ Crear/Editar ─ -->
  <CreateEditMachineryDialog
    v-model="createEditDialog"
    :item="selectedItem"
    @refresh="getMachinery"
  />

  <!-- ─ Foto / Factura ─ -->
  <MachineryMediaDialog
    v-model="mediaDialog"
    :item="selectedItem"
    @refresh="getMachinery"
  />

  <!-- ─ Mantenimientos (fullscreen CRUD) ─ -->
  <MaintenanceDialog
    v-model="maintenanceDialog"
    :machinery="selectedItem"
  />

  <!-- ─ Confirmar borrado ─ -->
  <RemoveItemConfirmationDialog
    v-if="confirmationDialog"
    v-model="confirmationDialog"
    :loading="deleting"
    title="Eliminar maquinaria"
    @on-confirm="onConfirmDelete"
  >
    <template #text>
      ¿Eliminar la maquinaria <strong>{{ itemToDelete?.name }}</strong>?
      Esta acción no se puede deshacer.
    </template>
  </RemoveItemConfirmationDialog>
</template>
