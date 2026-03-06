<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import { pregnancyService, bovineService, liveStockService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  bovine: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

/* ------------------ Estado ------------------ */
const loading = ref(false);
const history = ref<any[]>([]);
const showForm = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const page = ref(1);
const config = ref({ page: 1, noOfItems: 0, itemsPerPage: 5 });
const pregnancyTypes = ref<any[]>([]);
const listMales = ref<any[]>([]);

const form = ref({
  dateInit: new Date().toISOString().substr(0, 10),
  dateEnd: "",
  idPregnancyType: "", 
  idBull: null,
  bullName: "", 
  motherExternalName: "",
  notes: "",
  status: "PENDIENTE"
});

/* ------------------ Lógica de Cálculo ------------------ */
watch(() => form.value.dateInit, (newDate) => {
  if (newDate) {
    const date = new Date(newDate);
    date.setDate(date.getDate() + 290);
    form.value.dateEnd = date.toISOString().substr(0, 10);
  }
}, { immediate: true });

/* ------------------ Computed: Lógica de Visibilidad ------------------ */
const selectedType = computed(() => pregnancyTypes.value.find(t => t.id === form.value.idPregnancyType));
const typeName = computed(() => selectedType.value?.name?.toUpperCase() || "");

// Corregido: Solo pide semental del inventario si es INTERNO
const isHatoInterno = computed(() => typeName.value.includes('INTERNO') && !typeName.value.includes('EXTERNO'));
const isExterno = computed(() => typeName.value.includes('EXTERNO'));
const isTransferencia = computed(() => typeName.value.includes('TRANSFERENCIA') || typeName.value.includes('EMBRION'));

/* ------------------ Lógica de Datos ------------------ */
const loadHistory = async () => {
  if (!props.bovine?.id) return;
  try {
    loading.value = true;
    const res = await pregnancyService.getHistory({
      idBovine: props.bovine.id,
      page: page.value,
      limit: config.value.itemsPerPage
    });
    history.value = res.data?.data?.data || res.data?.data || [];
    config.value.noOfItems = res.data?.data?.total || history.value.length;
  } catch (error) {
    showErrorAlert("No se pudo cargar el historial");
  } finally {
    loading.value = false;
  }
};

const savePregnancy = async () => {
  try {
    saving.value = true;
    
    // Si es interno, generamos el bullName para el historial
    if (isHatoInterno.value && form.value.idBull) {
      const bull = listMales.value.find(m => m.id === form.value.idBull);
      if (bull) form.value.bullName = `${bull.name} (${bull.internalEarTag})`;
    }

    const payload = {
      idBovine: props.bovine.id,
      idPregnancyType: form.value.idPregnancyType,
      dateInit: form.value.dateInit,
      dateEnd: form.value.dateEnd,
      idMaleBovine: isHatoInterno.value ? form.value.idBull : "", // Solo viaja si es interno
      bullName: form.value.bullName,
      motherExternalName: isTransferencia.value ? form.value.motherExternalName : "",
      notes: form.value.notes,
      status: form.value.status
    };

    if (isEditing.value) {
      await pregnancyService.updatePregnancy(editingId.value!, payload);
      showSuccessAlert("Actualizado");
    } else {
      await pregnancyService.createPregnancy(payload);
      showSuccessAlert("Registrado");
    }

    closeForm();
    loadHistory();
  } catch (error) {
    showErrorAlert("Error al guardar");
  } finally {
    saving.value = false;
  }
};

const openEdit = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  form.value = {
    dateInit: item.dateInit ? item.dateInit.substr(0, 10) : "",
    dateEnd: item.dateEnd ? item.dateEnd.substr(0, 10) : "",
    idPregnancyType: item.idPregnancyType,
    idBull: item.idMaleBovine || null,
    bullName: item.bullName || "",
    motherExternalName: item.motherExternalName || "",
    notes: item.notes || "",
    status: item.status || "PENDIENTE"
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    dateInit: new Date().toISOString().substr(0, 10),
    dateEnd: "",
    idPregnancyType: "", idBull: null, bullName: "", motherExternalName: "", notes: "", status: "PENDIENTE"
  };
};

watch(page, loadHistory);

