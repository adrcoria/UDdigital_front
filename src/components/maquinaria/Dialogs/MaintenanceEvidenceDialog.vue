<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { machineryMaintenanceService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
const processing = ref(false);
const file = ref<File | null>(null);

watch(() => props.modelValue, (v) => {
  dialog.value = v;
  if (v) file.value = null;
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const currentEvidence = computed(() => props.item?.evidence || null);
const isPdf = (url?: string | null) => !!url && /\.pdf(\?|$)/i.test(url);

const upload = async (selected: File) => {
  if (!props.item?.id) {
    showErrorAlert("Mantenimiento no identificado");
    return;
  }
  try {
    processing.value = true;
    const res = await machineryMaintenanceService.createEvidence({
      fileName: selected.name,
      contentType: selected.type,
      idMaintenance: props.item.id,
    });
    const { presignedUrl } = res.data.data;
    if (presignedUrl) {
      await machineryMaintenanceService.uploadToS3(presignedUrl, selected);
    }
    showSuccessAlert("Evidencia cargada");
    emit("refresh");
  } catch {
    showErrorAlert("Error durante la carga del archivo");
  } finally {
    processing.value = false;
  }
};

watch(file, (val) => {
  if (val) upload(val);
});
</script>

<template>
  <v-dialog v-model="dialog" max-width="700" scrollable persistent>
    <v-card class="rounded-xl">
      <v-overlay v-model="processing" contained class="align-center justify-center" persistent scrim="white">
        <div class="text-center">
          <v-progress-circular indeterminate color="primary" size="56" width="6" class="mb-3" />
          <div class="text-h6 text-primary font-weight-bold">Subiendo evidencia...</div>
        </div>
      </v-overlay>

      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-paperclip" class="mr-2" />
        <div>
          <div class="text-h6 font-weight-bold">Evidencia del mantenimiento</div>
          <div class="text-caption" style="opacity:0.9">{{ item?.type }} · {{ item?.jobDescription }}</div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" :disabled="processing" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-file-input
          v-model="file"
          label="Subir evidencia (foto o PDF)"
          variant="outlined"
          accept="image/*,.pdf"
          prepend-icon="ph-upload-simple"
          :disabled="processing"
          density="comfortable"
        />

        <v-divider class="my-4" />
        <div class="text-subtitle-2 mb-2">Evidencia actual</div>

        <div v-if="currentEvidence">
          <v-btn
            v-if="isPdf(currentEvidence)"
            :href="currentEvidence"
            target="_blank"
            color="primary"
            variant="flat"
            prepend-icon="ph-download-simple"
          >
            Ver evidencia PDF
          </v-btn>
          <v-img
            v-else
            :src="currentEvidence"
            max-height="350"
            contain
            class="bg-grey-lighten-4 rounded"
          />
        </div>

        <v-sheet v-else border rounded class="pa-8 text-center bg-grey-lighten-5">
          <v-icon size="50" color="grey-lighten-1">ph-file-x</v-icon>
          <div class="text-grey-darken-1 mt-2">Sin evidencia registrada</div>
        </v-sheet>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="dialog = false" :disabled="processing" class="px-8">
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
