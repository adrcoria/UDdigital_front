<script lang="ts" setup>
import { ref, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditPositionDialog from "./Dialogs/CreateEditPositionDialog.vue";
import { positionService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import { formatDate } from "@/app/utils/date";

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
const confirmationDialog = ref(false);
const selectedItem = ref<any | null>(null);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

const headers = [
  { title: "Nombre" },
  { title: "Creado" },
  { title: "Actualizado" },
  { title: "Acciones", align: "center" },
];

const getActionMenu = () => [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

const onSelectAction = (option: string, item: any) => {
  selectedItem.value = item;
  if (option === "edit") createEditDialog.value = true;
  else if (option === "delete") {
    itemToDelete.value = item;
    confirmationDialog.value = true;
  }
};

const getPositions = async () => {
  try {
    loading.value = true;
    const response = await positionService.getPositions();
    tableData.value = response.data.data || [];
    config.value.noOfItems = tableData.value.length;
    config.value.end = tableData.value.length;
    config.value.start = tableData.value.length > 0 ? 1 : 0;
  } catch {
    showErrorAlert("No se pudo cargar el listado de puestos");
  } finally {
    loading.value = false;
  }
};

const onConfirmDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    deleting.value = true;
    await positionService.deletePosition(itemToDelete.value.id);
    showSuccessAlert("Puesto eliminado");
    confirmationDialog.value = false;
    itemToDelete.value = null;
    await getPositions();
  } catch {
    showErrorAlert("No se pudo eliminar el puesto. Verifica que no tenga personal asignado.");
  } finally {
    deleting.value = false;
  }
};

const openCreate = () => {
  selectedItem.value = null;
  createEditDialog.value = true;
};

defineExpose({ openCreate, refresh: getPositions });

onMounted(getPositions);
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
          <td :colspan="headers.length" class="text-center py-8 text-medium-emphasis">
            <v-icon icon="ph-briefcase" size="40" class="mb-2" color="grey-lighten-1" />
            <div>Sin puestos registrados</div>
          </td>
        </tr>
      </template>

      <tr v-for="p in tableData" :key="p.id">
        <td class="font-weight-medium">{{ p.name }}</td>
        <td>{{ formatDate(p.createdAt) }}</td>
        <td>{{ formatDate(p.updatedAt) }}</td>
        <td class="text-center">
          <ListMenuWithIcon
            icon="ph-dots-three-vertical"
            :menu-items="getActionMenu()"
            variant="text"
            color="primary"
            @on-select="(opt) => onSelectAction(opt, p)"
          />
        </td>
      </tr>
    </template>
  </Table>

  <CreateEditPositionDialog
    v-model="createEditDialog"
    :item="selectedItem"
    @refresh="getPositions"
  />

  <RemoveItemConfirmationDialog
    v-if="confirmationDialog"
    v-model="confirmationDialog"
    :loading="deleting"
    title="Eliminar puesto"
    @on-confirm="onConfirmDelete"
  >
    <template #text>
      ¿Eliminar el puesto <strong>{{ itemToDelete?.name }}</strong>?
      Esta acción no se puede deshacer.
    </template>
  </RemoveItemConfirmationDialog>
</template>
