<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { batchService, batchBovineService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";

const props = defineProps<{ 
  modelValue: boolean; 
  batch: any | null 
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

/* ------------------ Estado ------------------ */
const loading = ref(false);
const bovines = ref<any[]>([]);
const search = ref("");

// Estado para el registro de peso (Weight Log)
const showWeightDialog = ref(false);
const savingWeight = ref(false);
const selectedBovine = ref<any | null>(null);
const weightForm = ref({
  weight: 0,
  date: new Date().toISOString().split('T')[0]
});

/* ------------------ Carga de Datos ------------------ */
const loadBatchDetails = async () => {
  if (!props.batch?.id) return;
  
  try {
    loading.value = true;
    // Usamos el endpoint de detalle de lote para obtener sus animales
    const res = await batchService.getBatches({ id: props.batch.id });
    // Según la estructura de la API, el detalle suele venir en el primer elemento
    bovines.value = res.data.data.data[0]?.bovines || [];
  } catch (error) {
    showErrorAlert("No se pudo cargar el detalle de los animales");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Acciones por Animal ------------------ */
const handleRemoveFromBatch = async (bovine: any) => {
  try {
    loading.value = true;
    await batchBovineService.removeBovineFromBatch(bovine.id);
    showSuccessAlert(`${bovine.siniigaEarTag} ha sido removido del lote`);
    await loadBatchDetails();
    emit("refresh"); // Notificar al listing que la cuenta de animales cambió
  } catch (error) {
    showErrorAlert("No se pudo remover al animal del lote");
  } finally {
    loading.value = false;
  }
};

const openWeightLog = (bovine: any) => {
  selectedBovine.value = bovine;
  weightForm.value = {
    weight: 0,
    date: new Date().toISOString().split('T')[0]
  };
  showWeightDialog.value = true;
};

const saveWeightLog = async () => {
  if (!selectedBovine.value || weightForm.value.weight <= 0) return;

  try {
    savingWeight.value = true;
    await batchBovineService.addWeightLog(selectedBovine.value.id, {
      weight: Number(weightForm.value.weight),
      date: weightForm.value.date
    });
    
    showSuccessAlert("Registro de peso guardado correctamente");
    showWeightDialog.value = false;
    await loadBatchDetails(); // Refrescar para ver el último peso
  } catch (error: any) {
    showErrorAlert("Error al registrar el peso");
  } finally {
    savingWeight.value = false;
  }
};

/* ------------------ Filtro ------------------ */
const filteredBovines = computed(() => {
  const q = search.value.toLowerCase().trim();
  return bovines.value.filter(b => 
    b.siniigaEarTag?.toLowerCase().includes(q) || 
    b.name?.toLowerCase().includes(q)
  );
});

watch(() => props.modelValue, (val) => {
  if (val) loadBatchDetails();
});

const headers = [
  { title: "Arete Siniiga" },
  { title: "Nombre / Apodo" },
  { title: "Tipo" },
  { title: "Peso Actual (Kg)" },
  { title: "Último Pesaje" },
  { title: "Acciones", align: 'center' }
];
</script>

<template>
  <v-dialog 
    :model-value="modelValue" 
    fullscreen 
    persistent 
    transition="dialog-bottom-transition"
  >
    <v-card class="bg-grey-lighten-4">
      <v-toolbar color="primary" dark>
        <v-btn icon="ph-arrow-left" @click="emit('update:modelValue', false)" />
        <v-toolbar-title class="font-weight-black">
          DETALLE DEL LOTE: {{ batch?.name }}
        </v-toolbar-title>
        <v-spacer />
        <v-chip color="white" label class="mr-4 font-weight-bold">
          {{ bovines.length }} CABEZAS EN ENGORDA
        </v-chip>
      </v-toolbar>

      <v-container fluid class="pa-6">
        <v-card border elevation="0" class="rounded-lg">
          <v-card-title class="pa-4 d-flex align-center">
            <v-text-field
              v-model="search"
              prepend-inner-icon="ph-magnifying-glass"
              label="Filtrar animales en este lote..."
              variant="outlined"
              density="comfortable"
              hide-details
              class="max-width-400"
              clearable
            />
          </v-card-title>

          <Table :headerItems="headers" :loading="loading">
            <template #body>
              <tr v-for="bov in filteredBovines" :key="bov.id">
                <td class="font-weight-bold">{{ bov.siniigaEarTag }}</td>
                <td>{{ bov.name }}</td>
                <td>
                  <v-chip size="x-small" variant="flat" color="blue-grey-lighten-4">
                    {{ bov.bovineType?.name }}
                  </v-chip>
                </td>
                <td class="text-right font-weight-black text-primary">
                  {{ bov.currentWeight || '0' }} kg
                </td>
                <td>{{ bov.lastWeightDate ? new Date(bov.lastWeightDate).toLocaleDateString() : 'Sin registro' }}</td>
                <td class="text-center">
                  <div class="d-flex justify-center ga-2">
                    <v-btn 
                      icon="ph-scales" 
                      variant="tonal" 
                      color="success" 
                      size="small" 
                      title="Registrar Peso"
                      @click="openWeightLog(bov)"
                    />
                    <v-btn 
                      icon="ph-user-minus" 
                      variant="tonal" 
                      color="error" 
                      size="small" 
                      title="Quitar del lote"
                      @click="handleRemoveFromBatch(bov)"
                    />
                  </div>
                </td>
              </tr>
              
              <tr v-if="filteredBovines.length === 0 && !loading">
                <td colspan="6" class="text-center py-10 text-grey">
                  No se encontraron animales en este lote.
                </td>
              </tr>
            </template>
          </Table>
        </v-card>
      </v-container>
    </v-card>

    <v-dialog v-model="showWeightDialog" max-width="450px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-6 bg-success text-white">
          <div class="d-flex align-center">
            <v-icon icon="ph-scales" class="mr-3" />
            <div>
              <div class="text-h6 font-weight-bold">Registro de Pesaje</div>
              <div class="text-caption">{{ selectedBovine?.siniigaEarTag }} - {{ selectedBovine?.name }}</div>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                label="Nuevo Peso Registrado (Kg) *"
                v-model.number="weightForm.weight"
                type="number"
                variant="outlined"
                prepend-inner-icon="ph-monitor-weight"
                suffix="kg"
                autofocus
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Fecha de Pesaje *"
                v-model="weightForm.date"
                type="date"
                variant="outlined"
                prepend-inner-icon="ph-calendar"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="showWeightDialog = false">Cancelar</v-btn>
          <v-btn 
            color="success" 
            variant="flat" 
            class="px-8 rounded-lg" 
            @click="saveWeightLog"
            :loading="savingWeight"
          >
            Guardar Pesaje
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<style scoped>
.max-width-400 {
  max-width: 400px;
}
</style>