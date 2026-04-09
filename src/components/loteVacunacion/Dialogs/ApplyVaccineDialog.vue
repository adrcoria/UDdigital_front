<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { batchService, inventoryService, ranchersService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  batch: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const loading = ref(false);
const saving = ref(false);
const inventoryItems = ref<any[]>([]);
const ranchers = ref<any[]>([]);

const form = ref({
  idProduct: "",
  idRancher: "",
});

const formRef = ref(null);

const loadData = async () => {
  try {
    loading.value = true;
    const [invRes, ranchRes] = await Promise.all([
      inventoryService.getInventory(),
      ranchersService.getRanchers(),
    ]);
    inventoryItems.value = invRes.data?.data || [];
    ranchers.value = ranchRes.data?.data || [];
  } catch {
    showErrorAlert("Error al cargar los datos");
  } finally {
    loading.value = false;
  }
};

const inventoryOptions = computed(() =>
  inventoryItems.value
    .filter((item: any) =>
      item.product?.productSubcategory?.name?.toLowerCase().includes("vacuna")
    )
    .map((item: any) => ({
      title: `${item.product?.name || 'Sin nombre'} (${item.units} ${item.product?.unitOfMeasure || 'uds'})`,
      value: item.product?.id,
    }))
);

const rancherOptions = computed(() =>
  ranchers.value.map((r: any) => ({
    title: `${r.name} — ${r.company?.name || ''}`,
    value: r.id,
  }))
);

const handleSave = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    saving.value = true;
    await batchService.applyVaccineToBatch(props.batch.id, {
      idProduct: form.value.idProduct,
      idRancher: form.value.idRancher,
    });
    showSuccessAlert("Vacuna aplicada al lote correctamente");
    emit("refresh");
    emit("update:modelValue", false);
  } catch (error: any) {
    const msg = error?.response?.data?.message || "Error al aplicar la vacuna";
    showErrorAlert(msg);
  } finally {
    saving.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-teal-darken-1 text-white d-flex align-center">
        <v-icon icon="ph-syringe" class="mr-3" />
        <div>
          <div class="text-h6 font-weight-bold">Aplicar Vacuna al Lote</div>
          <div class="text-caption">{{ batch?.name }} · {{ batch?.bovineCount || 0 }} animales</div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-6">
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="teal-darken-1" />
        </div>

        <v-form v-else ref="formRef" @submit.prevent="handleSave">
          <v-select
            v-model="form.idProduct"
            :items="inventoryOptions"
            label="Vacuna / Producto *"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-flask"
            :rules="[v => !!v || 'Selecciona un producto']"
            class="mb-4"
            no-data-text="Sin vacunas en inventario (agrega productos con subcategoría 'Vacuna')"
          />

          <v-select
            v-model="form.idRancher"
            :items="rancherOptions"
            label="Ranchero *"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="ph-user-circle"
            :rules="[v => !!v || 'Selecciona el ranchero']"
            no-data-text="Sin rancheros registrados"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn
          color="teal-darken-1"
          variant="flat"
          :loading="saving"
          :disabled="loading"
          prepend-icon="ph-syringe"
          @click="handleSave"
        >
          Aplicar Vacuna
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