onMounted(async () => {
  loadHistory();
  const [resT, resSex] = await Promise.all([
    liveStockService.getItems("pregnancy-type", { page: 1, limit: 100 }),
    liveStockService.getItems("sex", { page: 1, limit: 10 })
  ]);
  pregnancyTypes.value = resT.data?.data?.data || resT.data?.data || [];
  const maleId = resSex.data?.data?.find((s: any) => s.name === 'MACHO')?.id;
  if (maleId) {
    const resM = await bovineService.getBovinesBySex(maleId);
    listMales.value = resM.data?.data || [];
  }
});

const headers = [
  { title: "Fecha Preñez" }, { title: "Tipo" }, { title: "Semental/Padre" },
  { title: "Estatus" }, { title: "F. Probable Parto" }, { title: "Acciones", align: "center" }
];
</script>

<template>
  <v-dialog :model-value="modelValue" fullscreen transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <v-toolbar color="primary" flat>
        <v-btn icon="ph-x" @click="emit('update:modelValue', false)" />
        <v-toolbar-title class="font-weight-bold">Control Reproductivo: {{ bovine?.name }}</v-toolbar-title>
        <v-spacer />
        <v-btn variant="flat" color="white" class="text-primary px-6" @click="showForm = !showForm">
          {{ showForm ? 'Cerrar Formulario' : 'Nuevo Registro' }}
        </v-btn>
      </v-toolbar>

      <v-container fluid class="pa-6">
        <v-row>
          <v-expand-transition>
            <v-col cols="12" v-if="showForm">
              <v-card border flat class="rounded-lg pa-6 mb-4">
                <v-row dense>
                  <v-col cols="12" md="2">
                    <v-text-field v-model="form.dateInit" type="date" label="Fecha Preñez" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field v-model="form.dateEnd" type="date" label="Probable Parto" variant="outlined" density="comfortable" readonly bg-color="grey-lighten-4" />
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select v-model="form.idPregnancyType" :items="pregnancyTypes" item-title="name" item-value="id" label="Tipo de Registro" variant="outlined" density="comfortable" />
                  </v-col>

                  <v-col cols="12" md="3" v-if="isHatoInterno">
                    <v-autocomplete v-model="form.idBull" :items="listMales" item-title="name" item-value="id" label="Semental del Hato" variant="outlined" density="comfortable" clearable>
                      <template #item="{ props, item }"><v-list-item v-bind="props" :subtitle="`Arete: ${item.raw.internalEarTag}`" /></template>
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12" md="3" v-if="isExterno || isTransferencia">
                    <v-text-field v-model="form.bullName" label="Nombre del Padre / Toro" variant="outlined" density="comfortable" />
                  </v-col>

                  <v-col cols="12" md="2" v-if="isTransferencia">
                    <v-text-field v-model="form.motherExternalName" label="Madre Biológica" variant="outlined" density="comfortable" />
                  </v-col>

                  <v-col cols="12" md="2" v-if="isEditing">
                    <v-select v-model="form.status" :items="['PENDIENTE', 'CONFIRMADA', 'FALLIDA', 'PARTO']" label="Estado" variant="outlined" density="comfortable" />
                  </v-col>
                </v-row>
                <v-card-actions><v-spacer /><v-btn color="primary" variant="flat" class="px-10" :loading="saving" @click="savePregnancy">Guardar</v-btn></v-card-actions>
              </v-card>
            </v-col>
          </v-expand-transition>

          <v-col cols="12">
            <v-card border flat class="rounded-lg">
              <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
                <template #body>
                  <tr v-for="item in history" :key="item.id">
                    <td class="font-weight-bold">{{ new Date(item.dateInit).toLocaleDateString() }}</td>
                    <td><v-chip size="x-small" label color="primary" variant="tonal">{{ item.pregnancyType?.name }}</v-chip></td>
                    <td>
                      <div class="font-weight-bold">{{ item.bullName || '---' }}</div>
                      <div v-if="item.motherExternalName" class="text-caption text-grey italic">M. Biológica: {{ item.motherExternalName }}</div>
                    </td>
                    <td>
                      <v-chip size="x-small" :color="item.status === 'CONFIRMADA' ? 'success' : 'warning'">{{ item.status }}</v-chip>
                    </td>
                    <td class="text-primary font-weight-black">
                      {{ item.dateEnd ? new Date(item.dateEnd).toLocaleDateString() : 'Pendiente' }}
                    </td>
                    <td class="text-center">
                      <v-btn icon="ph-pencil" size="small" variant="text" color="primary" @click="openEdit(item)" />
                    </td>
                  </tr>
                </template>
              </Table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>