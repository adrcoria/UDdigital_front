<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import { batchService, batchBovineService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ApplyVaccineDialog from "./ApplyVaccineDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  batch: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const loading = ref(false);
const localBatch = ref<any>(null);
const search = ref("");
const removing = ref(false);
const confirmDeleteDialog = ref(false);
const vaccineDialog = ref(false);
const activeTab = ref("pendientes");

const page = ref(1);
const config = ref({ page: 1, start: 0, end: 0, noOfItems: 0, itemsPerPage: 10 });
const selectedIds = ref<string[]>([]);

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

const confirmRemoveBovines = async () => {
  try {
    removing.value = true;
    await batchBovineService.removeBovineFromBatch(localBatch.value.id, { idBovines: selectedIds.value });
    showSuccessAlert("Animales removidos correctamente");
    confirmDeleteDialog.value = false;
    selectedIds.value = [];
    await loadBatchDetail();
    emit("refresh");
  } catch {
    showErrorAlert("Error al remover los animales");
  } finally {
    removing.value = false;
  }
};

// Solo aplica sobre los pendientes
const toggleSelectAll = () => {
  if (selectedIds.value.length === filteredPendientes.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = filteredPendientes.value.map((b: any) => b.id);
  }
};

watch(page, loadBatchDetail);
// Limpiar selección al cambiar de tab
watch(activeTab, () => { selectedIds.value = []; });
onMounted(() => { if (props.modelValue) loadBatchDetail(); });

const allBovines = computed<any[]>(() => localBatch.value?.bovines || []);

const applySearch = (list: any[]) => {
  const q = search.value.toLowerCase().trim();
  if (!q) return list;
  return list.filter((b) =>
    b.internalEarTag?.toLowerCase().includes(q) ||
    b.name?.toLowerCase().includes(q)
  );
};

const filteredPendientes = computed(() =>
  applySearch(allBovines.value.filter((b) => !b.vaccinated))
);

const filteredVacunados = computed(() =>
  applySearch(allBovines.value.filter((b) => b.vaccinated))
);

const headersPendientes = [
  { title: "Selección", width: "50px", align: "center" },
  { title: "Arete Interno" },
  { title: "Nombre" },
  { title: "Siniiga" },
  { title: "Estatus" },
  { title: "Acciones", align: "center" },
];

const headersVacunados = [
  { title: "Arete Interno" },
  { title: "Nombre" },
  { title: "Siniiga" },
  { title: "Estatus" },
  { title: "Vacunado", align: "center" },
];
</script>

<template>
  <v-dialog :model-value="modelValue" fullscreen persistent transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <v-toolbar color="teal-darken-1" flat class="px-2">
        <v-btn icon="ph-x" @click="emit('update:modelValue', false)" />
        <v-toolbar-title class="font-weight-bold">
          Campaña: {{ localBatch?.name }}
        </v-toolbar-title>
        <v-spacer />

        <v-btn
          v-if="selectedIds.length > 0 && activeTab === 'pendientes'"
          color="error"
          variant="flat"
          prepend-icon="ph-trash"
          class="mr-3 px-5"
          @click="confirmDeleteDialog = true"
        >
          Remover ({{ selectedIds.length }})
        </v-btn>

        <v-btn
          color="white"
          variant="flat"
          prepend-icon="ph-syringe"
          class="mr-2 px-5 text-teal-darken-1 font-weight-bold"
          :disabled="!localBatch || localBatch?.bovineCount === 0"
          @click="vaccineDialog = true"
        >
          Aplicar Vacuna al Lote
        </v-btn>
      </v-toolbar>

      <v-container fluid class="pa-6">
        <v-row>
          <!-- Resumen -->
          <v-col cols="12" md="3">
            <v-card border flat class="rounded-lg pa-4">
              <div class="text-overline mb-2 text-teal-darken-1">Resumen de la Campaña</div>
              <div class="text-h6 font-weight-bold text-uppercase">{{ localBatch?.name }}</div>
              <v-divider class="my-3" />
              <div class="text-caption text-grey">Compañía</div>
              <div class="font-weight-bold">{{ localBatch?.company?.name || '—' }}</div>
              <v-divider class="my-3" />
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption text-grey">Total</span>
                <v-chip color="teal-darken-1" variant="flat" size="x-small" class="font-weight-black">
                  {{ allBovines.length }} cabezas
                </v-chip>
              </div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption text-grey">Vacunados</span>
                <v-chip color="success" variant="flat" size="x-small" class="font-weight-black">
                  {{ allBovines.filter(b => b.vaccinated).length }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-grey">Pendientes</span>
                <v-chip color="warning" variant="flat" size="x-small" class="font-weight-black">
                  {{ allBovines.filter(b => !b.vaccinated).length }}
                </v-chip>
              </div>
              <v-divider class="my-3" />
              <v-btn
                color="teal-darken-1"
                variant="tonal"
                block
                prepend-icon="ph-syringe"
                :disabled="!localBatch || localBatch?.bovineCount === 0"
                @click="vaccineDialog = true"
              >
                Aplicar Vacuna
              </v-btn>
            </v-card>
          </v-col>

          <!-- Tabla con tabs -->
          <v-col cols="12" md="9">
            <v-card border flat class="rounded-lg">
              <!-- Buscador -->
              <v-card-title class="pa-4 bg-white">
                <v-text-field
                  v-model="search"
                  label="Buscar por nombre o arete interno..."
                  variant="outlined"
                  density="compact"
                  hide-details
                  prepend-inner-icon="ph-magnifying-glass"
                />
              </v-card-title>

              <v-tabs v-model="activeTab" color="teal-darken-1" bg-color="white">
                <v-tab value="pendientes" prepend-icon="ph-clock">
                  Pendientes de vacunar
                  <v-chip size="x-small" color="warning" variant="flat" class="ml-2 font-weight-black">
                    {{ allBovines.filter(b => !b.vaccinated).length }}
                  </v-chip>
                </v-tab>
                <v-tab value="vacunados" prepend-icon="ph-check-circle">
                  Vacunados
                  <v-chip size="x-small" color="success" variant="flat" class="ml-2 font-weight-black">
                    {{ allBovines.filter(b => b.vaccinated).length }}
                  </v-chip>
                </v-tab>
              </v-tabs>

              <v-divider />

              <v-tabs-window v-model="activeTab">
                <!-- TAB: PENDIENTES -->
                <v-tabs-window-item value="pendientes">
                  <div class="pa-3 bg-white d-flex align-center justify-end">
                    <v-btn
                      variant="text"
                      size="small"
                      color="teal-darken-1"
                      prepend-icon="ph-check-square"
                      @click="toggleSelectAll"
                      :disabled="filteredPendientes.length === 0"
                    >
                      {{ selectedIds.length === filteredPendientes.length && filteredPendientes.length > 0 ? 'Desmarcar todos' : 'Seleccionar todos' }}
                    </v-btn>
                  </div>
                  <Table v-model="page" :config="{ ...config, noOfItems: filteredPendientes.length }" :headerItems="headersPendientes" :loading="loading" is-pagination>
                    <template #body>
                      <tr
                        v-for="bov in filteredPendientes"
                        :key="bov.id"
                        :class="selectedIds.includes(bov.id) ? 'bg-red-lighten-5' : ''"
                      >
                        <td class="text-center">
                          <v-checkbox-btn v-model="selectedIds" :value="bov.id" color="error" />
                        </td>
                        <td><span class="text-h6 font-weight-black text-teal-darken-1">{{ bov.internalEarTag }}</span></td>
                        <td class="text-uppercase font-weight-medium">{{ bov.name }}</td>
                        <td>{{ bov.siniigaEarTag || '—' }}</td>
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
                      <tr v-if="!loading && filteredPendientes.length === 0">
                        <td :colspan="headersPendientes.length" class="text-center py-10 text-grey-darken-1">
                          <v-icon size="48" color="grey-lighten-2" class="mb-2">ph-check-circle</v-icon>
                          <div>Todos los animales han sido vacunados</div>
                        </td>
                      </tr>
                    </template>
                  </Table>
                </v-tabs-window-item>

                <!-- TAB: VACUNADOS -->
                <v-tabs-window-item value="vacunados">
                  <Table v-model="page" :config="{ ...config, noOfItems: filteredVacunados.length }" :headerItems="headersVacunados" :loading="loading" is-pagination>
                    <template #body>
                      <tr v-for="bov in filteredVacunados" :key="bov.id">
                        <td><span class="text-h6 font-weight-black text-teal-darken-1">{{ bov.internalEarTag }}</span></td>
                        <td class="text-uppercase font-weight-medium">{{ bov.name }}</td>
                        <td>{{ bov.siniigaEarTag || '—' }}</td>
                        <td><v-chip size="x-small" color="success" label>{{ bov.bovineStatus }}</v-chip></td>
                        <td class="text-center">
                          <v-chip size="x-small" color="teal-darken-1" variant="flat" label class="font-weight-bold">
                            <v-icon start size="14">ph-syringe</v-icon>
                            VACUNADO
                          </v-chip>
                        </td>
                      </tr>
                      <tr v-if="!loading && filteredVacunados.length === 0">
                        <td :colspan="headersVacunados.length" class="text-center py-10 text-grey-darken-1">
                          <v-icon size="48" color="grey-lighten-2" class="mb-2">ph-syringe</v-icon>
                          <div>Aún no hay animales vacunados en esta campaña</div>
                        </td>
                      </tr>
                    </template>
                  </Table>
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <RemoveItemConfirmationDialog
      v-model="confirmDeleteDialog"
      :loading="removing"
      title="Remover Animales"
      message="¿Quitar los animales seleccionados de esta campaña?"
      @onConfirm="confirmRemoveBovines"
    />

    <ApplyVaccineDialog
      v-if="vaccineDialog"
      v-model="vaccineDialog"
      :batch="localBatch"
      @refresh="loadBatchDetail"
    />
  </v-dialog>
</template>
