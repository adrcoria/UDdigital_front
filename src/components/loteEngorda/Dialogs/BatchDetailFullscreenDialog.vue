<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import { batchService, batchBovineService, weightService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  batch: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

/* ------------------ Estado ------------------ */
const loading = ref(false);
const localBatch = ref<any>(null);
const search = ref("");
const removing = ref(false);
const confirmDeleteDialog = ref(false);

// Paginación Tabla Principal (Animales)
const page = ref(1);
const config = ref({ page: 1, noOfItems: 0, itemsPerPage: 10 });

// Selección Múltiple
const selectedIds = ref<string[]>([]);

// Estado Ganancia de Peso (Historial Paginado)
const expandedRows = ref<string[]>([]);
const weightHistory = ref<Record<string, any[]>>({});
const loadingHistory = ref<Record<string, boolean>>({});
const historyPages = ref<Record<string, number>>({}); // Controla la página de historial por animal
const newWeights = ref<Record<string, number | null>>({});
const weightDates = ref<Record<string, string>>({});
const savingWeight = ref<Record<string, boolean>>({});
const weightErrors = ref<Record<string, string>>({});

/* ------------------ Carga de Datos ------------------ */
const loadBatchDetail = async () => {
  if (!props.batch?.id) return;
  try {
    loading.value = true;
    const params = { page: page.value, limit: config.value.itemsPerPage };
    const res = await batchService.getBatchById(props.batch.id, params);
    localBatch.value = res.data.data;
    config.value.noOfItems = localBatch.value.bovineCount || 0;
    selectedIds.value = [];
  } catch (error) {
    showErrorAlert("No se pudo obtener el detalle");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Lógica de Peso ------------------ */
const toggleWeightHistory = async (bovineId: string) => {
  if (expandedRows.value.includes(bovineId)) {
    expandedRows.value = expandedRows.value.filter(id => id !== bovineId);
  } else {
    expandedRows.value.push(bovineId);
    historyPages.value[bovineId] = 1; // Reset a página 1 al abrir
    if (!weightDates.value[bovineId]) {
      weightDates.value[bovineId] = new Date().toISOString().substr(0, 10);
    }
    await loadWeightHistory(bovineId);
  }
};

const loadWeightHistory = async (bovineId: string) => {
  try {
    loadingHistory.value[bovineId] = true;
    const currentPage = historyPages.value[bovineId] || 1;

    // Llamada al servicio con paginación explícita
    const res = await weightService.getHistoryByBovine(bovineId, currentPage, 5);

    // Si la respuesta es res.data.data (array), lo asignamos
    weightHistory.value[bovineId] = res.data?.data || [];
  } catch (error) {
    console.error("Error historial:", error);
  } finally {
    loadingHistory.value[bovineId] = false;
  }
};

const saveWeight = async (bovineId: string) => {
  const weight = newWeights.value[bovineId];
  const date = weightDates.value[bovineId];
  if (!weight || weight <= 0) {
    weightErrors.value[bovineId] = "Ingresa un peso válido antes de guardar";
    return;
  }
  weightErrors.value[bovineId] = "";

  try {
    savingWeight.value[bovineId] = true;
    const payload = {
      weight,
      bovineId: bovineId,
      registerDate: date ? new Date(date).toISOString() : new Date().toISOString()
    };
    await weightService.createWeightLog(payload);
    showSuccessAlert("Peso registrado");
    newWeights.value[bovineId] = null;
    historyPages.value[bovineId] = 1; // Volver a p1 para ver el nuevo
    await loadWeightHistory(bovineId);
  } catch (error) {
    showErrorAlert("No se pudo registrar");
  } finally {
    savingWeight.value[bovineId] = false;
  }
};

const deleteLog = async (logId: string, bovineId: string) => {
  try {
    await weightService.deleteWeightLog(logId);
    showSuccessAlert("Eliminado");
    await loadWeightHistory(bovineId);
  } catch (error) {
    showErrorAlert("No se pudo eliminar");
  }
};

/* ------------------ Acciones de Lote ------------------ */
const confirmRemoveBovines = async () => {
  try {
    removing.value = true;
    await batchBovineService.removeBovineFromBatch(localBatch.value.id, { idBovines: selectedIds.value });
    showSuccessAlert("Removidos con éxito");
    confirmDeleteDialog.value = false;
    selectedIds.value = [];
    await loadBatchDetail();
    emit("refresh");
  } catch (error) {
    showErrorAlert("Error al remover");
  } finally {
    removing.value = false;
  }
};

const toggleSelectAll = () => {
  // Comparamos contra filteredBovines que son los que están visibles en la tabla
  if (selectedIds.value.length === filteredBovines.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = filteredBovines.value.map(b => b.id);
  }
};

watch(page, loadBatchDetail);
onMounted(() => { if (props.modelValue) loadBatchDetail(); });

const headers = [
  { title: "Selección", width: "50px", align: "center" },
  { title: "Historial", width: "50px", align: "center" },
  { title: "Arete Interno" },
  { title: "Nombre" },
  { title: "Siniiga" },
  { title: "Estatus" },
  { title: "Acciones", align: "center" }
];

const filteredBovines = computed(() => {
  const q = search.value.toLowerCase().trim();
  const list = localBatch.value?.bovines || [];
  return q ? list.filter((b: any) => b.internalEarTag?.toLowerCase().includes(q) || b.name?.toLowerCase().includes(q)) : list;
});
</script>

<template>
  <v-dialog :model-value="modelValue" fullscreen persistent transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <v-toolbar color="primary" flat class="px-2">
        <v-btn icon="ph-x" @click="emit('update:modelValue', false)" />
        <v-toolbar-title class="font-weight-bold">Lote: {{ localBatch?.name }}</v-toolbar-title>
        <v-spacer />
        <v-btn v-if="selectedIds.length > 0" color="error" variant="flat" prepend-icon="ph-trash" class="mr-4 px-6"
          @click="confirmDeleteDialog = true">
          Remover ({{ selectedIds.length }})
        </v-btn>

      </v-toolbar>

      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12" md="3">
            <v-card border flat class="rounded-lg pa-4">
              <div class="text-overline mb-2 text-primary">Resumen del Lote</div>
              <div class="text-h6 font-weight-bold text-uppercase">{{ localBatch?.name }}</div>
              <v-divider class="my-3" />
              <div class="text-caption text-grey">Compañía</div>
              <div class="font-weight-bold">{{ localBatch?.company?.name }}</div>
            </v-card>
          </v-col>

          <v-col cols="12" md="9">
            <v-card border flat class="rounded-lg">
              <v-card-title class="pa-4 bg-white d-flex align-center">
                <v-text-field v-model="search" label="Buscar por nombre o arete interno..." variant="outlined"
                  density="compact" hide-details prepend-inner-icon="ph-magnifying-glass" class="flex-grow-1" />

                <v-btn variant="text" size="small" class="ml-4 font-weight-bold" color="primary"
                  prepend-icon="ph-check-square" @click="toggleSelectAll">
                  {{ selectedIds.length === filteredBovines.length ? 'Desmarcar página' : 'Seleccionar todos' }}
                </v-btn>
              </v-card-title>
              <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
                <template #body>
                  <template v-for="bov in filteredBovines" :key="bov.id">
                    <tr
                      :class="selectedIds.includes(bov.id) ? 'bg-red-lighten-5' : (expandedRows.includes(bov.id) ? 'bg-blue-lighten-5' : '')">
                      <td class="text-center"><v-checkbox-btn v-model="selectedIds" :value="bov.id" color="error" />
                      </td>
                      <td class="text-center">
                        <v-btn icon variant="text" size="small" @click="toggleWeightHistory(bov.id)">
                          <v-icon :color="expandedRows.includes(bov.id) ? 'primary' : ''">{{
                            expandedRows.includes(bov.id) ? 'ph-caret-up-bold' : 'ph-caret-down-bold' }}</v-icon>
                        </v-btn>
                      </td>
                      <td><span class="text-h6 font-weight-black text-primary">{{ bov.internalEarTag }}</span></td>
                      <td class="text-uppercase font-weight-medium">{{ bov.name }}</td>
                      <td>{{ bov.siniigaEarTag }}</td>
                      <td><v-chip size="x-small" color="success" label>{{ bov.bovineStatus }}</v-chip></td>
                      <td class="text-center">
                        <v-btn icon="ph-trash" size="small" variant="text" color="error"
                          @click="selectedIds = [bov.id]; confirmDeleteDialog = true" />
                      </td>
                    </tr>

                    <tr v-if="expandedRows.includes(bov.id)" class="bg-grey-lighten-5">
                      <td colspan="7" class="pa-4 border-b">
                        <v-row>
                          <v-col cols="12" md="5" class="border-e pr-6">
                            <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center text-primary"><v-icon
                                class="mr-2">ph-scales</v-icon> Capturar Peso</div>
                            <v-text-field v-model="weightDates[bov.id]" type="date" variant="outlined"
                              density="comfortable" class="mb-2" />
                            <v-text-field v-model.number="newWeights[bov.id]" label="kg" type="number"
                              variant="outlined" density="comfortable"
                              :error-messages="weightErrors[bov.id]"
                              @update:model-value="weightErrors[bov.id] = ''"
                              >
                              <template #append><v-btn color="primary" icon="ph-floppy-disk" variant="flat"
                                  :loading="savingWeight[bov.id]" @click="saveWeight(bov.id)" /></template>
                            </v-text-field>
                          </v-col>
                          <v-col cols="12" md="7" class="pl-6">
                            <div class="d-flex justify-space-between align-center mb-2">
                              <span class="text-subtitle-2 font-weight-bold">Historial (Página {{ historyPages[bov.id]
                                }})</span>
                              <div>
                                <v-btn icon="ph-arrow-left" size="x-small" variant="text"
                                  :disabled="historyPages[bov.id] <= 1"
                                  @click="historyPages[bov.id]--; loadWeightHistory(bov.id)" />
                                <v-btn icon="ph-arrow-right" size="x-small" variant="text"
                                  @click="historyPages[bov.id]++; loadWeightHistory(bov.id)" />
                              </div>
                            </div>
                            <v-table density="compact" class="bg-transparent">
                              <thead>
                                <tr>
                                  <th>FECHA</th>
                                  <th class="text-center">Ultimo peso registrado</th>
                                  <th class="text-center">GDP (KG)</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="(log, i) in weightHistory[bov.id]" :key="log.id">
                                  <td class="text-caption">{{ log.registerDate ? new
                                    Date(log.registerDate).toLocaleDateString() : new
                                    Date(log.createdAt).toLocaleDateString() }}</td>
                                  <td class="font-weight-bold text-center">{{ log.weight }} KG</td>
                                  <td class="text-center">
                                    <v-chip v-if="i < weightHistory[bov.id].length - 1" color="success" size="x-small"
                                      variant="tonal" class="font-weight-black">
                                      +{{ (parseFloat(log.weight) -
                                        parseFloat(weightHistory[bov.id][i+1].weight)).toFixed(2) }} KG
                                    </v-chip>
                                  </td>
                                  <td class="text-right"><v-btn icon="ph-trash" size="x-small" variant="text"
                                      color="error" @click="deleteLog(log.id, bov.id)" /></td>
                                </tr>
                              </tbody>
                            </v-table>
                          </v-col>
                        </v-row>
                      </td>
                    </tr>
                  </template>
                </template>
              </Table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <RemoveItemConfirmationDialog v-model="confirmDeleteDialog" :loading="removing" title="Remover"
      :message="`¿Quitar seleccionados?`" @onConfirm="confirmRemoveBovines" />
  </v-dialog>
</template>