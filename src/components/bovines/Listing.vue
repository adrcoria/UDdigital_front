<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditBovineDialog from "./Dialogs/CreateEditBovineDialog.vue";
import { bovineService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";

const props = defineProps({
  filters: { type: Object, default: () => ({ query: "" }) },
});

/* ------------------ State ------------------ */
const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const expandedRows = ref<string[]>([]); // Control de las filas expandidas

const config = ref({
  page: 1,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 10,
});

const createEditDialog = ref(false);
const selectedItem = ref<any | null>(null);
const confirmationDialog = ref(false);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

const headers = [
  { title: "" }, // Botón expansión
  { title: "Arete (Siniiga/Int)" },
  { title: "Nombre" },
  { title: "Sexo" },
  { title: "Raza" },
  { title: "Estatus" },
  { title: "Acciones", align: "center" },
];

const actionMenu = [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

/* ------------------ Logic ------------------ */

const getItems = async () => {
  try {
    loading.value = true;
    const params = {
      page: page.value,
      limit: config.value.itemsPerPage,
      search: props.filters?.query || ""
    };

    const response = await bovineService.getBovines(params);
    const resData = response.data.data;

    // Según tu JSON: la lista está en resData.list y el total en resData.total
    tableData.value = resData.list || [];
    config.value.noOfItems = resData.total || 0;
    config.value.page = page.value;
  } catch (error) {
    showErrorAlert("Error al cargar el inventario de bovinos");
  } finally {
    loading.value = false;
  }
};

const toggleExpand = (id: string) => {
  const index = expandedRows.value.indexOf(id);
  if (index > -1) expandedRows.value.splice(index, 1);
  else expandedRows.value.push(id);
};

const onSelectAction = (option: string, item: any) => {
  if (option === "edit") {
    selectedItem.value = item;
    createEditDialog.value = true;
  } else if (option === "delete") {
    itemToDelete.value = item;
    confirmationDialog.value = true;
  }
};

const confirmDelete = async () => {
  try {
    deleting.value = true;
    await bovineService.deleteBovine(itemToDelete.value.id);
    showSuccessAlert("Bovino eliminado correctamente");
    getItems();
  } catch (error: any) {
    showErrorAlert("No es posible borrar este registro, existen datos asociados.");
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
    itemToDelete.value = null;
  }
};

/* ------------------ Watchers ------------------ */
watch([page, () => config.value.itemsPerPage, () => props.filters.query], () => {
  getItems();
});

onMounted(getItems);
</script>

<template>
  <v-card elevation="0" border>
    <v-card-title class="pa-4 d-flex justify-space-between align-center">
      <div class="text-subtitle-1 font-weight-bold">Inventario de Bovinos</div>
      <v-btn color="primary" @click="selectedItem = null; createEditDialog = true">
        <i class="ph-plus-circle mr-2"></i> Registrar Bovino
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-0">
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <template v-for="item in tableData" :key="item.id">
            <tr :class="{ 'bg-grey-lighten-4': expandedRows.includes(item.id) }">
              <td>
                <v-btn
                  variant="text"
                  :icon="expandedRows.includes(item.id) ? 'ph-caret-up' : 'ph-caret-down'"
                  size="small"
                  @click="toggleExpand(item.id)"
                />
              </td>
              <td>
                <div class="font-weight-bold">{{ item.siniigaEarTag || 'N/A' }}</div>
                <div class="text-caption text-grey">{{ item.internalEarTag }}</div>
              </td>
              <td>{{ item.name }}</td>
              <td>{{ item.sex?.name || 'N/A' }}</td>
              <td>{{ item.bovineRace?.name || 'N/A' }}</td>
              <td>
                <v-chip size="x-small" :color="item.bovineStatus === 'VIVO' ? 'success' : 'error'">
                  {{ item.bovineStatus }}
                </v-chip>
              </td>
              <td class="text-center">
                <ListMenuWithIcon :menuItems="actionMenu" @onSelect="onSelectAction($event, item)" />
              </td>
            </tr>

            <tr v-if="expandedRows.includes(item.id)">
              <td colspan="7" class="pa-0">
                <v-expand-transition>
                  <div class="pa-4 bg-grey-lighten-5 border-b">
                    <v-row dense>
                      <v-col cols="12" md="3">
                        <div class="text-caption font-weight-bold text-grey">Propietario</div>
                        <div class="text-body-2">{{ item.livestockOwner?.firstName }} {{ item.livestockOwner?.lastName }}</div>
                        <div class="text-caption text-primary">{{ item.livestockOwner?.company?.name }}</div>
                      </v-col>
                      <v-col cols="12" md="3">
                        <div class="text-caption font-weight-bold text-grey">Información Cría</div>
                        <div class="text-body-2">Nacimiento: {{ item.birthDate }}</div>
                        <div class="text-body-2">Peso Nac.: {{ item.birthWeight }} kg</div>
                      </v-col>
                      <v-col cols="12" md="3">
                        <div class="text-caption font-weight-bold text-grey">Valores Mercado</div>
                        <div class="text-body-2">Compra: ${{ item.purchaseValue }}</div>
                        <div class="text-body-2 text-success">Venta: ${{ item.saleValue }}</div>
                      </v-col>
                      <v-col cols="12" md="3">
                        <div class="text-caption font-weight-bold text-grey">Clasificación</div>
                        <div class="text-body-2">Tipo: {{ item.bovineType?.name }}</div>
                        <div class="text-body-2">Origen: {{ item.bovineOrigin?.name }}</div>
                      </v-col>
                      <v-col cols="12" class="mt-2">
                        <div class="text-caption font-weight-bold text-grey">Notas</div>
                        <p class="text-body-2 mb-0">{{ item.notes || 'Sin observaciones.' }}</p>
                      </v-col>
                    </v-row>
                  </div>
                </v-expand-transition>
              </td>
            </tr>
          </template>

          <tr v-if="!loading && tableData.length === 0">
            <td colspan="7" class="text-center py-10">
              <v-icon size="40" color="grey">ph-magnifying-glass</v-icon>
              <div class="text-grey">No se encontraron registros de bovinos.</div>
            </td>
          </tr>
        </template>
      </Table>

      <div class="pa-4 pt-0">
        <v-row align="center">
          <v-col cols="auto">
            <v-select 
              v-model="config.itemsPerPage" 
              :items="[10, 25, 50]" 
              label="Ver" 
              variant="underlined" 
              density="compact" 
              hide-details 
            />
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>

  <CreateEditBovineDialog 
    v-if="createEditDialog" 
    v-model="createEditDialog" 
    :item="selectedItem" 
    @refresh="getItems" 
  />

  <RemoveItemConfirmationDialog 
    v-model="confirmationDialog" 
    :loading="deleting" 
    @onConfirm="confirmDelete" 
  />
</template>

<style scoped>
.v-table tbody tr:hover {
  background-color: #fafafa;
}
</style>