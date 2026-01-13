<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import Table from "@/app/common/components/Table.vue";
import CreateEditOperationDialog from "./Dialogs/CreateEditOperationDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { canManageAll, isCapturista } from "@/app/utils/authHelper";

import {
  ledgerAccountService,
  conceptCategoryService,
  operationsService,
  operationImageService,
  conceptService,
  reportService,
  companyService, // ajusta el nombre real
} from "@/app/http/httpServiceProvider";

const getStoredUser = () => {
  return (
    localStorage.getItem("user") ||
    sessionStorage.getItem("user")
  );
};



/* ------------------ Props ------------------ */
const props = defineProps<{
  filters: {
    query: string;
  };
}>();

const getTodayDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  // Los meses en JS empiezan en 0, por eso sumamos 1
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const canDeleteItem = (operationDate: string | Date) => {
  if (canManageAll()) return true; // Super User y Admin pueden borrar lo que sea

  if (isCapturista()) {
    const today = getTodayDate(); // "YYYY-MM-DD"
    const itemDate = new Date(operationDate).toISOString().split('T')[0];
    return itemDate === today;
  }
  return false;
};

const getActionMenu = (item: any) => {
  const menu = [{ title: "Archivos", icon: "ph-paperclip", value: "files" }];

  // Si tiene permiso de borrar, añadimos la opción al menú
  if (canDeleteItem(item.operationDate)) {
    menu.push({ title: "Eliminar", icon: "ph-trash", value: "delete" });
  }

  return menu;
};


const filtersForm = ref({
  dateFrom: getTodayDate(),
  dateTo: getTodayDate(),
  accountId: "",
  categoryId: "",
  conceptId: "",
  companyId: "",
});

const accounts = ref<any[]>([]);
const categories = ref<any[]>([]);
const concepts = ref<any[]>([]);
const companies = ref<any[]>([]);

const loadingAccounts = ref(false);
const loadingCategories = ref(false);
const loadingConcepts = ref(false);
const loadingCompanies = ref(false);
const showFilters = ref(false);
const exporting = ref(false);

const formatMoney = (value: number | string) => {
  const num = Number(value || 0);
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};


const formatDate = (value: string | Date) => {
  if (!value) return "";
  const date = new Date(value);

  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/* ------------------ State ------------------ */
const operations = ref<any[]>([]);
// const tableData = ref<any[]>([]);
const tableData = computed(() => {
  const query = props.filters.query?.toLowerCase().trim();

  if (!query) {
    return operations.value;
  }

  return operations.value.filter((item) => {
    // Aquí defines en qué columnas quieres buscar
    return (
      item.accountName?.toLowerCase().includes(query) ||
      item.categoryName?.toLowerCase().includes(query) ||
      item.conceptName?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.amount?.toString().includes(query)
    );
  });
});

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
  { title: "Total operación" },
  { title: "Total posterior" },
  { title: "Fecha" },
  { title: "Acciones" },
];

const actionMenu = [
  { title: "Archivos", icon: "ph-paperclip", value: "files" },
  { title: "Eliminar", icon: "ph-trash", value: "delete" },
];




/* ------------------ Pagination ------------------ */

const applyFilters = () => {
  page.value = 1;
  getOperations();
};


const clearFilters = () => {
  filtersForm.value = {
    dateFrom: getTodayDate(),
    dateTo: getTodayDate(),
    accountId: "",
    categoryId: "",
    conceptId: "",
    companyId: "",
  };
  page.value = 1;
  getOperations();
};

