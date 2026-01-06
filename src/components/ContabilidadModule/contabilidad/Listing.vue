<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import Table from "@/app/common/components/Table.vue";
import CreateEditOperationDialog from "./Dialogs/CreateEditOperationDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import { operationsService, operationImageService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

/* ------------------ Props ------------------ */
const props = defineProps<{
  filters: {
    query: string;
  };
}>();

const formatMoney = (value: number | string) => {
  const num = Number(value || 0);
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};

/* ------------------ State ------------------ */
const operations = ref<any[]>([]);
const tableData = ref<any[]>([]);
const loading = ref(false);
const deleting = ref(false);
const page = ref(1);

const config = ref({
  page: page.value,
  start: 0,
  end: 0,
  noOfItems: 0,
  itemsPerPage: 10,
});

const createDialog = ref(false);
const confirmationDialog = ref(false);
const selectedOperation = ref<any | null>(null);
const confirmation = ref<any | null>(null);

const filesDialog = ref(false);
const selectedForFiles = ref<any | null>(null);
const filesLoading = ref(false);
const filesUploading = ref(false);
const filesDeleting = ref(false);
const operationFiles = ref<any[]>([]);

const filePicker = ref<HTMLInputElement | null>(null);

const isImageFile = (f: any) => {
  const url = (f?.url || f?.publicUrl || "").toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(url);
};

const isPdfFile = (f: any) => {
  const url = (f?.url || f?.publicUrl || "").toLowerCase();
  return /\.pdf$/.test(url);
};

const getFileUrl = (f: any) => f?.publicUrl || f?.url || "";
const getFileName = (f: any) => f?.fileName || f?.s3Key?.split("/").pop() || "archivo";

const previewDialog = ref(false);
const previewUrl = ref("");

const openPreview = (f: any) => {
  previewUrl.value = getFileUrl(f);
  if (!previewUrl.value) return showErrorAlert("Sin url");
  previewDialog.value = true;
};



/* ------------------ Table ------------------ */
const headers = [
  { title: "Cuenta" },
  { title: "Categoría" },
  { title: "Concepto" },
  { title: "Comentarios" },
  { title: "Cantidad" },
  { title: "Monto" },
  { title: "Total" },
  { title: "Acciones" },
];

const actionMenu = [
  { title: "Archivos", icon: "ph-paperclip", value: "files" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];


/* ------------------ Filtering ------------------ */
const filteredOperations = computed(() => {
  const q = props.filters.query?.trim().toLowerCase();
  if (!q) return operations.value;

  return operations.value.filter(op => {
    const fields = [
      op.accountName,
      op.categoryName,
      op.conceptName,
      op.description,
      String(op.amount),
      String(op.total),
    ];

    return fields.some(f => f && f.toString().toLowerCase().includes(q));
  });
});

/* ------------------ Pagination ------------------ */
const paginate = () => {
  const list = filteredOperations.value;
  const { itemsPerPage } = config.value;
  const start = (page.value - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, list.length);

  config.value = {
    ...config.value,
    start,
    end,
    noOfItems: list.length,
  };

  tableData.value = list.slice(start, end);
};

/* ------------------ Data ------------------ */
const getOperations = async () => {
  try {
    loading.value = true;
    const res = await operationsService.getOperations();

    operations.value = res.data.data.map((op: any) => {
      const quantity = Number(op.quantity || 1);
      const amount = Number(op.amount || 0);
      const polarity = Number(op.concept?.polarity || 1);

      return {
        ...op,
        accountName: op.account?.name || "",
        categoryName: op.concept?.conceptCategory?.name || "",
        conceptName: op.concept?.name || "",
        quantity,
        amount,
        total: (amount * quantity * polarity).toFixed(2),
      };
    });

    paginate();
  } catch {
    showErrorAlert("No se pudieron cargar las operaciones");
  } finally {
    loading.value = false;
  }
};

const openFilesDialog = async (item: any) => {
  selectedForFiles.value = item;
  operationFiles.value = [];
  filesDialog.value = true;
  await loadOperationFiles();
};


const loadOperationFiles = async () => {
  const op = selectedForFiles.value;
  if (!op?.id) return;

  try {
    filesLoading.value = true;
    const res = await operationImageService.getOperationImagesByOperation(op.id);
    operationFiles.value = res.data.data || [];
  } catch (err) {
    operationFiles.value = [];
    showErrorAlert("No se pudieron cargar los archivos de esta operación");
  } finally {
    filesLoading.value = false;
  }
};

const openFile = (fileItem: any) => {
  const url = getFileUrl(fileItem);
  if (!url) return showErrorAlert("El archivo no tiene url");
  window.open(url, "_blank");
};


const triggerPickFile = () => {
  if (filesUploading.value) return;
  filePicker.value?.click();
};

const onPickFileFromModal = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (filePicker.value) filePicker.value.value = "";

  const op = selectedForFiles.value;
  if (!op?.id) {
    showErrorAlert("No se encontró el ID de la operación");
    return;
  }

  try {
    filesUploading.value = true;

    const presignedRes = await operationImageService.createOperationImage({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      uuidOperation: op.id,
    });

    const presignedUrl = presignedRes.data.data?.presignedUrl;
    if (!presignedUrl) {
      showErrorAlert("No se recibió la URL prefirmada (presignedUrl)");
      return;
    }

    await operationImageService.uploadToS3(presignedUrl, file);

    showSuccessAlert("Archivo subido correctamente");
    await loadOperationFiles(); // refresca SOLO el modal
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.data ||
      err?.message ||
      "Error al subir archivo";
    showErrorAlert(msg);
  } finally {
    filesUploading.value = false;
  }
};


