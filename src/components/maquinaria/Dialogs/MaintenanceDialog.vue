<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import Table from "@/app/common/components/Table.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditMaintenanceDialog from "./CreateEditMaintenanceDialog.vue";
import MaintenanceEvidenceDialog from "./MaintenanceEvidenceDialog.vue";
import { machineryMaintenanceService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";
import { formatDate } from "@/app/utils/date";
import { MAINTENANCE_TYPES, WORKSHOP_TYPES } from "../types";

const props = defineProps<{ modelValue: boolean; machinery: any | null }>();
const emit = defineEmits(["update:modelValue"]);

const dialog = ref(false);

watch(() => props.modelValue, (v) => {
  dialog.value = v;
  if (v && props.machinery?.id) loadMaintenances();
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

/* ──────────────── Estado ──────────────── */
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
const evidenceDialog = ref(false);
const confirmationDialog = ref(false);
const selectedItem = ref<any | null>(null);
const itemToDelete = ref<any | null>(null);
const deleting = ref(false);

const headers = [
  { title: "" }, // botón expandir
  { title: "Tipo" },
  { title: "Programada" },
  { title: "Realizada" },
  { title: "Taller" },
  { title: "Costo", align: "end" },
  { title: "Próximo" },
  { title: "Evidencia", align: "center" },
  { title: "Acciones", align: "center" },
];

const toggleExpand = (id: string) => {
  const idx = expandedRows.value.indexOf(id);
  if (idx > -1) expandedRows.value.splice(idx, 1);
  else expandedRows.value.push(id);
};

const formatOdometer = (odometer: any) => {
  if (odometer == null || odometer === "") return "—";
  const num = typeof odometer === "string" ? parseFloat(odometer.replace(/,/g, "")) : Number(odometer);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("es-MX");
};

const isPdf = (url?: string | null) => !!url && /\.pdf(\?|$)/i.test(url);

/* ──────────────── Helpers ──────────────── */
const getTypeInfo = (val: string) =>
  MAINTENANCE_TYPES.find((t) => t.value === val) || { value: val, label: val || "—", color: "grey" };

const getWorkshopLabel = (val: string) =>
  WORKSHOP_TYPES.find((w) => w.value === val)?.label || "—";

const formatCost = (cost: any) => {
  if (cost == null || cost === "") return "—";
  const num = typeof cost === "string" ? parseFloat(cost.replace(/,/g, "")) : Number(cost);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

const getActionMenu = () => [
  { title: "Editar", icon: "ph-pencil", value: "edit" },
  { title: "Evidencia", icon: "ph-paperclip", value: "evidence" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];

const onSelectAction = (option: string, item: any) => {
  selectedItem.value = item;
  if (option === "edit") createEditDialog.value = true;
  else if (option === "evidence") evidenceDialog.value = true;
  else if (option === "delete") {
    itemToDelete.value = item;
    confirmationDialog.value = true;
  }
};

/* ──────────────── Carga ──────────────── */
const loadMaintenances = async () => {
  if (!props.machinery?.id) return;
  try {
    loading.value = true;
    const response = await machineryMaintenanceService.getMaintenances({
      idMachinery: props.machinery.id,
      page: page.value,
      limit: config.value.itemsPerPage,
    });
    tableData.value = response.data.data.list || [];
    config.value.noOfItems = response.data.data.total || 0;
    config.value.end = tableData.value.length;
    config.value.start = tableData.value.length > 0 ? 1 : 0;
  } catch {
    showErrorAlert("No se pudo cargar el historial de mantenimientos");
  } finally {
    loading.value = false;
  }
};

watch([page, () => config.value.itemsPerPage], () => {
  if (dialog.value) loadMaintenances();
});

/* ──────────────── Crear/Editar ──────────────── */
const openCreate = () => {
  selectedItem.value = null;
  createEditDialog.value = true;
};

/* ──────────────── Eliminar ──────────────── */
const onConfirmDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    deleting.value = true;
    await machineryMaintenanceService.deleteMaintenance(itemToDelete.value.id);
    showSuccessAlert("Mantenimiento eliminado");
    confirmationDialog.value = false;
    itemToDelete.value = null;
    await loadMaintenances();
  } catch {
    showErrorAlert("No se pudo eliminar el mantenimiento");
  } finally {
    deleting.value = false;
  }
};

const machineryHeader = computed(() => {
  if (!props.machinery) return "";
  const parts = [props.machinery.name, props.machinery.brand, props.machinery.model].filter(Boolean);
  return parts.join(" · ");
});
</script>

<template>
  <v-dialog v-model="dialog" fullscreen scrollable transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column">
      <!-- ── Header ── -->
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-wrench" size="28" class="mr-3" />
        <div>
          <div class="text-h6 font-weight-bold">Historial de Mantenimientos</div>
          <div class="text-caption" style="opacity:0.9">{{ machineryHeader }}</div>
        </div>
        <v-spacer />
        <v-btn
          color="white"
          variant="elevated"
          prepend-icon="ph-plus"
          class="mr-2"
          @click="openCreate"
        >
          <span class="text-primary font-weight-bold">Nuevo mantenimiento</span>
        </v-btn>
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" />
      </v-card-title>

      <!-- ── Tabla ── -->
      <v-card-text class="pa-4 flex-grow-1 bg-grey-lighten-5">
        <v-card elevation="0">
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
                    <v-icon icon="ph-clipboard-text" size="40" class="mb-2" color="grey-lighten-1" />
                    <div>Sin mantenimientos registrados</div>
                  </td>
                </tr>
              </template>

              <template v-for="m in tableData" :key="m.id">
                <tr :class="{ 'bg-blue-grey-lighten-5': expandedRows.includes(m.id) }">
                  <td>
                    <v-btn
                      variant="text"
                      size="small"
                      :icon="expandedRows.includes(m.id) ? 'ph-caret-up' : 'ph-caret-down'"
                      @click="toggleExpand(m.id)"
                    />
                  </td>
                  <td>
                    <v-chip
                      :color="getTypeInfo(m.type).color"
                      size="small"
                      variant="tonal"
                      label
                    >
                      {{ getTypeInfo(m.type).label }}
                    </v-chip>
                  </td>
                  <td>{{ formatDate(m.programedDate) }}</td>
                  <td>
                    <span v-if="m.doneDate">{{ formatDate(m.doneDate) }}</span>
                    <v-chip v-else color="warning" size="x-small" variant="tonal">Pendiente</v-chip>
                  </td>
                  <td>{{ getWorkshopLabel(m.workshop) }}</td>
                  <td class="text-end font-weight-medium">{{ formatCost(m.totalCost) }}</td>
                  <td>{{ formatDate(m.nextMaintenance) }}</td>
                  <td class="text-center">
                    <v-icon
                      :color="m.evidence ? 'success' : 'grey-lighten-1'"
                      :icon="m.evidence ? 'ph-check-circle' : 'ph-circle'"
                    />
                  </td>
                  <td class="text-center">
                    <ListMenuWithIcon
                      icon="ph-dots-three-vertical"
                      :menu-items="getActionMenu()"
                      variant="text"
                      color="primary"
                      @on-select="(opt) => onSelectAction(opt, m)"
                    />
                  </td>
                </tr>

                <!-- ── Fila expandida ── -->
                <tr v-if="expandedRows.includes(m.id)">
                  <td :colspan="headers.length" class="pa-0">
                    <v-expand-transition>
                      <div class="pa-5 bg-grey-lighten-5 border-b">
                        <v-row>
                          <!-- Trabajo realizado -->
                          <v-col cols="12" md="4">
                            <div class="d-flex align-center mb-2">
                              <v-icon size="18" color="primary" class="mr-2">ph-wrench</v-icon>
                              <span class="text-subtitle-2 font-weight-bold">Trabajo realizado</span>
                            </div>
                            <div class="pl-7">
                              <div class="text-caption text-grey">Descripción</div>
                              <div class="text-body-2 mb-2" style="white-space: pre-wrap;">{{ m.jobDescription || '—' }}</div>

                              <div class="text-caption text-grey">Refacciones utilizadas</div>
                              <div class="text-body-2" style="white-space: pre-wrap;">{{ m.sparePartsUsed || '—' }}</div>
                            </div>
                          </v-col>

                          <!-- Datos operativos -->
                          <v-col cols="12" md="3">
                            <div class="d-flex align-center mb-2">
                              <v-icon size="18" color="primary" class="mr-2">ph-gauge</v-icon>
                              <span class="text-subtitle-2 font-weight-bold">Datos operativos</span>
                            </div>
                            <div class="pl-7">
                              <div class="text-caption text-grey">Odómetro al servicio</div>
                              <div class="text-body-2 mb-1">{{ formatOdometer(m.odometer) }}</div>

                              <div class="text-caption text-grey">Maquinaria</div>
                              <div class="text-body-2">
                                {{ m.machinery?.name || '—' }}
                                <span v-if="m.machinery?.internalCode" class="text-caption text-grey">
                                  ({{ m.machinery.internalCode }})
                                </span>
                              </div>
                            </div>
                          </v-col>

                          <!-- Notas -->
                          <v-col cols="12" md="2">
                            <div class="d-flex align-center mb-2">
                              <v-icon size="18" color="primary" class="mr-2">ph-note-pencil</v-icon>
                              <span class="text-subtitle-2 font-weight-bold">Notas</span>
                            </div>
                            <div class="pl-7 text-body-2" style="white-space: pre-wrap;">
                              {{ m.notes || 'Sin notas' }}
                            </div>
                          </v-col>

                          <!-- Evidencia -->
                          <v-col cols="12" md="3">
                            <div class="d-flex align-center mb-2">
                              <v-icon size="18" color="primary" class="mr-2">ph-paperclip</v-icon>
                              <span class="text-subtitle-2 font-weight-bold">Evidencia</span>
                            </div>
                            <div class="pl-7">
                              <template v-if="m.evidence">
                                <v-btn
                                  v-if="isPdf(m.evidence)"
                                  :href="m.evidence"
                                  target="_blank"
                                  color="primary"
                                  size="small"
                                  variant="tonal"
                                  prepend-icon="ph-file-pdf"
                                >
                                  Ver PDF
                                </v-btn>
                                <a v-else :href="m.evidence" target="_blank">
                                  <v-img
                                    :src="m.evidence"
                                    max-height="100"
                                    max-width="160"
                                    cover
                                    class="rounded border"
                                  />
                                </a>
                              </template>
                              <span v-else class="text-body-2 text-grey">Sin evidencia</span>
                            </div>
                          </v-col>
                        </v-row>
                      </div>
                    </v-expand-transition>
                  </td>
                </tr>
              </template>
            </template>
          </Table>
        </v-card>
      </v-card-text>

      <!-- ── Crear/Editar ── -->
      <CreateEditMaintenanceDialog
        v-if="machinery"
        v-model="createEditDialog"
        :item="selectedItem"
        :machinery-id="machinery.id"
        @refresh="loadMaintenances"
      />

      <!-- ── Evidencia ── -->
      <MaintenanceEvidenceDialog
        v-model="evidenceDialog"
        :item="selectedItem"
        @refresh="loadMaintenances"
      />

      <!-- ── Confirmar borrado ── -->
      <RemoveItemConfirmationDialog
        v-if="confirmationDialog"
        v-model="confirmationDialog"
        :loading="deleting"
        title="Eliminar mantenimiento"
        @on-confirm="onConfirmDelete"
      >
        <template #text>
          ¿Eliminar este mantenimiento? Esta acción no se puede deshacer.
        </template>
      </RemoveItemConfirmationDialog>
    </v-card>
  </v-dialog>
</template>
