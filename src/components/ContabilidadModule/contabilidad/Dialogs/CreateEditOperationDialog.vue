<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import {
  ledgerAccountService,
  conceptService,
  conceptCategoryService,
  operationsService,
  operationImageService,
  userService
} from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

import CreateEditLedgerAccountDialog from "./CreateEditLedgerAccountDialog.vue";
import CreateEditConceptCategoryDialog from "./CreateEditConceptCategoryDialog.vue";
import CreateEditConceptDialog from "./CreateEditConceptDialog.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";

const props = defineProps<{ modelValue: boolean; operation: any | null }>();
const emit = defineEmits(["refresh", "update:modelValue"]);

const dialog = ref(false);
watch(() => props.modelValue, v => (dialog.value = v), { immediate: true });
watch(dialog, v => emit("update:modelValue", v));


/* ---------- Confirmaciones / loaders borrado ---------- */
const confirmDeleteAccountDialog = ref(false);
const deletingAccount = ref(false);
const confirmDeleteCategoryDialog = ref(false);
const deletingCategory = ref(false);

const confirmDeleteConceptDialog = ref(false);
const deletingConcept = ref(false);

const selectedFiles = ref<File[]>([]);
const uploadingFiles = ref(false);

const users = ref<any[]>([]);
const loadingUsers = ref(false);

/* ---------- Form ---------- */
const form = ref({
  accountId: "",
  categoryId: "",
  conceptId: "",
  measurement: "",
  description: "",
  quantity: 1,
  amount: 0,
  operationDate: "",
  idResponsible: ""
});

const resetForm = () => {
  form.value = {
    accountId: "",
    categoryId: "",
    measurement: "",
    conceptId: "",
    description: "",
    quantity: 1,
    amount: 0,
    operationDate: "",
    idResponsible: ""
  };
  selectedFiles.value = [];
};

const onFilesPicked = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  selectedFiles.value = Array.from(files);
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

/* ---------- Catálogos ---------- */
const accounts = ref<any[]>([]);
const categories = ref<any[]>([]);
const concepts = ref<any[]>([]);

/* ---------- Loadings combos ---------- */
const loadingAccounts = ref(false);
const loadingCategories = ref(false);
const loadingConcepts = ref(false);

/* ---------- Guardar ---------- */
const loading = ref(false);
const isEdit = computed(() => !!props.operation?.id);

/* ---------- Dialogos de catálogo ---------- */
const showAccountDialog = ref(false);
const editingAccount = ref<any | null>(null);

const showCategoryDialog = ref(false);
const editingCategory = ref<any | null>(null);

const showConceptDialog = ref(false);
const editingConcept = ref<any | null>(null);

const responsibleRules = computed(() =>
  touched.value.idResponsible ? [req] : []
);

/* ---------- Reglas (reactivas) ---------- */
const touched = ref({
  accountId: false,
  categoryId: false,
  conceptId: false,
  description: false,
  quantity: false,
  amount: false,
  operationDate: false,
  measurement: false,
  idResponsible: false
});

const req = (v: any) => !!v || "Obligatorio";
const reqPositive = (v: any) => (Number(v) > 0) || "Debe ser mayor a 0";

const accountRules = computed(() => (touched.value.accountId ? [req] : []));
const categoryRules = computed(() => (touched.value.categoryId ? [req] : []));
const conceptRules = computed(() => (touched.value.conceptId ? [req] : []));
const descriptionRules = computed(() => (touched.value.description ? [req] : []));
const quantityRules = computed(() => (touched.value.quantity ? [req, reqPositive] : []));
const amountRules = computed(() => (touched.value.amount ? [req, reqPositive] : []));
const dateRules = computed(() => (touched.value.operationDate ? [req] : []));
const unitRules = computed(() => (touched.value.measurement ? [req] : []));
const openMenu = (e: MouseEvent) => {
  // Evita que el click cierre el diálogo o dispare cosas raras
  e.stopPropagation();
};

