<script lang="ts" setup>
import { ref, watch, onMounted, computed, nextTick } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import BovineDetailsDialog from "./Dialogs/BovineDetailsDialog.vue";
import BovinePhotosDialog from "./Dialogs/BovinePhotosDialog.vue"; // Nuevo Componente
import CreateEditBovineDialog from "./Dialogs/CreateEditBovineDialog.vue";
import PregnancyManagementDialog from "./Dialogs/PregnancyManagementDialog.vue"
import HeatManagementDialog from "./Dialogs/HeatManagementDialog.vue"
import BirthManagementDialog from "./Dialogs/BirthManagementDialog.vue"
import { bovineService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";

const props = defineProps({
  filters: { type: Object, default: () => ({ query: "" }) },
});

/* ------------------ State ------------------ */
const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const expandedRows = ref<string[]>([]);

const config = ref({
  page: 1,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 10,
});

const createEditDialog = ref(false);
const bovineDetailsDialog = ref(false);
const bovinePhotosDialog = ref(false); // Estado para el modal de fotos
const selectedItem = ref<any | null>(null);
const confirmationDialog = ref(false);
const itemToDelete = ref<any | null>(null);
const pregnancyDialog = ref(false);
const heatDialog = ref(false);
const birthDialog = ref(false);

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



/* ------------------ Logic ------------------ */

const formatRaces = (raceAssignments: any[]) => {
  if (!raceAssignments || raceAssignments.length === 0) return 'N/A';
  return raceAssignments
    .map(ra => ra.bovineRace?.name || 'S/R')
    .join(', ');
};
const getActionMenu = (item: any) => {
  const menu: any[] = [
    { title: "Ficha de vida", icon: "ph-file-text", value: "view" },
    { title: "Gestionar Fotos", icon: "ph-camera", value: "photos" },
    { title: "Editar datos", icon: "ph-pencil", value: "edit" },
  ];

  // Restricción: Solo hembras ven opciones reproductivas
  if (item.sex?.name === 'HEMBRA') {
    menu.push(
      { title: "Registrar Celo", icon: "ph-thermometer-hot", value: "heat" },
      { title: "Registrar Preñez", icon: "ph-baby", value: "pregnancy" },
      { title: "Registrar Parto", icon: "ph-baby-carriage", value: "birth" }
    );
  }

  menu.push({ title: "Eliminar", icon: "ph-trash", value: "delete" });

  return menu;
};

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

const onSelectAction = async (option: string, item: any) => {
  selectedItem.value = item;
  if (option === "view") {
    bovineDetailsDialog.value = true;
  } else if (option === "photos") {
    bovinePhotosDialog.value = true;
  } else if (option === "edit") {
    createEditDialog.value = true;
  } else if (option === "delete") {
    itemToDelete.value = item;
    confirmationDialog.value = true;
  } else if (option === "pregnancy") {
    pregnancyDialog.value = false;
    await nextTick();
    pregnancyDialog.value = true;
  } else if (option === "heat") {
    heatDialog.value = false;
    await nextTick();
    heatDialog.value = true;
  } else if (option === "birth") {
    birthDialog.value = false;
    await nextTick();
    birthDialog.value = true;
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
        <v-icon icon="ph-plus-circle" class="mr-2" /> Registrar Bovino
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-0">
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <template v-for="item in tableData" :key="item.id">
            <tr :class="{ 'bg-blue-grey-lighten-5': expandedRows.includes(item.id) }">
              <td>
                <v-btn variant="text" :icon="expandedRows.includes(item.id) ? 'ph-caret-up' : 'ph-caret-down'"
                  size="small" @click="toggleExpand(item.id)" />
              </td>
              <td>
                <div class="font-weight-bold">{{ item.siniigaEarTag || 'SIN ARETE' }}</div>
                <div class="text-caption text-grey">{{ item.internalEarTag || 'S/N Interno' }}</div>
              </td>
              <td>{{ item.name || 'Sin nombre' }}</td>
              <td>
                <v-chip size="x-small" variant="tonal" :color="item.sex?.name === 'MACHO' ? 'blue' : 'pink'">
                  {{ item.sex?.name || 'N/A' }}
                </v-chip>
              </td>

              <td class="text-caption">
                {{ formatRaces(item.raceAssignments) }}
              </td>

              <td>
                <v-chip size="x-small" :color="item.bovineStatus === 'VIVO' ? 'success' : 'error'" variant="flat">
                  {{ item.bovineStatus }}
                </v-chip>
              </td>
              <td class="text-center">
                <ListMenuWithIcon icon="ph-dots-three-vertical ph-lg" variant="text" :color="undefined" :menuItems="getActionMenu(item)" @onSelect="onSelectAction($event, item)" />
              </td>
            </tr>

            <tr v-if="expandedRows.includes(item.id)">
              <td colspan="7" class="pa-0">
                <v-expand-transition>
                  <div class="pa-5 bg-grey-lighten-5 border-b">
                    <v-row>
                      <v-col cols="12" md="3">
                        <div class="d-flex align-center mb-2">
                          <v-icon size="18" color="primary" class="mr-2">ph-tree-structure</v-icon>
                          <span class="text-subtitle-2 font-weight-bold">Genealogía</span>
                        </div>
                        <div class="pl-7">
                          <div class="text-caption text-grey">Padre</div>
                          <div class="text-body-2 mb-1">{{ item.father?.name || 'No registrado' }}</div>
                          <div class="text-caption text-grey">Madre</div>
                          <div class="text-body-2">{{ item.mother?.name || 'No registrado' }}</div>
                        </div>
                      </v-col>
                      <v-col cols="12" md="3">
                        <div class="d-flex align-center mb-2">
                          <v-icon size="18" color="primary" class="mr-2">ph-calendar-check</v-icon>
                          <span class="text-subtitle-2 font-weight-bold">Tiempos y Tipo</span>
                        </div>
                        <div class="pl-7">
                          <div class="text-caption text-grey">Nacimiento / Ingreso</div>
                          <div class="text-body-2 mb-1">{{ item.birthDate }} / {{ item.dateAddedToHerd }}</div>
                          <div class="text-caption text-grey">Tipo y Propósito</div>
                          <div class="text-body-2">{{ item.bovineType?.name || 'S/T' }} - {{ item.bovinePurpose?.name ||
                            'S/P' }}</div>
                          <div class="text-caption text-grey">Origen</div>
                          <div class="text-body-2">{{ item.bovineOrigin?.name || 'N/A' }}</div>
                        </div>
                      </v-col>

                      <v-col cols="12" md="3">
                        <div class="d-flex align-center mb-2">
                          <v-icon size="18" color="primary" class="mr-2">ph-scales</v-icon>
                          <span class="text-subtitle-2 font-weight-bold">Desarrollo (kg)</span>
                        </div>
                        <div class="pl-7">
                          <div class="text-caption text-grey">Peso Inicial</div>
                          <div class="text-body-2 mb-1">{{ item.birthWeight }} kg</div>
                          <div class="text-caption text-grey">Peso Neto Actual</div>
                          <div class="text-body-2 font-weight-bold text-primary">{{ item.netWeight }} kg</div>
                          <div class="text-caption text-grey">Días Abiertos</div>
                          <div class="text-body-2">{{ item.daysOpen }} días</div>
                        </div>
                      </v-col>

                      <v-col cols="12" md="3">
                        <div class="d-flex align-center mb-2">
                          <v-icon size="18" color="primary" class="mr-2">ph-currency-dollar</v-icon>
                          <span class="text-subtitle-2 font-weight-bold">Valores</span>
                        </div>
                        <div class="pl-7">
                          <div class="text-caption text-grey">Valor Compra</div>
                          <div class="text-body-2 mb-1">${{ item.purchaseValue || '0.00' }}</div>
                          <div class="text-caption text-grey">Valor Venta Sugerido</div>
                          <div class="text-body-2 text-success font-weight-bold">${{ item.saleValue || '0.00' }}</div>
                        </div>
                      </v-col>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <v-row dense align="center">
                      <v-col cols="12" md="4">
                        <div class="text-caption font-weight-bold text-grey mb-1">Responsable / Dueño</div>
                        <div class="d-flex align-center">
                          <v-avatar size="36" color="primary" variant="tonal" class="mr-3">
                            <span class="text-caption font-weight-bold">{{ item.livestockOwner?.firstName?.charAt(0)
                            }}{{ item.livestockOwner?.lastName?.charAt(0) }}</span>
                          </v-avatar>
                          <div>
                            <div class="text-body-2 font-weight-bold">{{ item.livestockOwner?.firstName }} {{
                              item.livestockOwner?.lastName }}</div>
                            <div class="text-caption text-primary">{{ item.company?.name }}</div>
                          </div>
                        </div>
                      </v-col>
                      <v-col cols="12" md="4">
                        <div class="text-caption font-weight-bold text-grey mb-1">Notas y Observaciones</div>
                        <div class="text-body-2 text-italic">{{ item.notes || 'Sin observaciones registradas.' }}</div>
                      </v-col>
                      <v-col cols="12" md="4" v-if="item.bovineStatus === 'MUERTO'">
                        <v-alert density="compact" color="error" variant="tonal" icon="ph-skull">
                          <div class="text-caption font-weight-bold">Defunción</div>
                          <div class="text-body-2">Fecha: {{ item.deathDate || 'N/A' }}</div>
                          <div class="text-caption mt-1">{{ item.deathComments || 'Sin comentarios.' }}</div>
                        </v-alert>
                      </v-col>
                    </v-row>
                  </div>
                </v-expand-transition>
              </td>
            </tr>
          </template>

          <tr v-if="!loading && tableData.length === 0">
            <td colspan="7" class="text-center py-12">
              <v-avatar color="grey-lighten-4" size="70" class="mb-3">
                <v-icon size="35" color="grey-lighten-1">ph-magnifying-glass</v-icon>
              </v-avatar>
              <div class="text-grey-darken-1 font-weight-bold">No se encontraron bovinos</div>
            </td>
          </tr>
        </template>
      </Table>

      <div class="pa-4 border-t bg-grey-lighten-5">
        <v-row align="center" no-gutters>
          <v-col cols="auto">
            <div class="d-flex align-center">
              <span class="text-caption mr-3">Registros por página:</span>
              <v-select v-model="config.itemsPerPage" :items="[10, 25, 50]" variant="outlined" density="compact"
                hide-details style="width: 80px" />
            </div>
          </v-col>
          <v-spacer />
          <v-col cols="auto">
            <span class="text-caption text-grey">Total: {{ config.noOfItems }} registros</span>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>

  <BovineDetailsDialog v-if="bovineDetailsDialog" v-model="bovineDetailsDialog" :item="selectedItem" />

  <BovinePhotosDialog v-if="bovinePhotosDialog" v-model="bovinePhotosDialog" :item="selectedItem" @refresh="getItems" />

  <CreateEditBovineDialog v-if="createEditDialog" v-model="createEditDialog" :item="selectedItem" @refresh="getItems" />

  <PregnancyManagementDialog v-if="pregnancyDialog" v-model="pregnancyDialog" :bovine="selectedItem"
    @refresh="getItems" />

  <HeatManagementDialog v-if="heatDialog" v-model="heatDialog" :bovine="selectedItem"
    @refresh="getItems" />

  <BirthManagementDialog v-if="birthDialog" v-model="birthDialog" :bovine="selectedItem"
    @refresh="getItems" />

  <RemoveItemConfirmationDialog v-model="confirmationDialog" :loading="deleting" @onConfirm="confirmDelete" />
</template>

<style scoped>
.v-table tbody tr:hover {
  background-color: #f8fafc !important;
  cursor: pointer;
}
</style>