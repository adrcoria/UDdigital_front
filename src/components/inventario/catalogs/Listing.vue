<script lang="ts" setup>
import { ref, watch, computed, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditInventoryDialog from "./Dialogs/CreateEditInventoryDialog.vue";
import { inventoryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  catalog: string;
  search: string;
}>();

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const config = ref({ page: 1, start: 0, end: 0, noOfItems: 0, itemsPerPage: 10 });

const createDialog = ref(false);
const selectedItem = ref<any | null>(null);
const confirmationDialog = ref(false);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

const headers = computed(() => {
  if (props.catalog === "products") {
    return [
      { title: "Nombre" },
      { title: "Marca" },
      { title: "Categoría" },
      { title: "Precio" },
      { title: "Unidad" },
      { title: "Acciones", align: "center" },
    ];
  }
  return [
    { title: "Nombre" },
    { title: "Fecha de creación" },
    { title: "Acciones", align: "center" },
  ];
});

const actionMenu = [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

const filteredData = computed(() => {
  const q = props.search.toLowerCase().trim();
  if (!q) return tableData.value;
  return tableData.value.filter((item) =>
    item.name?.toLowerCase().includes(q)
  );
});

const paginatedData = computed(() => {
  const start = (page.value - 1) * config.value.itemsPerPage;
  return filteredData.value.slice(start, start + config.value.itemsPerPage);
});

const getItems = async () => {
  try {
    loading.value = true;
    let res;
    if (props.catalog === "products") res = await inventoryService.getProducts();
    else if (props.catalog === "brands") res = await inventoryService.getBrands();
    else res = await inventoryService.getSubcategories();

    tableData.value = res.data?.data || [];
    config.value.noOfItems = tableData.value.length;
  } catch {
    showErrorAlert("No se pudieron cargar los registros");
  } finally {
    loading.value = false;
  }
};

watch(() => props.catalog, () => { page.value = 1; getItems(); });
watch(() => props.search, () => { page.value = 1; config.value.noOfItems = filteredData.value.length; });
watch(page, () => { config.value.noOfItems = filteredData.value.length; });

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
    if (props.catalog === "products") await inventoryService.deleteProduct(itemToDelete.value.id);
    else if (props.catalog === "brands") await inventoryService.deleteBrand(itemToDelete.value.id);
    else await inventoryService.deleteSubcategory(itemToDelete.value.id);
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

const formatDate = (val: string) => val ? new Date(val).toLocaleDateString("es-MX") : "---";

onMounted(getItems);
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row align="center" no-gutters>
        <v-col cols="auto">
          <div class="text-h6">Registros del catálogo</div>
        </v-col>
        <v-spacer />
        <v-col cols="auto">
          <v-btn color="primary" prepend-icon="ph-plus" @click="selectedItem = null; createDialog = true">
            Registrar Nuevo
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table v-model="page" :config="{ ...config, noOfItems: filteredData.length }" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in paginatedData" :key="item.id">

            <template v-if="catalog === 'products'">
              <td class="font-weight-medium">{{ item.name }}</td>
              <td>{{ item.brand?.name || "---" }}</td>
              <td>{{ item.productSubcategory?.name || "---" }}</td>
              <td class="text-success font-weight-bold">${{ item.price }}</td>
              <td>
                <v-chip size="x-small" color="primary" variant="tonal" label>{{ item.unitOfMeasure }}</v-chip>
              </td>
            </template>

            <template v-else>
              <td class="font-weight-medium">{{ item.name }}</td>
              <td class="text-caption text-grey-darken-1">{{ formatDate(item.createdAt) }}</td>
            </template>

            <td class="text-center">
              <ListMenuWithIcon icon="ph-dots-three-vertical ph-lg" variant="text" :color="undefined" :menuItems="actionMenu" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>
        </template>
      </Table>

      <div v-if="!loading && filteredData.length === 0" class="text-center pa-7">
        <v-avatar color="primary" variant="tonal" size="x-large">
          <i class="ph-magnifying-glass ph-lg"></i>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold mt-2">¡No se encontraron resultados!</div>
      </div>

      <div style="width: 100px;" class="mt-4 mx-auto">
        <v-select label="Por página" :items="[10, 25, 50]" v-model="config.itemsPerPage" variant="underlined" density="compact" hide-details />
      </div>
    </v-card-text>
  </v-card>

  <CreateEditInventoryDialog
    v-if="createDialog"
    v-model="createDialog"
    :item="selectedItem"
    :catalog="catalog"
    @refresh="getItems"
  />

  <RemoveItemConfirmationDialog v-model="confirmationDialog" :loading="deleting" @onConfirm="confirmDelete" />
</template>