/* ---------- Validez general (para habilitar Guardar) ---------- */
/* ---------- Validez general (para habilitar Guardar) ---------- */
const isFormValid = computed(() => {
  return (
    !!form.value.accountId &&
    !!form.value.categoryId &&
    !!form.value.idResponsible &&
    !!form.value.conceptId &&
    !!form.value.description &&
    Number(form.value.quantity) > 0 &&
    !!form.value.measurement &&
    Number(form.value.amount) > 0 &&
    !!form.value.operationDate
  );
});

const unitsOfMeasure = [
  // --- Productos / Inventario ---
  { title: 'Pieza (Pz)', value: 'PZ' },
  { title: 'Caja (Cj)', value: 'CJ' },
  { title: 'Paquete (Pqt)', value: 'PQT' },
  { title: 'Servicio (Serv)', value: 'SERV' },

  // --- Peso ---
  { title: 'Kilogramo (Kg)', value: 'KG' },
  { title: 'Gramo (g)', value: 'G' },
  { title: 'Tonelada (Ton)', value: 'TON' },
  { title: 'Libra (Lb)', value: 'LB' },

  // --- Volumen / Líquidos ---
  { title: 'Litro (L)', value: 'L' },
  { title: 'Mililitro (ml)', value: 'ML' },
  { title: 'Galón (Gal)', value: 'GAL' },

  // --- Medidas de Tiempo (Para servicios/honorarios) ---
  { title: 'Hora (Hrs)', value: 'HRS' },
  { title: 'Día (Día)', value: 'DIA' },
  { title: 'Semana', value: 'SEMANA' },
  { title: 'Quincena', value: 'QUINCENA' },
  { title: 'Mes (Mes)', value: 'MES' },

  // --- Longitud / Superficie ---
  { title: 'Metro (m)', value: 'M' },
  { title: 'Metro Cuadrado (m2)', value: 'M2' },
  { title: 'Centímetro (cm)', value: 'CM' },

  // --- Otras ---
  { title: 'Otro / Global', value: 'GLOBAL' }
];

/* ---------- Polarity label ---------- */
const selectedConcept = computed(() =>
  concepts.value.find((c: any) => c.id === form.value.conceptId) || null
);

const onCategorySaved = async () => {
  if (!form.value.accountId) return;
  await reloadCategories(form.value.accountId);
  form.value.categoryId = "";
};

const polarityLabel = computed(() => {
  if (!selectedConcept.value) return "";
  // Ajusta si tu backend usa otra convención:
  // polarity 1 = ingreso, 0 o -1 = egreso
  return selectedConcept.value.polarity === 1 ? "Ingreso" : "Egreso";
});

const polarityAlertType = computed(() => {
  if (!selectedConcept.value) return "info";
  return selectedConcept.value.polarity === 1 ? "success" : "warning";
});

const reloadUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await userService.getUsers();
    users.value = response.data.data;
  } catch {
    showErrorAlert("Error cargando usuarios");
  } finally {
    loadingUsers.value = false;
  }
};

/* ---------- Loaders catálogos ---------- */
const reloadAccounts = async () => {
  loadingAccounts.value = true;
  try {
    const res = await ledgerAccountService.getAccounts();
    accounts.value = res.data.data;
  } finally {
    loadingAccounts.value = false;
  }
};

const reloadCategories = async (accountId?: string) => {
  if (!accountId) {
    categories.value = [];
    return;
  }

  loadingCategories.value = true;
  try {
    const res = await conceptCategoryService.getConceptCategories(
      accountId,
    );
    categories.value = res.data.data;
  } finally {
    loadingCategories.value = false;
  }
};


const reloadConcepts = async () => {
  if (!form.value.categoryId) {
    concepts.value = [];
    return;
  }

  loadingConcepts.value = true;
  try {
    const res = await conceptService.getConcepts(form.value.categoryId);
    concepts.value = res.data.data;
  } finally {
    loadingConcepts.value = false;
  }
};

