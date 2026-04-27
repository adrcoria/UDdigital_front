<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { usuariosService, companyService, roleService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { isSuperUser, getCompanyId, ROLES } from "@/app/utils/authHelper";

const DEFAULT_PASSWORD = "T12345678w";

const props = defineProps<{ modelValue: boolean; user: any | null }>();
const emit = defineEmits(["refresh", "update:modelValue"]);

const dialog = ref(false);
watch(() => props.modelValue, v => (dialog.value = v), { immediate: true });
watch(dialog, v => emit("update:modelValue", v));

/* ---------- Form State ---------- */
const form = ref({
  mail: "",
  name: "",
  lastName: "",
  phone: "",
  roleId: "",
  companyId: "",
});

const touched = ref({
  mail: false,
  name: false,
  lastName: false,
  phone: false,
  roleId: false,
  companyId: false,
});

/* ---------- Utilidades ---------- */
const formatPhone = (val: string) => {
  if (!val) return "";
  const numbers = val.replace(/\D/g, "").slice(0, 10);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

const resetForm = () => {
  form.value = {
    mail: "",
    name: "",
    lastName: "",
    phone: "",
    roleId: "",
    companyId: !isSuperUser() ? (getCompanyId() || "") : "",
  };
  Object.keys(touched.value).forEach(k => touched.value[k as keyof typeof touched.value] = false);
};

/* ---------- Catálogos ---------- */
const companies = ref<any[]>([]);
const allRoles = ref<any[]>([]);
const loadingOptions = ref(false);

const filteredRoles = computed(() => {
  const baseRoles = isSuperUser() ? allRoles.value : allRoles.value.filter(role => role.id !== ROLES.SUPER_USER);
  return [...baseRoles].sort((a, b) => a.name.localeCompare(b.name));
});

/* ---------- Loaders ---------- */
const loadOptions = async () => {
  loadingOptions.value = true;
  try {
    const [resCompanies, resRoles] = await Promise.all([
      companyService.getCompanies(),
      roleService.getRoles(),
    ]);
    companies.value = (resCompanies.data.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name));
    allRoles.value = resRoles.data.data || [];
  } finally {
    loadingOptions.value = false;
  }
};

const isEdit = computed(() => !!props.user?.id);
const loading = ref(false);

/* ---------- Validaciones ---------- */
const req = (v: any) => !!v || "Obligatorio";
const emailRule = (v: string) => (v && v.length > 2) || "Usuario demasiado corto";
const phoneRule = (v: string) => {
  const digits = (v || "").replace(/\D/g, "");
  return digits.length === 10 || "Deben ser 10 dígitos";
};

const nameRules = computed(() => touched.value.name ? [req] : []);
const lastNameRules = computed(() => touched.value.lastName ? [req] : []);
const mailRules = computed(() => touched.value.mail ? [req, emailRule] : []);
const phoneRules = computed(() => touched.value.phone ? [req, phoneRule] : []);
const roleRules = computed(() => touched.value.roleId ? [req] : []);
const companyRules = computed(() => touched.value.companyId ? [req] : []);

const isFormValid = computed(() => {
  const digits = (form.value.phone || "").replace(/\D/g, "");
  return !!form.value.name?.trim() &&
    !!form.value.lastName?.trim() &&
    !!form.value.mail?.trim() &&
    !!form.value.roleId &&
    !!form.value.companyId &&
    digits.length === 10;
});

/* ---------- Watchers ---------- */
watch(() => props.user, (u) => {
  if (u) {
    form.value = {
      mail: u.mail || "",
      name: u.name || "",
      lastName: u.lastName || "",
      phone: formatPhone(u.phone || ""),
      roleId: u.roleId || u.role?.id || "",
      companyId: u.companyId || u.company?.id || "",
    };
  } else {
    resetForm();
  }
}, { immediate: true });

onMounted(() => loadOptions());

const save = async () => {
  Object.keys(touched.value).forEach(k => touched.value[k as keyof typeof touched.value] = true);
  if (!isFormValid.value) return;

  try {
    loading.value = true;
    const payload: any = {
      name: form.value.name.trim(),
      lastName: form.value.lastName.trim(),
      mail: form.value.mail.trim(),
      phone: form.value.phone.replace(/\D/g, ""),
      roleId: form.value.roleId,
      companyId: form.value.companyId,
    };

    if (!isEdit.value) {
      payload.password = DEFAULT_PASSWORD;
    }

    if (isEdit.value) {
      await usuariosService.updateUser(props.user.id, payload);
      showSuccessAlert("Usuario actualizado");
    } else {
      await usuariosService.createUser(payload);
      showSuccessAlert("Usuario registrado. Contraseña temporal asignada.");
    }

    emit("refresh");
    dialog.value = false;
    resetForm();
  } catch (error: any) {
    showErrorAlert(error.response?.data?.message || "Error al guardar");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="650px" persistent>
    <v-card>
      <v-card-title class="pa-4 font-weight-bold">
        {{ isEdit ? "Editar usuario" : "Registrar usuario" }}
      </v-card-title>

      <v-card-text>
        <div class="row">
          <v-text-field v-model="form.name" label="Nombre(s) *" :rules="nameRules"
            @blur="touched.name = true" class="flex-1" variant="filled" />
          <v-text-field v-model="form.lastName" label="Apellidos *" :rules="lastNameRules"
            @blur="touched.lastName = true" class="flex-1" variant="filled" />
        </div>

        <v-text-field v-model="form.mail" label="Usuario *" :rules="mailRules"
          @blur="touched.mail = true" :disabled="isEdit" variant="filled" />

        <v-alert v-if="!isEdit" type="info" variant="tonal" density="compact" class="mb-4" icon="ph-lock">
          Se asignará la contraseña temporal <strong>T12345678w</strong>. El usuario deberá cambiarla al iniciar sesión.
        </v-alert>

        <div class="row">
          <v-text-field
            :model-value="form.phone"
            @update:model-value="val => form.phone = formatPhone(val)"
            label="Teléfono *"
            :rules="phoneRules"
            @blur="touched.phone = true"
            placeholder="(XXX) XXX-XXXX"
            variant="filled" class="flex-1" />

          <v-autocomplete v-model="form.roleId" label="Rol *" :items="filteredRoles" item-title="name"
            item-value="id" :loading="loadingOptions" :rules="roleRules"
            @blur="touched.roleId = true" class="flex-1" clearable variant="filled" />
        </div>

        <v-autocomplete v-model="form.companyId" label="Empresa *" :items="companies" item-title="name"
          item-value="id" :loading="loadingOptions" :rules="companyRules"
          @blur="touched.companyId = true" :disabled="isEdit || !isSuperUser()" clearable variant="filled" />
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!isFormValid" @click="save" variant="elevated">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}
.flex-1 {
  flex: 1;
  min-width: 0;
}
</style>
