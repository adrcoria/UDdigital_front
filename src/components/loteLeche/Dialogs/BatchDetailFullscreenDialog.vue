<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import { batchService, batchBovineService, milkProductionService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  batch: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

/* ------------------ Estado General ------------------ */
const loading = ref(false);
const localBatch = ref<any>(null);
const search = ref("");
const removing = ref(false);
const confirmDeleteDialog = ref(false);

// Paginación tabla principal
const page = ref(1);
const config = ref({ page: 1, noOfItems: 0, itemsPerPage: 10 });

// Selección múltiple para remover
const selectedIds = ref<string[]>([]);

/* ------------------ Estado Producción de Leche ------------------ */
const expandedRows = ref<string[]>([]);
const milkHistory = ref<Record<string, any[]>>({});
const loadingHistory = ref<Record<string, boolean>>({});
const historyPages = ref<Record<string, number>>({});

// Captura de nuevo registro
const newAmounts = ref<Record<string, number | null>>({});
const milkDates = ref<Record<string, string>>({});
const savingMilk = ref<Record<string, boolean>>({});
const milkErrors = ref<Record<string, string>>({});

// Edición inline de un registro existente
const editingLog = ref<Record<string, any | null>>({});
const editAmount = ref<Record<string, number | null>>({});
const editDate = ref<Record<string, string>>({});
const savingEdit = ref<Record<string, boolean>>({});

/* ------------------ Carga de Datos ------------------ */
const loadBatchDetail = async () => {
  if (!props.batch?.id) return;
  try {
    loading.value = true;
    const res = await batchService.getBatchById(props.batch.id);
    localBatch.value = res.data.data;
    config.value.noOfItems = localBatch.value.bovineCount || 0;
    selectedIds.value = [];
  } catch {
    showErrorAlert("No se pudo obtener el detalle");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Historial de Leche ------------------ */
const toggleMilkHistory = async (bovineId: string) => {
  if (expandedRows.value.includes(bovineId)) {
    expandedRows.value = expandedRows.value.filter((id) => id !== bovineId);
  } else {
    expandedRows.value.push(bovineId);
    historyPages.value[bovineId] = 1;
    if (!milkDates.value[bovineId]) {
      milkDates.value[bovineId] = new Date().toISOString().substring(0, 10);
    }
    await loadMilkHistory(bovineId);
  }
};

const loadMilkHistory = async (bovineId: string) => {
  try {
    loadingHistory.value[bovineId] = true;
    const currentPage = historyPages.value[bovineId] || 1;
    const res = await milkProductionService.getHistoryByBovine(bovineId, currentPage, 5);
    milkHistory.value[bovineId] = res.data?.data || [];
  } catch {
    console.error("Error al cargar historial de leche");
  } finally {
    loadingHistory.value[bovineId] = false;
  }
};

/* ------------------ Guardar Nuevo Registro ------------------ */
const saveMilk = async (bovineId: string) => {
  const amount = newAmounts.value[bovineId];
  const date = milkDates.value[bovineId];
  if (!amount || amount <= 0) {
    milkErrors.value[bovineId] = "Ingresa una cantidad válida antes de guardar";
    return;
  }
  milkErrors.value[bovineId] = "";

  try {
    savingMilk.value[bovineId] = true;
    await milkProductionService.createLog({
      bovineId,
      amount,
      registerDate: date ? new Date(date).toISOString() : new Date().toISOString(),
    });
    showSuccessAlert("Producción registrada");
    newAmounts.value[bovineId] = null;
    historyPages.value[bovineId] = 1;
    await loadMilkHistory(bovineId);
  } catch {
    showErrorAlert("No se pudo registrar la producción");
  } finally {
    savingMilk.value[bovineId] = false;
  }
};

/* ------------------ Editar Registro Existente ------------------ */
const startEdit = (bovineId: string, log: any) => {
  editingLog.value[bovineId] = log.id;
  editAmount.value[bovineId] = parseFloat(log.amount);
  editDate.value[bovineId] = log.registerDate?.substring(0, 10) || "";
};

const cancelEdit = (bovineId: string) => {
  editingLog.value[bovineId] = null;
};

const saveEdit = async (bovineId: string) => {
  const logId = editingLog.value[bovineId];
  const amount = editAmount.value[bovineId];
  const date = editDate.value[bovineId];
  if (!amount || amount <= 0) return;

  try {
    savingEdit.value[bovineId] = true;
    await milkProductionService.updateLog(logId, {
      amount,
      registerDate: date ? new Date(date).toISOString() : new Date().toISOString(),
    });
    showSuccessAlert("Registro actualizado");
    editingLog.value[bovineId] = null;
    await loadMilkHistory(bovineId);
  } catch {
    showErrorAlert("No se pudo actualizar el registro");
  } finally {
    savingEdit.value[bovineId] = false;
  }
};

/* ------------------ Eliminar Registro ------------------ */
const deleteLog = async (logId: string, bovineId: string) => {
  try {
    await milkProductionService.deleteLog(logId);
    showSuccessAlert("Registro eliminado");
    await loadMilkHistory(bovineId);
  } catch {
    showErrorAlert("No se pudo eliminar");
  }
};

/* ------------------ Remover Animales del Lote ------------------ */
const confirmRemoveBovines = async () => {
  try {
    removing.value = true;
    await batchBovineService.removeBovineFromBatch(localBatch.value.id, { idBovines: selectedIds.value });
    showSuccessAlert("Removidos con éxito");
    confirmDeleteDialog.value = false;
    selectedIds.value = [];
    await loadBatchDetail();
    emit("refresh");
  } catch {
    showErrorAlert("Error al remover");
  } finally {
    removing.value = false;
  }
};

const toggleSelectAll = () => {
  if (selectedIds.value.length === filteredBovines.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = filteredBovines.value.map((b) => b.id);
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
  { title: "Acciones", align: "center" },
];

const filteredBovines = computed(() => {
  const q = search.value.toLowerCase().trim();
  const list = localBatch.value?.bovines || [];
  return q
    ? list.filter((b: any) => b.internalEarTag?.toLowerCase().includes(q) || b.name?.toLowerCase().includes(q))
    : list;
});
</script>

<template>
  <v-dialog :model-value="modelValue" fullscreen persistent transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">

      <!-- Toolbar -->
      <v-toolbar color="blue-darken-2" flat class="px-2">
        <v-btn icon="ph-x" @click="emit('update:modelValue', false)" />
        <v-toolbar-title class="font-weight-bold">
          <v-icon class="mr-2">ph-drop</v-icon>
          Lote: {{ localBatch?.name }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          v-if="selectedIds.length > 0"
          color="error"
          variant="flat"
          prepend-icon="ph-trash"
          class="mr-4 px-6"
          @click="confirmDeleteDialog = true"
        >
          Remover ({{ selectedIds.length }})
        </v-btn>
      </v-toolbar>

      <v-container fluid class="pa-6">
        <v-row>

          <!-- Panel Resumen -->
          <v-col cols="12" md="3">
            <v-card border flat class="rounded-lg pa-4">
              <div class="text-overline mb-2 text-blue-darken-2">Resumen del Lote</div>
              <div class="text-h6 font-weight-bold text-uppercase">{{ localBatch?.name }}</div>
              <v-divider class="my-3" />
              <div class="text-caption text-grey">Compañía</div>
              <div class="font-weight-bold mb-3">{{ localBatch?.company?.name }}</div>
              <v-divider class="my-3" />
              <div class="text-caption text-grey">Total de animales</div>
              <div class="text-h5 font-weight-black text-blue-darken-2">{{ localBatch?.bovineCount || 0 }}</div>
              <div class="text-caption text-grey mt-1">cabezas en el lote</div>
            </v-card>
          </v-col>

          <!-- Tabla de Animales -->
          <v-col cols="12" md="9">
            <v-card border flat class="rounded-lg">
              <v-card-title class="pa-4 bg-white d-flex align-center">
                <v-text-field
                  v-model="search"
                  label="Buscar por nombre o arete interno..."
                  variant="outlined"
                  density="compact"
                  hide-details
                  prepend-inner-icon="ph-magnifying-glass"
                  class="flex-grow-1"
                />
                <v-btn
                  variant="text"
                  size="small"
                  class="ml-4 font-weight-bold"
                  color="blue-darken-2"
                  prepend-icon="ph-check-square"
                  @click="toggleSelectAll"
                >
                  {{ selectedIds.length === filteredBovines.length ? 'Desmarcar página' : 'Seleccionar todos' }}
                </v-btn>
              </v-card-title>

              <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
                <template #body>
                  <template v-for="bov in filteredBovines" :key="bov.id">

                    <!-- Fila principal del animal -->
                    <tr :class="selectedIds.includes(bov.id) ? 'bg-red-lighten-5' : (expandedRows.includes(bov.id) ? 'bg-blue-lighten-5' : '')">
                      <td class="text-center">
                        <v-checkbox-btn v-model="selectedIds" :value="bov.id" color="error" />
                      </td>
                      <td class="text-center">
                        <v-btn icon variant="text" size="small" @click="toggleMilkHistory(bov.id)">
                          <v-icon :color="expandedRows.includes(bov.id) ? 'blue-darken-2' : ''">
                            {{ expandedRows.includes(bov.id) ? 'ph-caret-up-bold' : 'ph-caret-down-bold' }}
                          </v-icon>
                        </v-btn>
                      </td>
                      <td><span class="text-h6 font-weight-black text-blue-darken-2">{{ bov.internalEarTag }}</span></td>
                      <td class="text-uppercase font-weight-medium">{{ bov.name }}</td>
                      <td>{{ bov.siniigaEarTag }}</td>
                      <td><v-chip size="x-small" color="success" label>{{ bov.bovineStatus }}</v-chip></td>
                      <td class="text-center">
                        <v-btn
                          icon="ph-trash"
                          size="small"
                          variant="text"
                          color="error"
                          @click="selectedIds = [bov.id]; confirmDeleteDialog = true"
                        />
                      </td>
                    </tr>

                    <!-- Fila expandida: captura y historial de leche -->
                    <tr v-if="expandedRows.includes(bov.id)" class="bg-grey-lighten-5">
                      <td colspan="7" class="pa-4 border-b">
                        <v-row>

                          <!-- Captura de Producción -->
                          <v-col cols="12" md="5" class="border-e pr-6">
                            <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center text-blue-darken-2">
                              <v-icon class="mr-2">ph-drop</v-icon> Capturar Producción de Leche
                            </div>
                            <v-text-field
                              v-model="milkDates[bov.id]"
                              type="date"
                              label="Fecha de registro"
                              variant="outlined"
                              density="comfortable"
                              class="mb-2"
                            />
                            <v-text-field
                              v-model.number="newAmounts[bov.id]"
                              label="Litros producidos"
                              type="number"
                              variant="outlined"
                              density="comfortable"
                              :error-messages="milkErrors[bov.id]"
                              @update:model-value="milkErrors[bov.id] = ''"
                            >
                              <template #append>
                                <v-btn
                                  color="blue-darken-2"
                                  icon="ph-floppy-disk"
                                  variant="flat"
                                  :loading="savingMilk[bov.id]"
                                  @click="saveMilk(bov.id)"
                                />
                              </template>
                            </v-text-field>
                          </v-col>

                          <!-- Historial de Producción -->
                          <v-col cols="12" md="7" class="pl-6">
                            <div class="d-flex justify-space-between align-center mb-2">
                              <span class="text-subtitle-2 font-weight-bold">
                                Historial (Página {{ historyPages[bov.id] }})
                              </span>
                              <div>
                                <v-btn
                                  icon="ph-arrow-left"
                                  size="x-small"
                                  variant="text"
                                  :disabled="historyPages[bov.id] <= 1"
                                  @click="historyPages[bov.id]--; loadMilkHistory(bov.id)"
                                />
                                <v-btn
                                  icon="ph-arrow-right"
                                  size="x-small"
                                  variant="text"
                                  @click="historyPages[bov.id]++; loadMilkHistory(bov.id)"
                                />
                              </div>
                            </div>

                            <div v-if="loadingHistory[bov.id]" class="text-center py-4">
                              <v-progress-circular indeterminate color="blue-darken-2" size="28" />
                            </div>

                            <v-table v-else density="compact" class="bg-transparent">
                              <thead>
                                <tr>
                                  <th>FECHA</th>
                                  <th class="text-center">LITROS</th>
                                  <th class="text-center">ACCIONES</th>
                                </tr>
                              </thead>
                              <tbody>
                                <!-- Fila en modo edición -->
                                <template v-for="log in milkHistory[bov.id]" :key="log.id">
                                  <tr v-if="editingLog[bov.id] === log.id" class="bg-blue-lighten-5">
                                    <td>
                                      <v-text-field
                                        v-model="editDate[bov.id]"
                                        type="date"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        style="min-width: 140px;"
                                      />
                                    </td>
                                    <td class="text-center">
                                      <v-text-field
                                        v-model.number="editAmount[bov.id]"
                                        type="number"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        style="min-width: 90px;"
                                      />
                                    </td>
                                    <td class="text-center">
                                      <v-btn
                                        icon="ph-floppy-disk"
                                        size="x-small"
                                        variant="flat"
                                        color="blue-darken-2"
                                        :loading="savingEdit[bov.id]"
                                        @click="saveEdit(bov.id)"
                                        class="mr-1"
                                      />
                                      <v-btn
                                        icon="ph-x"
                                        size="x-small"
                                        variant="text"
                                        @click="cancelEdit(bov.id)"
                                      />
                                    </td>
                                  </tr>

                                  <!-- Fila normal -->
                                  <tr v-else>
                                    <td class="text-caption">
                                      {{ log.registerDate
                                        ? new Date(log.registerDate).toLocaleDateString('es-MX')
                                        : new Date(log.createdAt).toLocaleDateString('es-MX') }}
                                    </td>
                                    <td class="font-weight-bold text-center text-blue-darken-2">
                                      {{ parseFloat(log.amount).toFixed(2) }} L
                                    </td>
                                    <td class="text-center">
                                      <v-btn
                                        icon="ph-pencil"
                                        size="x-small"
                                        variant="text"
                                        color="blue-darken-2"
                                        @click="startEdit(bov.id, log)"
                                        class="mr-1"
                                      />
                                      <v-btn
                                        icon="ph-trash"
                                        size="x-small"
                                        variant="text"
                                        color="error"
                                        @click="deleteLog(log.id, bov.id)"
                                      />
                                    </td>
                                  </tr>
                                </template>

                                <tr v-if="!milkHistory[bov.id]?.length">
                                  <td colspan="3" class="text-center py-4 text-grey text-caption">
                                    Sin registros de producción
                                  </td>
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

    <RemoveItemConfirmationDialog
      v-model="confirmDeleteDialog"
      :loading="removing"
      title="Remover animales"
      message="¿Quitar los animales seleccionados del lote?"
      @onConfirm="confirmRemoveBovines"
    />
  </v-dialog>
</template>