const uploadDocuments = async (operationId: string) => {
  if (selectedFiles.value.length === 0) return;

  uploadingFiles.value = true;
  try {
    for (const file of selectedFiles.value) {
      // 1. Obtener URL prefirmada
      const presignedRes = await operationImageService.createOperationImage({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        uuidOperation: operationId,
      });

      const presignedUrl = presignedRes.data.data?.presignedUrl;
      if (presignedUrl) {
        // 2. Subir a S3
        await operationImageService.uploadToS3(presignedUrl, file);
      }
    }
  } catch (error) {
    showErrorAlert("La operación se creó, pero algunos archivos no se pudieron subir.");
  } finally {
    uploadingFiles.value = false;
  }
};

onMounted(async () => {
  try {
    await reloadAccounts();
    await reloadCategories();
    await reloadUsers();
  } catch {
    showErrorAlert("Error cargando catálogos");
  }
});

/* ---------- Watchers Modificados ---------- */
/* ---------- Watchers con Debugging ---------- */

// 1. Watcher principal: Hidratación del formulario
watch(
  () => props.operation,
  async (op) => {
    if (!op) {
      resetForm();
      return;
    }

    try {
      // 1️⃣ Cargar categorías según la cuenta seleccionada
      if (op.account?.id) {
        await reloadCategories(op.account.id);
      }

      // 2️⃣ Cargar conceptos según la categoría
      if (op.concept?.conceptCategory?.id) {
        const res = await conceptService.getConcepts(
          op.concept.conceptCategory.id
        );
        concepts.value = res.data.data;
      }

      // 3️⃣ Mapear correctamente usando la estructura REAL del response
      form.value = {
        accountId: op.account?.id || "",
        categoryId: op.concept?.conceptCategory?.id || "",
        conceptId: op.concept?.id || "",
        idResponsible: op.responsible?.id || "",
        description: op.description || "",
        quantity: Number(op.quantity) || 1,
        amount: Number(op.amount) || 0,
        measurement: op.measurement || "GLOBAL",
        operationDate: op.operationDate
          ? op.operationDate.substring(0, 10)
          : "",
      };

    } catch (error) {
      showErrorAlert("Error cargando datos para edición");
    }
  },
  { immediate: true }
);

// 2. Watcher de Cuenta
watch(
  () => form.value.accountId,
  async (newId, oldId) => {
    console.log(`DEBUG: [form.accountId] cambió de ${oldId} a ${newId}`);

    // Si hay un oldId y el nuevo es distinto, el usuario lo cambió a mano
    if (oldId && newId !== oldId) {
      console.log("DEBUG: Cambio manual de cuenta detectado, limpiando hijos.");
      form.value.categoryId = "";
      form.value.conceptId = "";
      concepts.value = [];
    }

    if (!newId) return;

    try {
      loadingCategories.value = true;
      const res = await conceptCategoryService.getConceptCategories(newId);
      categories.value = res.data.data;
    } catch (e) {
      console.error("DEBUG ERROR: Fallo al recargar categorías por cambio de cuenta", e);
    } finally {
      loadingCategories.value = false;
    }
  }
);

// 3. Watcher de Categoría
watch(
  () => form.value.categoryId,
  async (newId, oldId) => {
    console.log(`DEBUG: [form.categoryId] cambió de ${oldId} a ${newId}`);

    if (oldId && newId !== oldId) {
      console.log("DEBUG: Cambio manual de categoría detectado, limpiando conceptos.");
      form.value.conceptId = "";
    }

    if (!newId) return;

    try {
      loadingConcepts.value = true;
      const res = await conceptService.getConcepts(newId);
      concepts.value = res.data.data;
    } catch (e) {
      console.error("DEBUG ERROR: Fallo al recargar conceptos por cambio de categoría", e);
    } finally {
      loadingConcepts.value = false;
    }
  }
);


/* ---------- Acciones Cuenta ---------- */

const newAccount = () => {
  editingAccount.value = null; // 🔥 CLAVE
  showAccountDialog.value = true;
};

