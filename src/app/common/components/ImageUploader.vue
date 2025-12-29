<script lang="ts" setup>
import { computed, ref } from "vue";
import { v4 as uuidv4 } from "uuid";
import { ImageUploaderType } from "@/app/common/types/imageUploader";

const emit = defineEmits(["update:modelValue"]);

const uploaderItem = ref<ImageUploaderType[]>([]);
const prop = defineProps({
  modelValue: {
    type: Array as () => ImageUploaderType[],
    default: () => [],
  },
  text: {
    type: String,
    default: "Arrastra tu PDF aquí o da clic para subir",
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  showList: {
    type: Boolean,
    default: true, // por defecto muestra la lista
  },
});

/* ─────────────────────────────────────
 * 1.  Carga inicial desde prop
 * ──────────────────────────────────── */
const files = computed({
  get() {
    const existing: ImageUploaderType[] = prop.modelValue.map((data: any, index) => ({
      ...data,
      src: data?.src ?? data,
      name: data?.name ?? `uploaded-doc-${index}.pdf`,
      size: data?.size ?? 0,
      id: data?.id ?? uuidv4(),
      type: data?.type ?? "application/pdf",
    }));
    uploaderItem.value = existing;
    return existing;
  },

  /* ─────────────────────────────────
   * 2. Setter:  filtra solo PDF
   * ──────────────────────────────── */
  set(value: any[]) {
    const filtered = value.filter(
      (f) => f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf")
    );

    const normalized = filtered.map((file: any) => {
      // Si es File nuevo asignamos metadata e ID
      if (!file.id) {
        return {
          src: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          id: uuidv4(),
          type: "application/pdf",
        };
      }
      return file;
    });

    uploaderItem.value = prop.multiple
      ? [...uploaderItem.value, ...normalized]
      : normalized;

    emit(
      "update:modelValue",
      uploaderItem.value.map((i) => i)
    );
  },
});

function onRemove(item: any) {
  uploaderItem.value = uploaderItem.value.filter((u) => u.id !== item.id);
  emit("update:modelValue", uploaderItem.value.map((i) => i));
}
</script>

<template>
  <div class="position-relative">
    <!-- Dropzone -->
    <v-file-input
      v-model="files"
      :multiple="multiple"
      variant="plain"
      :clearable="false"
      prepend-icon=""
      class="file-uploader"
      accept=".pdf,application/pdf"
    />

    <div class="file-uploader-content">
      <div class="text-center">
        <i class="ph-file-arrow-up ph-4x text-primary" />
      </div>
      <div class="text-subtitle-1 font-weight-bold text-center">
        {{ text }}
      </div>
    </div>
  </div>

  <!-- ✅ Lista solo si showList = true -->
  <div v-if="showList">
    <v-card
      v-for="file in uploaderItem"
      :key="file.id"
      class="border mb-3"
      elevation="0"
    >
      <v-card-text class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-avatar rounded="lg" size="52" class="pa-2 mx-2" color="light">
            <i class="ph-file-pdf ph-2x text-primary" />
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="font-weight-bold">{{ file.name }}</span>
            <span>{{ Math.ceil(Number(file.size) / 1024) }} KB</span>
          </div>
        </div>
        <v-btn size="x-small" color="danger" @click="onRemove(file)">
          Eliminar
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.file-uploader {
  height: 150px;
  border: 2px dashed #cfcfcf;
  border-radius: 8px;
}
.file-uploader-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}
</style>
