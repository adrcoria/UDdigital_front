<script lang="ts" setup>
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { bovineService, batchBovineService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  batch: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const loading = ref(false);
const saving = ref(false);
const search = ref("");
const availableBovines = ref<any[]>([]);
const selectedBovineIds = ref<string[]>([]);

// Para vacunación NO filtramos por batches.length === 0
// cualquier animal puede ser vacunado independientemente de si está en otro lote
const loadAvailableBovines = async () => {
  try {
    loading.value = true;
    const res = await bovineService.getBovines({ page: 1, limit: 1000 });
    availableBovines.value = res.data?.data?.list || [];
  } catch {
    showErrorAlert("Error al cargar el inventario de animales");
  } finally {
    loading.value = false;
  }
};

const filteredBovines = computed(() => {
  const query = search.value.toLowerCase().trim();
  if (!query) return availableBovines.value;
  return availableBovines.value.filter((b) =>
    b.internalEarTag?.toLowerCase().includes(query) ||
    b.name?.toLowerCase().includes(query)
  );
});

const handleSave = async () => {
  if (selectedBovineIds.value.length === 0) return;
  try {
    saving.value = true;
    await batchBovineService.updateBovinestoBatch(props.batch.id, {
      idBovines: selectedBovineIds.value,
    });
    showSuccessAlert("Animales asignados a la campaña correctamente");
    emit("refresh");
    emit("update:modelValue", false);
  } catch {
    showErrorAlert("Error al procesar la asignación");
  } finally {
    saving.value = false;
  }
};

const toggleAll = () => {
  if (selectedBovineIds.value.length === filteredBovines.value.length) {
    selectedBovineIds.value = [];
  } else {
    selectedBovineIds.value = filteredBovines.value.map((b) => b.id);
  }
};

onMounted(async () => {
  await nextTick();
  if (props.modelValue) loadAvailableBovines();
});

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedBovineIds.value = [];
    search.value = "";
    loadAvailableBovines();
  }
});
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" max-width="750px" scrollable persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-teal-darken-1 text-white d-flex align-center text-wrap">
        <v-icon icon="ph-user-plus" class="mr-3" />
        <div>
          <div class="text-h6 font-weight-bold">Agregar Animales a Campaña</div>
          <div class="text-caption">Campaña: {{ batch?.name }}</div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-4">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4" icon="ph-info">
          Puedes agregar cualquier animal a esta campaña, independientemente de si ya pertenece a otro lote.
        </v-alert>

        <v-text-field
          v-model="search"
          label="Buscar por Nombre o Arete Interno..."
          variant="outlined"
          density="comfortable"
          class="mb-4"
          clearable
          hide-details
        />

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-caption font-weight-bold text-grey-darken-1">
            {{ filteredBovines.length }} Animales disponibles
          </span>
          <v-btn variant="text" size="small" color="teal-darken-1" @click="toggleAll" :disabled="loading">
            {{ selectedBovineIds.length === filteredBovines.length ? 'Desmarcar todos' : 'Seleccionar todos' }}
          </v-btn>
        </div>

        <v-divider />

        <v-list height="450" class="pa-0">
          <div v-if="loading" class="text-center py-10">
            <v-progress-circular indeterminate color="teal-darken-1" />
          </div>

          <template v-else-if="filteredBovines.length > 0">
            <v-list-item v-for="bov in filteredBovines" :key="bov.id" class="border-b py-4">
              <template #prepend>
                <v-checkbox-btn v-model="selectedBovineIds" :value="bov.id" color="teal-darken-1" />
              </template>
              <v-list-item-content>
                <div class="d-flex align-center flex-wrap mb-1">
                  <span class="text-body-1 font-weight-bold text-teal-darken-1 mr-2">{{ bov.internalEarTag }}</span>
                  <v-chip size="x-small" color="teal-darken-1" variant="flat" label class="font-weight-bold">INTERNO</v-chip>
                </div>
                <div class="text-body-1 font-weight-bold text-grey-darken-4 mb-1">
                  Nombre: <span class="text-uppercase">{{ bov.name }}</span>
                </div>
                <div class="d-flex align-center gap-2 text-caption text-grey-darken-1">
                  <span>Arete Siniiga: {{ bov.siniigaEarTag || 'N/A' }}</span>
                  <v-chip size="x-small" :color="bov.sex?.name === 'MACHO' ? 'blue-darken-1' : 'pink-darken-1'" variant="tonal" label class="font-weight-bold">
                    {{ bov.sex?.name || 'N/A' }}
                  </v-chip>
                  <v-chip v-if="bov.batches?.length > 0" size="x-small" color="orange-darken-1" variant="tonal" label class="font-weight-bold">
                    EN OTRO LOTE
                  </v-chip>
                </div>
              </v-list-item-content>
            </v-list-item>
          </template>

          <v-container v-else class="text-center py-10">
            <v-icon size="64" color="grey-lighten-2">ph-selection-background</v-icon>
            <div class="mt-2 text-grey px-4">No se encontraron animales.</div>
          </v-container>
        </v-list>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-chip color="teal-darken-1" variant="flat" class="font-weight-black">{{ selectedBovineIds.length }} Marcados</v-chip>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="teal-darken-1" variant="flat" class="px-8 font-weight-bold" :loading="saving" :disabled="selectedBovineIds.length === 0" @click="handleSave">
          Asignar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