const onExport = async () => {
  try {
    exporting.value = true;

    // Reutilizamos los mismos parámetros que usas en getOperations
    const params = {
      startDate: filtersForm.value.dateFrom || undefined,
      endDate: filtersForm.value.dateTo || undefined,
    };

    const res = await reportService.exportOperationsExcel(params);

    // Crear un link temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;

    // Nombre del archivo con la fecha actual
    const fileName = `reporte_operaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.setAttribute("download", fileName);

    document.body.appendChild(link);
    link.click();

    // Limpieza
    link.remove();
    window.URL.revokeObjectURL(url);

    showSuccessAlert("Excel generado correctamente");
  } catch (error) {
    console.error("Export error:", error);
    showErrorAlert("No se pudo exportar el archivo");
  } finally {
    exporting.value = false;
  }
};


const onExportSummary = async () => {
  try {
    exporting.value = true;

    // Reutilizamos los mismos parámetros que usas en getOperations
    const params = {
      startDate: filtersForm.value.dateFrom || undefined,
      endDate: filtersForm.value.dateTo || undefined,
    };

    const res = await reportService.exportOperationsExcelSummary(params);

    // Crear un link temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;

    // Nombre del archivo con la fecha actual
    const fileName = `reporte_operaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.setAttribute("download", fileName);

    document.body.appendChild(link);
    link.click();

    // Limpieza
    link.remove();
    window.URL.revokeObjectURL(url);

    showSuccessAlert("Excel generado correctamente");
  } catch (error) {
    console.error("Export error:", error);
    showErrorAlert("No se pudo exportar el archivo");
  } finally {
    exporting.value = false;
  }
};


/* ------------------ Data ------------------ */
const loadAccounts = async () => {
  try {
    loadingAccounts.value = true;
    const res = await ledgerAccountService.getAccounts();
    accounts.value = res.data.data;
  } finally {
    loadingAccounts.value = false;
  }
};

const loadCategories = async () => {
  try {
    loadingCategories.value = true;
    const res = await conceptCategoryService.getConceptCategories();
    categories.value = res.data.data;
  } finally {
    loadingCategories.value = false;
  }
};


const loadCompanies = async () => {
  try {
    loadingCompanies.value = true;
    const res = await companyService.getCompanies();
    companies.value = res.data.data;
  } finally {
    loadingCompanies.value = false;
  }
};


const loadConcepts = async (categoryId: string) => {
  if (!categoryId) {
    concepts.value = [];
    return;
  }

  try {
    loadingConcepts.value = true;
    const res = await conceptService.getConcepts(categoryId);
    concepts.value = res.data.data;
  } finally {
    loadingConcepts.value = false;
  }
};


