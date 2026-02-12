<script lang="ts" setup>
import { ref, watch, onMounted, computed } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import CreateEditLivestockDialog from "./Dialogs/CreateEditLivestockDialog.vue";
import CreateEditLivestockOwnerDialog from "./Dialogs/CreateEditLivestockOwnerDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import { liveStockService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";

const props = defineProps({
  catalog: { type: String, required: true },
  filters: { type: Object, default: () => ({ query: "" }) },
});

/* ------------------ State ------------------ */
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

const createDialog = ref(false);
const selectedItem = ref<any | null>(null);
const confirmationDialog = ref(false);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

/* ------------------ Headers Dinámicos ------------------ */
const headers = computed(() => {
  if (props.catalog === "livestock-owner") {
    return [
      { title: "Propietario" }, // Mostraremos Nombre + Apellido
      { title: "Empresa" },
      { title: "Acciones", align: "center" },
    ];
  }
  return [
    { title: "Nombre" },
    { title: "Acciones", align: "center" },
  ];
});

const actionMenu = [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

/* ------------------ Core Logic: Server Side Pagination ------------------ */

const getItems = async () => {
  try {
    loading.value = true;

    const params = {
      page: page.value,
      limit: config.value.itemsPerPage,
      search: props.filters?.query || ""
    };

    const response = await liveStockService.getItems(props.catalog, params);
    const resBody = response.data;

    /**
     * ADAPTACIÓN DE RESPUESTA SEGÚN EL JSON PROPORCIONADO
     * Para livestock-owner: resBody.data es [ { firstName, lastName, ... } ]
     * Para otros: resBody.data suele ser { data: [], total: X }
     */
    if (resBody.data && resBody.data.data) {
      // Caso paginado estándar
      tableData.value = resBody.data.data;
      config.value.noOfItems = resBody.data.total || 0;
    } else if (Array.isArray(resBody.data)) {
      // Caso livestock-owner (Array directo en data)
      tableData.value = resBody.data;
      config.value.noOfItems = resBody.data.length;
    } else {
      tableData.value = [];
      config.value.noOfItems = 0;
    }

    config.value.page = page.value;

  } catch (error) {
    console.error("Error cargando catálogo:", error);
    showErrorAlert("No se pudo conectar con el catálogo");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Watchers ------------------ */
watch(page, () => getItems());
watch(() => props.catalog, () => { page.value = 1; getItems(); });
watch(() => props.filters?.query, () => { page.value = 1; getItems(); });
watch(() => config.value.itemsPerPage, () => { page.value = 1; getItems(); });

/* ------------------ Actions ------------------ */
const onSelectAction = (option: string, data: any) => {
  if (option === "edit") {
    selectedItem.value = data; 
    createDialog.value = true;
  } else if (option === "delete") {
    itemToDelete.value = data;
    confirmationDialog.value = true;
  }
};
const confirmDelete = async () => {
  try {
    deleting.value = true;
    await liveStockService.deleteItem(props.catalog, itemToDelete.value?.id);
    showSuccessAlert("Registro eliminado");
    getItems();
  } catch (error: any) {
    // Si el error es por registros asociados (Constraint error)
    const errorMsg = error.response?.data?.message || "";
    if (errorMsg.toLowerCase().includes("foreign") || error.response?.status === 409 || error.response?.status === 400) {
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
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in tableData" :key="item.id">

            <template v-if="catalog === 'livestock-owner'">
              <td>{{ item.firstName }} {{ item.lastName }}</td>
              <td>{{ item.company?.name || 'N/A' }}</td>
            </template>

            <template v-else>
              <td>{{ item.name }}</td>
            </template>

            <td class="text-center">
              <ListMenuWithIcon :menuItems="actionMenu" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>
        </template>
      </Table>

      <div v-if="!loading && tableData.length === 0" class="text-center pa-7">
        <v-avatar color="primary" variant="tonal" size="x-large">
          <i class="ph-magnifying-glass ph-lg"></i>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold mt-2">¡No se encontraron resultados!</div>
      </div>

      <div style="width: 100px;" class="mt-4 mx-auto">
        <v-select label="Por página" :items="[10, 25, 50]" v-model="config.itemsPerPage" variant="underlined" density="compact"
          hide-details />
      </div>
    </v-card-text>
  </v-card>

  <CreateEditLivestockDialog v-if="createDialog && catalog !== 'livestock-owner'" v-model="createDialog"
    :item="selectedItem" :catalog="props.catalog" @refresh="getItems" />

  <CreateEditLivestockOwnerDialog v-if="createDialog && catalog === 'livestock-owner'" v-model="createDialog"
    :item="selectedItem" @refresh="getItems" />

  <RemoveItemConfirmationDialog v-model="confirmationDialog" :loading="deleting" @onConfirm="confirmDelete" />
</template>