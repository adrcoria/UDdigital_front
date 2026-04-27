<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { personalService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
const processing = ref(false);
const file = ref<File | null>(null);
const personalData = ref<any>(null);
const loading = ref(false);

watch(() => props.modelValue, (v) => {
  dialog.value = v;
  if (v) {
    file.value = null;
    loadPersonal();
  }
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const loadPersonal = async () => {
  if (!props.item?.id) return;
  try {
    loading.value = true;
    const res = await personalService.getPersonalById(props.item.id);
    personalData.value = res.data?.data || props.item;
  } catch {
    personalData.value = props.item;
  } finally {
    loading.value = false;
  }
};

const currentPhoto = computed(() => personalData.value?.photo || null);
const fullName = computed(() => {
  if (!props.item) return "";
  return `${props.item.name || ""} ${props.item.lastName || ""} ${props.item.secondLastName || ""}`.trim();
});

const upload = async (selected: File) => {
  if (!props.item?.id) {
    showErrorAlert("Personal no identificado");
    return;
  }
  try {
    processing.value = true;
    const res = await personalService.createPhoto({
      fileName: selected.name,
      contentType: selected.type,
      idPersonal: props.item.id,
    });
    const { presignedUrl } = res.data.data;
    if (presignedUrl) {
      await personalService.uploadToS3(presignedUrl, selected);
    }
    showSuccessAlert("Foto cargada");
    await loadPersonal();
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
          <div class="text-h6 text-primary font-weight-bold">Subiendo foto...</div>
        </div>
      </v-overlay>

      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-camera" class="mr-2" />
        <div>
          <div class="text-h6 font-weight-bold">Foto de personal</div>
          <div class="text-caption" style="opacity:0.9">{{ fullName }}</div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" :disabled="processing" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-file-input
          v-model="file"
          label="Subir foto"
          variant="outlined"
          accept="image/*"
          prepend-icon="ph-upload-simple"
          :disabled="processing"
          density="comfortable"
        />

        <v-divider class="my-4" />
        <div class="text-subtitle-2 mb-2">Foto actual</div>

        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <v-img
          v-else-if="currentPhoto"
          :src="currentPhoto"
          max-height="350"
          contain
          class="bg-grey-lighten-4 rounded"
        />

        <v-sheet v-else border rounded class="pa-8 text-center bg-grey-lighten-5">
          <v-icon size="50" color="grey-lighten-1">ph-user-circle</v-icon>
          <div class="text-grey-darken-1 mt-2">Sin foto registrada</div>
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