const editAccount = () => {
  editingAccount.value = accounts.value.find(a => a.id === form.value.accountId) || null;
  showAccountDialog.value = true;
};
const askDeleteAccount = () => {
  if (!form.value.accountId) return;
  confirmDeleteAccountDialog.value = true;
};

const confirmDeleteAccount = async () => {
  try {
    deletingAccount.value = true;
    await ledgerAccountService.deleteAccount(form.value.accountId);
    showSuccessAlert("Cuenta eliminada");
    form.value.accountId = "";
    await reloadAccounts();
  } catch {
    showErrorAlert("Error al eliminar cuenta");
  } finally {
    deletingAccount.value = false;
    confirmDeleteAccountDialog.value = false;
  }
};

/* ---------- Acciones Categoría ---------- */

const newCategory = () => {
  editingCategory.value = null;
  showCategoryDialog.value = true;
};


const editCategory = () => {
  editingCategory.value = categories.value.find(c => c.id === form.value.categoryId) || null;
  showCategoryDialog.value = true;
};

const askDeleteCategory = () => {
  if (!form.value.categoryId) return;
  confirmDeleteCategoryDialog.value = true;
};
const confirmDeleteCategory = async () => {
  try {
    deletingCategory.value = true;

    // 1. Ejecutar el borrado
    await conceptCategoryService.deleteConceptCategory(form.value.categoryId);

    showSuccessAlert("Categoría eliminada");

    // 2. Limpiar la selección actual y los conceptos dependientes
    form.value.categoryId = "";
    form.value.conceptId = "";
    concepts.value = [];

    // 3. RECARGAR usando .value (Aquí estaba el error)
    await reloadCategories(form.value.accountId);

  } catch (error) {
    showErrorAlert("Error al eliminar categoría");
    console.error(error);
  } finally {
    deletingCategory.value = false;
    confirmDeleteCategoryDialog.value = false;
  }
};

/* ---------- Acciones Concepto ---------- */
const newConcept = () => { editingConcept.value = null; showConceptDialog.value = true; };
const editConcept = () => {
  editingConcept.value = concepts.value.find(c => c.id === form.value.conceptId) || null;
  showConceptDialog.value = true;
};

const askDeleteConcept = () => {
  if (!form.value.conceptId) return;
  confirmDeleteConceptDialog.value = true;
};

const confirmDeleteConcept = async () => {
  try {
    deletingConcept.value = true;
    await conceptService.deleteConcept(form.value.conceptId);
    showSuccessAlert("Concepto eliminado");
    form.value.conceptId = "";
    await reloadConcepts();
  } catch {
    showErrorAlert("Error al eliminar concepto");
  } finally {
    deletingConcept.value = false;
    confirmDeleteConceptDialog.value = false;
  }
};

