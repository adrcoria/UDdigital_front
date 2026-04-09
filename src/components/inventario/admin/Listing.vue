<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditStockDialog from "./Dialogs/CreateEditStockDialog.vue";
import { inventoryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ search: string }>();

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const config = ref({ page: 1, start: 0, end: 0, noOfItems: 0, itemsPerPage: 10 });

const createDialog = ref(false);
const selectedItem = ref<any | null>(null);
const confirmationDialog = ref(false);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

const headers = [
  { title: "Producto" },
  { title: "Marca" },
  { title: "Categoría" },
  { title: "Precio Unit." },
  { title: "Unidad" },
  { title: "Existencias" },
  { title: "Acciones", align: "center" },
];

const actionMenu = [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

const filteredData = computed(() => {
  const q = props.search.toLowerCase().trim();
  if (!q) return tableData.value;
  return tableData.value.filter((item) =>
    item.product?.name?.toLowerCase().includes(q) ||
    item.product?.brand?.name?.toLowerCase().includes(q)
  );
});

const paginatedData = computed(() => {
  const start = (page.value - 1) * config.value.itemsPerPage;
  return filteredData.value.slice(start, start + config.value.itemsPerPage);
});

const stockColor = (units: number) => {
  if (units <= 0) return "error";
  if (units <= 5) return "warning";
  return "success";
};

const getItems = async () => {
  try {
    loading.value = true;
    const res = await inventoryService.getInventory();
    tableData.value = res.data?.data || [];
    config.value.noOfItems = tableData.value.length;
  } catch {
    showErrorAlert("No se pudo cargar el inventario");
  } finally {
    loading.value = false;
  }
};

const onSelectAction = (option: string, item: any) => {
  if (option === "edit") {
    selectedItem.value = item;
    createDialog.value = true;
  } else if (option === "delete") {
    itemToDelete.value = item;
    confirmationDialog.value = true;
  }
};

const confirmDelete = async () => {
  try {
    deleting.value = true;
    await inventoryService.deleteInventory(itemToDelete.value.id);
    showSuccessAlert("Registro eliminado");
    getItems();
  } catch (error: any) {
    const msg = error.response?.data?.message || "";
    if (msg.toLowerCase().includes("foreign") || [400, 409].includes(error.response?.status)) {
      showErrorAlert("No es posible borrar este registro, se encontraron registros asociados");
    } else {
      showErrorAlert("No se pudo eliminar el registro");
    }
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
    itemToDelete.value = null;
  }
};

onMounted(getItems);
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row align="center" no-gutters>
        <v-col cols="auto">
          <div class="text-h6">Control de Existencias</div>
        </v-col>
        <v-spacer />
        <v-col cols="auto">
          <v-btn color="primary" prepend-icon="ph-plus" @click="selectedItem = null; createDialog = true">
            Registrar Existencia
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table v-model="page" :config="{ ...config, noOfItems: filteredData.length }" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in paginatedData" :key="item.id">
            <td class="font-weight-medium">{{ item.product?.name || "---" }}</td>
            <td class="text-caption">{{ item.product?.brand?.name || "---" }}</td>
            <td class="text-caption">{{ item.product?.productSubcategory?.name || "---" }}</td>
            <td class="text-success font-weight-bold">${{ item.product?.price || "0.00" }}</td>
            <td>
              <v-chip size="x-small" color="primary" variant="tonal" label>
                {{ item.product?.unitOfMeasure || "---" }}
              </v-chip>
            </td>
            <td>
              <v-chip size="small" :color="stockColor(item.units)" variant="flat" label class="font-weight-black">
                {{ item.units }}
              </v-chip>
            </td>
            <td class="text-center">
              <ListMenuWithIcon icon="ph-dots-three-vertical ph-lg" variant="text" :color="undefined" :menuItems="actionMenu" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>
        </template>
      </Table>

      <div v-if="!loading && filteredData.length === 0" class="text-center pa-7">
        <v-avatar color="primary" variant="tonal" size="x-large">
          <i class="ph-package ph-lg"></i>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold mt-2">Sin registros de inventario</div>
      </div>

      <div style="width: 100px;" class="mt-4 mx-auto">
        <v-select label="Por página" :items="[10, 25, 50]" v-model="config.itemsPerPage" variant="underlined" density="compact" hide-details />
      </div>
    </v-card-text>
  </v-card>

  <CreateEditStockDialog
    v-if="createDialog"
    v-model="createDialog"
    :item="selectedItem"
    @refresh="getItems"
  />

  <RemoveItemConfirmationDialog v-model="confirmationDialog" :loading="deleting" @onConfirm="confirmDelete" />
</template>
