<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { machineryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
const tab = ref<"photo" | "invoice">("photo");
const processing = ref(false);

const photoFile = ref<File | null>(null);
const invoiceFile = ref<File | null>(null);

const machineryData = ref<any>(null);
const loading = ref(false);

watch(() => props.modelValue, (v) => {
  dialog.value = v;
  if (v) {
    tab.value = "photo";
    photoFile.value = null;
    invoiceFile.value = null;
    loadMachinery();
  }
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const loadMachinery = async () => {
  if (!props.item?.id) return;
  try {
    loading.value = true;
    const res = await machineryService.getMachineryById(props.item.id);
    machineryData.value = res.data?.data || props.item;
  } catch {
    machineryData.value = props.item;
  } finally {
    loading.value = false;
  }
};

const currentPhoto = computed(() => machineryData.value?.photo || null);
const currentInvoice = computed(() => machineryData.value?.invoice || null);

const uploadFile = async (file: File, kind: "photo" | "invoice") => {
  if (!props.item?.id) {
    showErrorAlert("Maquinaria no identificada");
    return;
  }
  try {
    processing.value = true;
    const create = kind === "photo"
      ? machineryService.createPhoto
      : machineryService.createInvoice;

    const res = await create.call(machineryService, {
      fileName: file.name,
      contentType: file.type,
      idMachinery: props.item.id,
    });
    const { presignedUrl } = res.data.data;
    if (presignedUrl) {
      await machineryService.uploadToS3(presignedUrl, file);
    }
    showSuccessAlert(kind === "photo" ? "Foto cargada" : "Factura cargada");
    await loadMachinery();
    emit("refresh");
  } catch {
    showErrorAlert("Error durante la carga del archivo");
  } finally {
    processing.value = false;
  }
};

watch(photoFile, (val) => {
  if (val) uploadFile(val, "photo");
});
watch(invoiceFile, (val) => {
  if (val) uploadFile(val, "invoice");
});

const isPdf = (url?: string | null) =>
  !!url && /\.pdf(\?|$)/i.test(url);
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" scrollable persistent>
    <v-card class="rounded-xl">
      <v-overlay v-model="processing" contained class="align-center justify-center" persistent scrim="white">
        <div class="text-center">
          <v-progress-circular indeterminate color="primary" size="56" width="6" class="mb-3" />
          <div class="text-h6 text-primary font-weight-bold">Subiendo archivo...</div>
          <div class="text-caption text-grey">Sincronizando con la nube</div>
        </div>
      </v-overlay>

      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-paperclip" class="mr-2" />
        <div>
          <div class="text-h6 font-weight-bold">Archivos de Maquinaria</div>
          <div class="text-caption" style="opacity:0.9">{{ item?.name }} · {{ item?.brand }} {{ item?.model }}</div>
        </div>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" :disabled="processing" />
      </v-card-title>

      <v-tabs v-model="tab" bg-color="grey-lighten-4" grow>
        <v-tab value="photo">
          <v-icon icon="ph-camera" class="mr-1" /> Foto
        </v-tab>
        <v-tab value="invoice">
          <v-icon icon="ph-file-pdf" class="mr-1" /> Factura
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-6">
        <v-window v-model="tab">
          <!-- ─── FOTO ─── -->
          <v-window-item value="photo">
            <v-file-input
              v-model="photoFile"
              label="Subir foto de la maquinaria"
              variant="outlined"
              accept="image/*"
              prepend-icon="ph-camera"
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
              <v-icon size="50" color="grey-lighten-1">ph-image-square</v-icon>
              <div class="text-grey-darken-1 mt-2">Sin foto registrada</div>
            </v-sheet>
          </v-window-item>

          <!-- ─── FACTURA ─── -->
          <v-window-item value="invoice">
            <v-file-input
              v-model="invoiceFile"
              label="Subir factura"
              variant="outlined"
              accept=".pdf,image/*"
              prepend-icon="ph-file-pdf"
              :disabled="processing"
              density="comfortable"
            />

            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-2">Factura actual</div>

            <div v-if="loading" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else-if="currentInvoice">
              <v-btn
                v-if="isPdf(currentInvoice)"
                :href="currentInvoice"
                target="_blank"
                color="primary"
                variant="flat"
                prepend-icon="ph-download-simple"
              >
                Ver factura PDF
              </v-btn>
              <v-img
                v-else
                :src="currentInvoice"
                max-height="350"
                contain
                class="bg-grey-lighten-4 rounded"
              />
            </div>

            <v-sheet v-else border rounded class="pa-8 text-center bg-grey-lighten-5">
              <v-icon size="50" color="grey-lighten-1">ph-file-x</v-icon>
              <div class="text-grey-darken-1 mt-2">Sin factura registrada</div>
            </v-sheet>
          </v-window-item>
        </v-window>
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