/* ---------- Guardar ---------- */
const save = async () => {
  // Marcamos todos los campos como tocados para validación visual
  touched.value = {
    accountId: true,
    categoryId: true,
    conceptId: true,
    description: true,
    quantity: true,
    amount: true,
    measurement: true,
    operationDate: true,
    idResponsible: true
  };

  if (!isFormValid.value) {
    return showErrorAlert("Por favor, completa los campos requeridos.");
  }

  try {
    loading.value = true;

    // Construcción del payload limpio
    const payload = {
      idAccount: form.value.accountId,
      idConcept: form.value.conceptId,
      idResponsible: form.value.idResponsible,
      description: form.value.description,
      amount: Number(form.value.amount),
      quantity: Number(form.value.quantity),
      measurement: form.value.measurement,
      // Formato de fecha ISO para el backend
      operationDate: `${form.value.operationDate}T00:00:00`
    };

    if (isEdit.value && props.operation?.id) {
      /* ---------- MODO EDICIÓN ---------- */
      await operationsService.updateOperation(props.operation.id, payload);
      showSuccessAlert("Operación actualizada correctamente");
    } else {
      /* ---------- MODO CREACIÓN ---------- */
      const res = await operationsService.createOperation(payload);
      const newOperationId = res.data.data.id;

      // Solo subimos documentos si es una creación nueva
      if (selectedFiles.value.length > 0) {
        await uploadDocuments(newOperationId);
      }
      showSuccessAlert("Operación registrada correctamente");
    }

    emit("refresh");
    dialog.value = false;
    resetForm();
  } catch (error: any) {
    // Captura de errores de validación del servidor (Constraints)
    const serverMsg = error.response?.data?.message;
    showErrorAlert(Array.isArray(serverMsg) ? serverMsg[0] : serverMsg || "Error al procesar la operación");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="650px">
    <v-card>
      <v-card-title>{{ isEdit ? "Editar operación" : "Registrar operación" }}</v-card-title>

      <v-card-text>
        <div class="row">
          <v-autocomplete v-model="form.accountId" label="Cuenta *" :items="accounts" item-title="name" item-value="id"
            :loading="loadingAccounts" :rules="accountRules" @blur="touched.accountId = true"
            class="flex-1 text-uppercase" clearable auto-select-first />

          <!-- Acción principal -->
          <v-btn icon variant="text" @click="newAccount" aria-label="Agregar cuenta">
            <v-icon>mdi-plus</v-icon>
          </v-btn>

          <!-- Menú 3 puntos -->
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn icon variant="text" v-bind="menuProps" :disabled="!form.accountId" @click="openMenu"
                aria-label="Más acciones cuenta">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list density="compact">
              <v-list-item @click="editAccount" :disabled="!form.accountId">
                <template #prepend><v-icon size="18">mdi-pencil</v-icon></template>
                <v-list-item-title>Editar</v-list-item-title>
              </v-list-item>

              <v-list-item @click="askDeleteAccount" :disabled="!form.accountId">
                <template #prepend><v-icon size="18" color="error">mdi-delete</v-icon></template>
                <v-list-item-title class="text-error">Eliminar</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div class="row">
          <v-autocomplete v-model="form.categoryId" label="Categoría *" :items="categories" item-title="name"
            item-value="id" :loading="loadingCategories" :rules="categoryRules" :disabled="!form.accountId"
            class="flex-1 text-uppercase" clearable auto-select-first />


          <v-btn icon variant="text" :disabled="!form.accountId" @click="newCategory" aria-label="Agregar categoría">
            <v-icon>mdi-plus</v-icon>
          </v-btn>

          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn icon variant="text" v-bind="menuProps" :disabled="!form.accountId || !form.categoryId"
                @click="openMenu">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list density="compact">
              <v-list-item @click="editCategory" :disabled="!form.categoryId">
                <template #prepend><v-icon size="18">mdi-pencil</v-icon></template>
                <v-list-item-title>Editar</v-list-item-title>
              </v-list-item>

              <v-list-item @click="askDeleteCategory" :disabled="!form.categoryId">
                <template #prepend><v-icon size="18" color="error">mdi-delete</v-icon></template>
                <v-list-item-title class="text-error">Eliminar</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div class="row">
          <v-autocomplete v-model="form.conceptId" label="Concepto *" :items="concepts" item-title="name"
            item-value="id" :disabled="!form.categoryId" :loading="loadingConcepts" :rules="conceptRules"
            @blur="touched.conceptId = true" class="flex-1 text-uppercase" clearable auto-select-first />

          <v-btn icon variant="text" :disabled="!form.categoryId" @click="newConcept" aria-label="Agregar concepto">
            <v-icon>mdi-plus</v-icon>
          </v-btn>

          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn icon variant="text" v-bind="menuProps" :disabled="!form.conceptId" @click="openMenu"
                aria-label="Más acciones concepto">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list density="compact">
              <v-list-item @click="editConcept" :disabled="!form.conceptId">
                <template #prepend><v-icon size="18">mdi-pencil</v-icon></template>
                <v-list-item-title>Editar</v-list-item-title>
              </v-list-item>

              <v-list-item @click="askDeleteConcept" :disabled="!form.conceptId">
                <template #prepend><v-icon size="18" color="error">mdi-delete</v-icon></template>
                <v-list-item-title class="text-error">Eliminar</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>


        <v-alert v-if="polarityLabel" :type="polarityAlertType" density="compact" class="mb-3">
          Este concepto corresponde a un <b>{{ polarityLabel }}</b>.
        </v-alert>

        <v-text-field label="Comentarios *" v-model="form.description" :rules="descriptionRules"
          @blur="touched.description = true" />

        <div class="row">
          <v-text-field type="number" label="Cantidad *" v-model.number="form.quantity" :rules="quantityRules"
            @blur="touched.quantity = true" class="flex-1" />

          <v-autocomplete label="Unidad de Medida *" v-model="form.measurement" :items="unitsOfMeasure"
            item-title="title" item-value="value" :rules="unitRules" @blur="touched.measurement = true"
            class="flex-grow-1 text-uppercase" auto-select-first clearable />
        </div>

        <v-text-field type="number" label="Monto *" v-model.number="form.amount" :rules="amountRules"
          @blur="touched.amount = true" />


        <v-text-field type="date" label="Fecha *" v-model="form.operationDate" :rules="dateRules"
          @blur="touched.operationDate = true" />


        <v-autocomplete v-model="form.idResponsible" label="Responsable *" :items="users" item-title="name"
          item-value="id" :loading="loadingUsers" :rules="responsibleRules" @blur="touched.idResponsible = true"
          class="text-uppercase" clearable auto-select-first>

        </v-autocomplete>
        <template v-if="!isEdit">


          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-2 mb-2">Documentos adjuntos (opcional)</div>

          <v-file-input v-model="selectedFiles" label="Seleccionar documentos" prepend-icon="mdi-paperclip"
            variant="outlined" density="comfortable" multiple chips counter show-size accept="image/*,application/pdf"
            :loading="uploadingFiles" hint="Puedes subir imágenes o PDFs" persistent-hint>
            <template v-slot:selection="{ fileNames }">
              <template v-for="(fileName, index) in fileNames" :key="fileName">
                <v-chip size="small" label color="primary" class="me-2" closable @click:close="removeFile(index)">
                  {{ fileName }}
                </v-chip>
              </template>
            </template>
          </v-file-input>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!isFormValid" @click="save">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <CreateEditLedgerAccountDialog v-model="showAccountDialog" :account="editingAccount" @refresh="reloadAccounts" />
  <CreateEditConceptCategoryDialog v-model="showCategoryDialog" :category="editingCategory" :accountId="form.accountId"
    @refresh="onCategorySaved" />
  <CreateEditConceptDialog v-model="showConceptDialog" :concept="editingConcept" :categoryId="form.categoryId"
    @refresh="reloadConcepts" />

  <RemoveItemConfirmationDialog v-model="confirmDeleteAccountDialog" :loading="deletingAccount" title="Eliminar cuenta"
    message="¿Seguro que deseas eliminar esta cuenta? Esta acción no se puede deshacer."
    @onConfirm="confirmDeleteAccount" />
  <RemoveItemConfirmationDialog v-model="confirmDeleteCategoryDialog" :loading="deletingCategory"
    title="Eliminar categoría" message="¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer."
    @onConfirm="confirmDeleteCategory" />
  <RemoveItemConfirmationDialog v-model="confirmDeleteConceptDialog" :loading="deletingConcept"
    title="Eliminar concepto" message="¿Seguro que deseas eliminar este concepto? Esta acción no se puede deshacer."
    @onConfirm="confirmDeleteConcept" />
</template>

<style scoped>
.row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
}

.flex-1 {
  flex: 1;
  min-width: 0;
  /* importante para que no rompa */
}

/* 1. Forzar texto en mayúsculas en el input mientras escribes */
:deep(.v-field__input),
:deep(.v-field__input input) {
  text-transform: uppercase !important;
}

/* 2. Forzar el texto que ya está seleccionado (el valor del autocomplete) */
:deep(.v-autocomplete__selection-text),
:deep(.v-select__selection-text) {
  text-transform: uppercase !important;
}



/* 4. Clase utilitaria para el template */
.text-uppercase {
  text-transform: uppercase;
}
</style>