const deleteFile = async (fileItem: any) => {
  if (!fileItem?.id) {
    showErrorAlert("No se encontró el ID del archivo");
    return;
  }

  try {
    filesDeleting.value = true;
    await operationImageService.deleteOperationImage(fileItem.id);
    showSuccessAlert("Archivo eliminado");
    await loadOperationFiles();
  } catch {
    showErrorAlert("No se pudo eliminar el archivo");
  } finally {
    filesDeleting.value = false;
  }
};


onMounted(getOperations);

/* ------------------ Watches ------------------ */
watch(page, paginate);
watch(() => props.filters.query, () => {
  page.value = 1;
  paginate();
});

/* ------------------ Actions ------------------ */
const onCreate = () => {
  selectedOperation.value = null;
  createDialog.value = true;
};

const onSelectAction = (action: string, item: any) => {
  if (action === "files") {
    openFilesDialog(item);
  } else if (action === "delete") {
    confirmation.value = item;
    confirmationDialog.value = true;
  }
};

const closeFilesDialog = () => {
  filesDialog.value = false;
  selectedForFiles.value = null;
  operationFiles.value = [];
  previewDialog.value = false;
  previewUrl.value = "";
};




const confirmDelete = async () => {
  try {
    deleting.value = true;
    await operationsService.deleteOperation(confirmation.value.id);
    showSuccessAlert("Operación eliminada");
    await getOperations();
  } catch {
    showErrorAlert("No se pudo eliminar la operación");
  } finally {
    deleting.value = false;
    confirmationDialog.value = false;
  }
};
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row class="w-100" align="center" no-gutters>
        <v-col cols="12" sm="auto" class="pr-sm-3">
          <div class="text-h6">Operaciones del día</div>
        </v-col>

        <v-col cols="12" sm="auto" class="d-flex justify-sm-end mt-2 mt-sm-0">
          <v-btn color="primary" block class="w-sm-auto" @click="onCreate">
            Registrar operación
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in tableData" :key="item.id">
            <td>{{ item.accountName }}</td>
            <td>{{ item.categoryName }}</td>
            <td>{{ item.conceptName }}</td>
            <td>{{ item.description }}</td>
            <td class="text-end">{{ item.quantity }}</td>
            <td class="text-end">{{ formatMoney(item.amount) }}</td>
            <td class="text-end">{{ formatMoney(item.total) }}</td>

            <td class="text-center">
              <ListMenuWithIcon :menuItems="actionMenu" @onSelect="onSelectAction($event, item)" />

            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-4 text-muted">
              No hay operaciones para mostrar
            </td>
          </tr>
        </template>
      </Table>
    </v-card-text>
  </v-card>

  <CreateEditOperationDialog v-if="createDialog" v-model="createDialog" :operation="selectedOperation"
    @refresh="getOperations" />

  <RemoveItemConfirmationDialog v-model="confirmationDialog" :loading="deleting" @onConfirm="confirmDelete" />

  <input ref="filePicker" type="file" class="d-none" accept="image/*,application/pdf" @change="onPickFileFromModal" />

  <v-dialog v-model="filesDialog" max-width="720">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div>Archivos de la operación</div>

        <v-btn color="primary" :loading="filesUploading" :disabled="filesUploading" @click="triggerPickFile">
          <i class="ph-upload-simple mr-1" /> Subir archivo
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="filesLoading" class="py-6 text-center">
          <v-progress-circular indeterminate />
        </div>

        <div v-else>
          <div v-if="operationFiles.length === 0" class="text-center py-6 text-muted">
            Aún no hay archivos para esta operación.
          </div>

          <v-row v-else dense>
            <v-col v-for="f in operationFiles" :key="f.id" cols="12" sm="6" md="4">
              <v-card class="file-card" elevation="2">

                <!-- Preview -->
                <v-img v-if="isImageFile(f)" :src="getFileUrl(f)" height="160" cover class="cursor-pointer"
                  @click="openPreview(f)" />

                <div v-else class="d-flex flex-column align-center justify-center py-8">
                  <v-icon size="64" color="red" v-if="isPdfFile(f)">mdi-file-pdf-box</v-icon>
                  <v-icon size="64" v-else>mdi-file</v-icon>
                </div>

                <!-- Nombre -->
                <v-card-title class="text-truncate text-subtitle-2">
                  {{ getFileName(f) }}
                </v-card-title>

                <!-- Acciones -->
                <v-card-actions class="justify-space-between">
                  <v-btn variant="text" size="small" @click="isImageFile(f) ? openPreview(f) : openFile(f)">
                    Ver
                  </v-btn>

                  <v-btn variant="text" size="small" color="error" :loading="filesDeleting" :disabled="filesDeleting"
                    @click="deleteFile(f)">
                    Eliminar
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>


        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="closeFilesDialog">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="previewDialog" max-width="900">
    <v-card>
      <v-card-title class="d-flex justify-space-between">
        Vista previa
        <v-btn icon="mdi-close" variant="text" @click="previewDialog = false; previewUrl = ''" />
      </v-card-title>

      <v-card-text>
        <v-img :src="previewUrl" max-height="600" contain />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="primary" @click="previewDialog = false; previewUrl = ''">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>





</template>

<style scoped>
.file-card {
  transition: box-shadow .2s ease, transform .2s ease;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
