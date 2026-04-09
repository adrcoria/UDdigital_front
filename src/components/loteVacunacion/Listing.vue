<script lang="ts" setup>
import { ref, onMounted, watch, computed } from "vue";
import Table from "@/app/common/components/Table.vue";
import { batchService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { canManageAll } from "@/app/utils/authHelper";

import CreateBatchDialog from "./Dialogs/CreateBatchDialog.vue";
import AddBovinesToBatchDialog from "./Dialogs/AddBovinesToBatchDialog.vue";
import BatchDetailFullscreenDialog from "./Dialogs/BatchDetailFullscreenDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";

const props = defineProps<{
  filters: {
    query: string;
    batchTypeId: string;
  };
}>();

const batches = ref<any[]>([]);
const loading = ref(false);
const deleting = ref(false);
const page = ref(1);

const config = ref({
  page: page.value,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 10,
});

const createDialog = ref(false);
const showAddBovines = ref(false);
const showDetail = ref(false);
const confirmationDialog = ref(false);
const selectedBatch = ref<any | null>(null);

const tableData = computed(() => {
  const query = props.filters.query?.toLowerCase().trim();
  if (!query) return batches.value;
  return batches.value.filter((item) =>
    item.name?.toLowerCase().includes(query) ||
    item.bovineCount?.toString().includes(query)
  );
});

const formatDate = (value: string | Date) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const getActionMenu = (_item: any) => {
  const menu = [
    { title: "Agregar animales", icon: "ph-plus-circle", value: "add" },
    { title: "Ver detalle / Aplicar vacuna", icon: "ph-eye", value: "view" },
  ];
  if (canManageAll()) {
    menu.push({ title: "Eliminar campaña", icon: "ph-trash", value: "delete" });
  }
  return menu;
};

const getBatches = async () => {
  try {
    loading.value = true;
    const params = {
      idBatchType: props.filters.batchTypeId,
      page: page.value,
      limit: config.value.itemsPerPage,
    };
    const res = await batchService.getBatches(params);
    const payload = res.data?.data;
    batches.value = payload?.data || [];
    config.value = {
      ...config.value,
      noOfItems: payload?.total || 0,
      page: payload?.page || 1,
    };
  } catch {
    showErrorAlert("No se pudieron cargar las campañas de vacunación");
  } finally {
    loading.value = false;
  }
};

const onSelectAction = (action: string, item: any) => {
  selectedBatch.value = item;
  if (action === "add") showAddBovines.value = true;
  else if (action === "view") showDetail.value = true;
  else if (action === "delete") confirmationDialog.value = true;
};

const onCreate = () => {
  selectedBatch.value = null;
  createDialog.value = true;
};

const confirmDelete = async () => {
  try {
    deleting.value = true;
    await batchService.deleteBatch(selectedBatch.value.id);
    showSuccessAlert("Campaña eliminada");
    await getBatches();
  } catch {
    showErrorAlert("No se pudo eliminar la campaña");
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
  }
};

onMounted(getBatches);
watch(page, getBatches);
watch(() => config.value.itemsPerPage, () => { page.value = 1; getBatches(); });
watch(() => props.filters, () => { page.value = 1; getBatches(); }, { deep: true });

const headers = [
  { title: "Nombre de la Campaña" },
  { title: "Animales Registrados", align: "center" },
  { title: "Fecha de Creación" },
  { title: "Estatus", align: "center" },
  { title: "Acciones", align: "center" },
];
</script>

<template>
  <v-card border elevation="0" class="rounded-lg">
    <v-card-title class="pa-4 bg-white d-flex align-center">
      <div class="d-flex align-center">
        <v-icon color="teal-darken-1" class="mr-2" size="28">ph-syringe</v-icon>
        <span class="text-h6 font-weight-bold text-uppercase">Campañas de Vacunación</span>
      </div>

      <v-spacer />

      <v-btn color="teal-darken-1" prepend-icon="ph-plus-bold" @click="onCreate" height="44" class="px-6 font-weight-bold">
        Nueva Campaña
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in tableData" :key="item.id" class="batch-row">
            <td class="font-weight-bold text-teal-darken-1 py-4">{{ item.name }}</td>

            <td class="text-center">
              <v-chip color="teal-darken-1" variant="flat" size="small" class="font-weight-black">
                {{ item.bovineCount || 0 }} CABEZAS
              </v-chip>
            </td>

            <td>{{ formatDate(item.createdAt) }}</td>

            <td class="text-center">
              <v-chip
                :color="item.bovineCount > 0 ? 'success' : 'blue-grey-lighten-4'"
                :variant="item.bovineCount > 0 ? 'tonal' : 'flat'"
                size="x-small"
                label
                class="font-weight-bold"
              >
                {{ item.bovineCount > 0 ? 'CON ANIMALES' : 'SIN ANIMALES' }}
              </v-chip>
            </td>

            <td class="text-center">
              <ListMenuWithIcon :menuItems="getActionMenu(item)" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-10 text-grey-darken-1">
              <v-icon size="48" color="grey-lighten-2" class="mb-2">ph-syringe</v-icon>
              <div>No se encontraron campañas de vacunación registradas</div>
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>

    <v-divider />
    <div class="pa-4 d-flex align-center bg-grey-lighten-5">
      <div style="width: 120px;">
        <v-select
          label="Mostrar"
          :items="[10, 25, 50]"
          v-model="config.itemsPerPage"
          variant="outlined"
          density="compact"
          hide-details
          bg-color="white"
        />
      </div>
      <v-spacer />
      <div class="text-caption text-grey-darken-1 font-weight-medium">
        Total: {{ config.noOfItems }} registros
      </div>
    </div>
  </v-card>

  <CreateBatchDialog
    v-if="createDialog"
    v-model="createDialog"
    :batchTypeId="filters.batchTypeId"
    @refresh="getBatches"
  />

  <AddBovinesToBatchDialog
    v-if="showAddBovines"
    v-model="showAddBovines"
    :batch="selectedBatch"
    @refresh="getBatches"
  />

  <BatchDetailFullscreenDialog
    v-if="showDetail"
    v-model="showDetail"
    :batch="selectedBatch"
    @refresh="getBatches"
  />

  <RemoveItemConfirmationDialog
    v-model="confirmationDialog"
    :loading="deleting"
    title="Eliminar Campaña de Vacunación"
    message="¿Confirmas que deseas eliminar esta campaña? Los animales quedarán sin asignación."
    @onConfirm="confirmDelete"
  />
</template>
