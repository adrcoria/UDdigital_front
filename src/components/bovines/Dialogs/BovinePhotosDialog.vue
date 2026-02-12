<script lang="ts" setup>
import { ref, watch } from "vue";
import { bovineService, bovinePhotoService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
const loading = ref(false);
const processing = ref(false); // Estado para subida y borrado
const photos = ref<any[]>([]);
const selectedFiles = ref<File[]>([]);

const loadPhotos = async () => {
  if (!props.item?.id) return;
  try {
    loading.value = true;
    const response = await bovineService.getBovineById(props.item.id);
    photos.value = response.data?.data?.bovinePhotos || [];
  } catch (error) {
    showErrorAlert("Error al sincronizar la galería");
  } finally {
    loading.value = false;
  }
};

const uploadPhotos = async () => {
  if (selectedFiles.value.length === 0) return;
  
  try {
    processing.value = true; // Iniciamos overlay de proceso
    
    for (const file of selectedFiles.value) {
      const resMetadata = await bovinePhotoService.createPhoto({
        fileName: file.name,
        contentType: file.type,
        idBovine: props.item.id
      });

      const { presignedUrl } = resMetadata.data.data;

      if (presignedUrl) {
        await bovinePhotoService.uploadToS3(presignedUrl, file);
      }
    }
    
    showSuccessAlert("Fotos almacenadas correctamente");
    selectedFiles.value = [];
    await loadPhotos();
  } catch (error: any) {
    showErrorAlert("Error durante la carga de archivos");
  } finally {
    processing.value = false; // Quitamos overlay
  }
};

const removePhoto = async (photoId: string) => {
  try {
    processing.value = true; // Bloqueamos acciones durante el borrado
    await bovinePhotoService.deletePhoto(photoId);
    showSuccessAlert("Foto eliminada");
    await loadPhotos();
  } catch (error) {
    showErrorAlert("No se pudo eliminar el recurso");
  } finally {
    processing.value = false;
  }
};

watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) loadPhotos();
}, { immediate: true });

watch(dialog, (val) => emit("update:modelValue", val));
</script>

<template>
  <v-dialog v-model="dialog" max-width="900" scrollable persistent>
    <v-card class="rounded-xl">
      
      <v-overlay v-model="processing" contained class="align-center justify-center" persistent scrim="white">
        <div class="text-center">
          <v-progress-circular indeterminate color="primary" size="64" width="6" class="mb-4" />
          <div class="text-h6 text-primary font-weight-bold">Procesando...</div>
          <div class="text-caption text-grey">Sincronizando con almacenamiento en la nube</div>
        </div>
      </v-overlay>

      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-camera" class="mr-3" />
        <div>
          <span class="text-h6 font-weight-bold">Galería Multimedia</span>
          <div class="text-caption text-uppercase" style="opacity: 0.9">
             {{ item?.name }} | Arete: {{ item?.siniigaEarTag }}
          </div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" :disabled="processing" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-file-input
          v-model="selectedFiles"
          label="Añadir fotografías"
          variant="outlined"
          multiple
          chips
          prepend-icon="ph-upload-simple"
          accept="image/*"
          :disabled="processing"
          @update:model-value="uploadPhotos"
          placeholder="Selecciona archivos para subir"
          density="comfortable"
        />

        <v-divider class="my-6" />

        <div v-if="loading" class="text-center py-10">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <v-row v-else-if="photos.length > 0">
          <v-col v-for="photo in photos" :key="photo.id" cols="6" sm="4" md="3">
            <v-card border elevation="0" class="rounded-lg overflow-hidden position-relative">
              <v-img :src="photo.url" height="180" cover class="bg-grey-lighten-4">
                <template #placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="grey-lighten-2" />
                  </v-row>
                </template>
              </v-img>
              
              <v-btn
                icon="ph-trash"
                size="small"
                color="error"
                variant="flat"
                class="position-absolute top-0 right-0 ma-2"
                :disabled="processing"
                @click="removePhoto(photo.id)"
              />
            </v-card>
          </v-col>
        </v-row>

        <v-sheet v-else border rounded class="pa-12 text-center bg-grey-lighten-5">
          <v-icon size="60" color="grey-lighten-1" class="mb-2">ph-images-square</v-icon>
          <div class="text-h6 text-grey-darken-1">Sin archivos multimedia</div>
        </v-sheet>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="dialog = false" :disabled="processing" class="px-8 font-weight-bold">
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>