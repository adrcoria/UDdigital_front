<script lang="ts" setup>
import { ref, watch } from "vue";
import { batchService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  batchTypeId: string;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);
const loading = ref(false);
const formRef = ref(null);
const form = ref({ name: "" });

const save = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    loading.value = true;
    await batchService.createBatch({
      name: form.value.name.toUpperCase(),
      idBatchType: props.batchTypeId,
      idBovines: [],
    });
    showSuccessAlert("Lote de Leche creado correctamente");
    emit("refresh");
    emit("update:modelValue", false);
  } catch {
    showErrorAlert("Error al crear el lote");
  } finally {
    loading.value = false;
  }
};

watch(() => props.modelValue, (val) => { if (val) form.value.name = ""; });
</script>

<template>
  <v-dialog v-model="props.modelValue" max-width="450px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-blue-darken-2 text-white d-flex align-center">
        <v-icon icon="ph-drop" class="mr-3" />
        <span class="text-h6 font-weight-bold">Nuevo Lote de Leche</span>
      </v-card-title>
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="save">
          <v-text-field
            v-model="form.name"
            label="Nombre del Lote *"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Requerido']"
            prepend-inner-icon="ph-pencil"
            class="text-uppercase"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="blue-darken-2" variant="flat" :loading="loading" @click="save">Guardar Lote</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
