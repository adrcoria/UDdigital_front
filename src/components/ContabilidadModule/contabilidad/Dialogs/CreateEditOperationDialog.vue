<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import {
  ledgerAccountService,
  conceptService,
  conceptCategoryService,
  operationsService
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

/* ---------- Form ---------- */
const form = ref({
  accountId: "",
  categoryId: "",
  conceptId: "",
  description: "",
  quantity: 1,
  amount: 0,
  operationDate: "" // SOLO FECHA: YYYY-MM-DD
});

const resetForm = () => {
  form.value = {
    accountId: "",
    categoryId: "",
    conceptId: "",
    description: "",
    quantity: 1,
    amount: 0,
    operationDate: ""
  };
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

/* ---------- Reglas (reactivas) ---------- */
const touched = ref({
  accountId: false,
  categoryId: false,
  conceptId: false,
  description: false,
  quantity: false,
  amount: false,
  operationDate: false
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

/* ---------- Validez general (para habilitar Guardar) ---------- */
const isFormValid = computed(() => {
  return (
    !!form.value.accountId &&
    !!form.value.categoryId &&
    !!form.value.conceptId &&
    !!form.value.description &&
    Number(form.value.quantity) > 0 &&
    Number(form.value.amount) > 0 &&
    !!form.value.operationDate
  );
});

/* ---------- Polarity label ---------- */
const selectedConcept = computed(() =>
  concepts.value.find((c: any) => c.id === form.value.conceptId) || null
);

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

const reloadCategories = async () => {
  loadingCategories.value = true;
  try {
    const res = await conceptCategoryService.getConceptCategories();
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

onMounted(async () => {
  try {
    await reloadAccounts();
    await reloadCategories();
  } catch {
    showErrorAlert("Error cargando catálogos");
  }
});

/* ---------- Watch: categoría -> conceptos ---------- */
watch(
  () => form.value.categoryId,
  async (newId) => {
    form.value.conceptId = ""; // Limpia concepto al cambiar categoría

    if (!newId) {
      concepts.value = [];
      return;
    }

    try {
      loadingConcepts.value = true;
      const res = await conceptService.getConcepts(newId); // ✅ manda el id
      concepts.value = res.data.data;
    } catch {
      showErrorAlert("No se pudieron cargar los conceptos");
    } finally {
      loadingConcepts.value = false;
    }
  }
);

/* ---------- Watch: editar operación ---------- */
watch(
  () => props.operation,
  async (op) => {
    if (op) {
      // OJO: aquí respeto tu estructura original, pero corrigiendo FECHA a substring(0,10)
      form.value = {
        accountId: op.idAccount,
        categoryId: op.concept?.idConceptCategory, // tu original
        conceptId: op.idConcept,
        description: op.description,
        quantity: op.quantity || 1,
        amount: Number(op.amount),
        operationDate: op.operationDate?.substring(0, 10), // ✅ SOLO FECHA
      };

      // Si entramos en edición, necesitamos cargar conceptos de esa categoría
      if (form.value.categoryId) {
        try {
          loadingConcepts.value = true;
          const res = await conceptService.getConcepts(form.value.categoryId);
          concepts.value = res.data.data;
        } finally {
          loadingConcepts.value = false;
        }
      }
    } else {
      resetForm();
      concepts.value = [];
      touched.value = {
        accountId: false,
        categoryId: false,
        conceptId: false,
        description: false,
        quantity: false,
        amount: false,
        operationDate: false
      };
    }
  },
  { immediate: true }
);

/* ---------- Acciones Cuenta ---------- */
const newAccount = () => { editingAccount.value = null; showAccountDialog.value = true; };
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
const newCategory = () => { editingCategory.value = null; showCategoryDialog.value = true; };
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
    await conceptCategoryService.deleteConceptCategory(form.value.categoryId);
    showSuccessAlert("Categoría eliminada");
    form.value.categoryId = "";
    concepts.value = [];
    await reloadCategories();
  } catch {
    showErrorAlert("Error al eliminar categoría");
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
  // Reactivo = no “mensaje al final”. Aquí solo marco touched para que pinte errores.
  touched.value = {
    accountId: true,
    categoryId: true,
    conceptId: true,
    description: true,
    quantity: true,
    amount: true,
    operationDate: true
  };

  if (!isFormValid.value) return;

  try {
    loading.value = true;

    const payload = {
      idAccount: form.value.accountId,
      idConcept: form.value.conceptId,
      description: form.value.description,
      amount: Number(form.value.amount),
      quantity: Number(form.value.quantity),
      // backend swagger pide operationDate tipo datetime; mandamos FECHA con hora 00:00:00
      operationDate: `${form.value.operationDate}T00:00:00`
    };

    if (isEdit.value && props.operation) {
      await operationsService.updateOperation(props.operation.id, payload);
      showSuccessAlert("Operación actualizada");
    } else {
      await operationsService.createOperation(payload);
      showSuccessAlert("Operación registrada");
    }

    emit("refresh");
    dialog.value = false;
    resetForm();
    concepts.value = [];
    touched.value = {
      accountId: false,
      categoryId: false,
      conceptId: false,
      description: false,
      quantity: false,
      amount: false,
      operationDate: false
    };
  } catch {
    showErrorAlert("Error al guardar operación");
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
          <v-select
            v-model="form.accountId"
            label="Cuenta *"
            :items="accounts"
            item-title="name"
            item-value="id"
            :loading="loadingAccounts"
            :rules="accountRules"
            @blur="touched.accountId = true"
          />
          <v-btn icon @click="newAccount"><v-icon>mdi-plus</v-icon></v-btn>
          <v-btn icon :disabled="!form.accountId" @click="editAccount"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn icon :disabled="!form.accountId" @click="askDeleteAccount">
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
        </div>

        <div class="row">
          <v-select
            v-model="form.categoryId"
            label="Categoría *"
            :items="categories"
            item-title="name"
            item-value="id"
            :loading="loadingCategories"
            :rules="categoryRules"
            @blur="touched.categoryId = true"
          />
          <v-btn icon @click="newCategory"><v-icon>mdi-plus</v-icon></v-btn>
          <v-btn icon :disabled="!form.categoryId" @click="editCategory"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn icon :disabled="!form.categoryId" @click="askDeleteCategory">
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
        </div>

        <div class="row">
          <v-select
            v-model="form.conceptId"
            label="Concepto *"
            :items="concepts"
            item-title="name"
            item-value="id"
            :disabled="!form.categoryId"
            :loading="loadingConcepts"
            :rules="conceptRules"
            @blur="touched.conceptId = true"
          />
          <v-btn icon :disabled="!form.categoryId" @click="newConcept"><v-icon>mdi-plus</v-icon></v-btn>
          <v-btn icon :disabled="!form.conceptId" @click="editConcept"><v-icon>mdi-pencil</v-icon></v-btn>
          <v-btn icon :disabled="!form.conceptId" @click="askDeleteConcept">
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
        </div>

        <v-alert
          v-if="polarityLabel"
          :type="polarityAlertType"
          density="compact"
          class="mb-3"
        >
          Este concepto corresponde a un <b>{{ polarityLabel }}</b>.
        </v-alert>

        <v-text-field
          label="Descripción *"
          v-model="form.description"
          :rules="descriptionRules"
          @blur="touched.description = true"
        />
        <v-text-field
          type="number"
          label="Cantidad *"
          v-model.number="form.quantity"
          :rules="quantityRules"
          @blur="touched.quantity = true"
        />
        <v-text-field
          type="number"
          label="Monto *"
          v-model.number="form.amount"
          :rules="amountRules"
          @blur="touched.amount = true"
        />
        <v-text-field
          type="date"
          label="Fecha *"
          v-model="form.operationDate"
          :rules="dateRules"
          @blur="touched.operationDate = true"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!isFormValid"
          @click="save"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <CreateEditLedgerAccountDialog
    v-model="showAccountDialog"
    :account="editingAccount"
    @refresh="reloadAccounts"
  />
  <CreateEditConceptCategoryDialog
    v-model="showCategoryDialog"
    :category="editingCategory"
    @refresh="reloadCategories"
  />
  <CreateEditConceptDialog
    v-model="showConceptDialog"
    :concept="editingConcept"
    :categoryId="form.categoryId"
    @refresh="reloadConcepts"
  />

  <RemoveItemConfirmationDialog
    v-model="confirmDeleteAccountDialog"
    :loading="deletingAccount"
    title="Eliminar cuenta"
    message="¿Seguro que deseas eliminar esta cuenta? Esta acción no se puede deshacer."
    @onConfirm="confirmDeleteAccount"
  />
  <RemoveItemConfirmationDialog
    v-model="confirmDeleteCategoryDialog"
    :loading="deletingCategory"
    title="Eliminar categoría"
    message="¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer."
    @onConfirm="confirmDeleteCategory"
  />
  <RemoveItemConfirmationDialog
    v-model="confirmDeleteConceptDialog"
    :loading="deletingConcept"
    title="Eliminar concepto"
    message="¿Seguro que deseas eliminar este concepto? Esta acción no se puede deshacer."
    @onConfirm="confirmDeleteConcept"
  />
</template>

<style scoped>
.row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
}
</style>