const getOperations = async () => {
  try {
    loading.value = true;

    const params = {
      dateInit: filtersForm.value.dateFrom || undefined,
      dateEnd: filtersForm.value.dateTo || undefined,
      idAccount: filtersForm.value.accountId || undefined,
      idConceptCategory: filtersForm.value.categoryId || undefined,
      idConcept: filtersForm.value.conceptId || undefined,
      idCompany: filtersForm.value.companyId || undefined,
      page: page.value,
      limit: config.value.itemsPerPage,
    };

    const res = await operationsService.getOperations(params);
    const payload = res.data.data;

    operations.value = payload.data.map((op: any) => {
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
        total: Number((amount * quantity * polarity).toFixed(2)),
      };
    });

    // 🔥 IMPORTANTE
    //tableData.value = operations.value;

    config.value = {
      ...config.value,
      noOfItems: payload.total,
      page: payload.page,
    };

  } catch (error) {
    console.error("getOperations error:", error);
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


onMounted(async () => {
  await Promise.all([
    loadAccounts(),
    loadCategories(),
    loadCompanies(),
  ]);

  await getOperations();
});




watch(
  () => filtersForm.value.categoryId,
  async (newCategoryId) => {
    filtersForm.value.conceptId = "";
    await loadConcepts(newCategoryId);
  }
);

watch(
  () => filtersForm.value.accountId,
  async (newAccountId) => {
    filtersForm.value.categoryId = "";
    filtersForm.value.conceptId = "";
    categories.value = [];
    concepts.value = [];

    if (!newAccountId) return;

    try {
      const res = await conceptCategoryService.getConceptCategories(
        newAccountId,
      );
      categories.value = res.data.data;
    } catch {
      showErrorAlert("No se pudieron cargar las categorías");
    }
  }
);



watch(page, () => {
  getOperations();
});

watch(
  () => config.value.itemsPerPage,
  () => {
    page.value = 1;
    getOperations();
  }
);

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

        <v-col cols="12" sm="auto">
          <v-btn variant="tonal" :color="showFilters ? 'primary' : 'default'" prepend-icon="ph-funnel"
            @click="showFilters = !showFilters">
            {{ showFilters ? 'Ocultar filtros' : 'Filtrar' }}
          </v-btn>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="12" sm="auto" class="d-flex ga-2 justify-sm-end mt-2 mt-sm-0">


          <v-btn color="primary" @click="onCreate">
            Registrar operación
          </v-btn>
          <v-btn v-if="canManageAll()" variant="outlined" color="success" prepend-icon="ph-file-xls"
            :loading="exporting" @click="onExport">
            Exportar operaciones
          </v-btn>
          <v-btn v-if="canManageAll()" variant="outlined" color="success" prepend-icon="ph-file-xls"
            :loading="exporting" @click="onExportSummary">
            Exportar resumen de operaciones
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <v-card v-show="showFilters" variant="flat" border class="mb-6 bg-grey-lighten-4">
        <v-card-text>
          <v-row dense align="center">
            <v-col cols="12" sm="6" md="2">
              <v-text-field type="date" label="Fecha inicio" v-model="filtersForm.dateFrom" variant="outlined"
                density="comfortable" hide-details bg-color="white" />
            </v-col>

            <v-col cols="12" sm="6" md="2">
              <v-text-field type="date" label="Fecha fin" v-model="filtersForm.dateTo" variant="outlined"
                density="comfortable" hide-details bg-color="white" />
            </v-col>

            <v-col cols="12" sm="4" md="2">
              <v-select label="Cuenta" :items="accounts" item-title="name" item-value="id"
                v-model="filtersForm.accountId" clearable :loading="loadingAccounts" variant="outlined"
                density="comfortable" hide-details bg-color="white" />
            </v-col>

            <v-col cols="12" sm="4" md="2">
              <v-select label="Categoría" :items="categories" item-title="name" item-value="id"
                v-model="filtersForm.categoryId" clearable :loading="loadingCategories" variant="outlined"
                density="comfortable" hide-details bg-color="white" />
            </v-col>

            <v-col cols="12" sm="4" md="2">
              <v-select label="Concepto" :items="concepts" item-title="name" item-value="id"
                v-model="filtersForm.conceptId" :disabled="!filtersForm.categoryId" clearable :loading="loadingConcepts"
                variant="outlined" density="comfortable" hide-details bg-color="white" />
            </v-col>

            <v-col cols="12" md="2" class="d-flex ga-2 pt-md-0 pt-4">
              <v-btn color="primary" @click="applyFilters" flat height="48" class="flex-grow-1">
                Aplicar
              </v-btn>
              <v-btn variant="tonal" @click="clearFilters" height="48" icon="ph-eraser" title="Limpiar filtros" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
        <template #body>
          <tr v-for="item in tableData" :key="item.id">
            <td>{{ item.accountName }}</td>
            <td>{{ item.categoryName }}</td>
            <td>{{ item.conceptName }}</td>
            <td>{{ item.description }}</td>
            <td class="text-end">{{ item.quantity }} {{ item.measurement }}</td>
            <td class="text-end">{{ formatMoney(item.amount) }}</td>
            <td class="text-end">{{ formatMoney(item.total) }}</td>
            <td class="text-end">{{ formatMoney(item.balanceAfter) }}</td>
            <td class="text-end">{{ formatDate(item.operationDate) }}</td>

            <td class="text-center">
              <ListMenuWithIcon :menuItems="getActionMenu(item)" @onSelect="onSelectAction($event, item)" />
            </td>
          </tr>

          <tr v-if="!loading && tableData.length === 0">
            <td :colspan="headers.length" class="text-center py-4 text-muted">
              No hay operaciones para mostrar
            </td>
          </tr>
        </template>
      </Table>
      <div style="width: 100px;">
        <v-select label="Ver" :items="[10, 25, 50]" v-model="config.itemsPerPage" variant="underlined" density="compact"
          hide-details />
      </div>
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

                  <v-btn v-if="canDeleteItem(selectedForFiles?.operationDate)" variant="text" size="small" color="error"
                    :loading="filesDeleting" :disabled="filesDeleting" @click="deleteFile(f)">
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

th,
td {
  text-align: left !important;
  vertical-align: middle;
}
</style>
