<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { usuariosService, companyService, roleService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { isSuperUser, getCompanyId, ROLES } from "@/app/utils/authHelper";

const props = defineProps<{ modelValue: boolean; user: any | null }>();
const emit = defineEmits(["refresh", "update:modelValue"]);

const dialog = ref(false);
watch(() => props.modelValue, v => (dialog.value = v), { immediate: true });
watch(dialog, v => emit("update:modelValue", v));

/* ---------- Form State ---------- */
const form = ref({
  mail: "",
  password: "",
  confirmPassword: "", // ✅ Nuevo campo
  name: "",
  lastName: "",
  phone: "",
  roleId: "",
  companyId: "",
});

const touched = ref({
  mail: false,
  password: false,
  confirmPassword: false, // ✅ Nuevo estado
  name: false,
  lastName: false,
  roleId: false,
  companyId: false,
});

const resetForm = () => {
  form.value = {
    mail: "",
    password: "",
    confirmPassword: "",
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
const showPassword = ref(false);

const filteredRoles = computed(() => {
  if (isSuperUser()) return allRoles.value;
  return allRoles.value.filter(role => role.id !== ROLES.SUPER_USER);
});

/* ---------- Loaders ---------- */
const loadOptions = async () => {
  loadingOptions.value = true;
  try {
    const [resCompanies, resRoles] = await Promise.all([
      companyService.getCompanies(),
      roleService.getRoles(),
    ]);
    companies.value = resCompanies.data.data;
    allRoles.value = resRoles.data.data;
  } finally {
    loadingOptions.value = false;
  }
};

/* ---------- Guardar State ---------- */
const loading = ref(false);
const isEdit = computed(() => !!props.user?.id);

/* ---------- Validaciones ---------- */
const req = (v: any) => !!v || "Obligatorio";
const emailRule = (v: string) => /.+@.+\..+/.test(v) || "Correo no válido";
const minPass = (v: string) => (v && v.length >= 6) || "Mínimo 6 caracteres";
// ✅ Regla de coincidencia
const matchRule = (v: string) => v === form.value.password || "Las contraseñas no coinciden";

const nameRules = computed(() => touched.value.name ? [req] : []);
const lastNameRules = computed(() => touched.value.lastName ? [req] : []);
const mailRules = computed(() => touched.value.mail ? [req, emailRule] : []);
const roleRules = computed(() => touched.value.roleId ? [req] : []);
const companyRules = computed(() => touched.value.companyId ? [req] : []);

const passwordRules = computed(() => {
  if (!touched.value.password) return [];
  return isEdit.value ? [] : [req, minPass];
});

// ✅ Reglas para el campo confirmar
const confirmRules = computed(() => {
  if (!touched.value.confirmPassword) return [];
  if (isEdit.value && !form.value.password) return []; // Si está editando y no puso password nuevo
  return [req, matchRule];
});

const isFormValid = computed(() => {
  const basic = !!form.value.name && !!form.value.lastName && !!form.value.mail && 
                !!form.value.roleId && !!form.value.companyId && /.+@.+\..+/.test(form.value.mail);
  
  const passwordsMatch = form.value.password === form.value.confirmPassword;

  if (isEdit.value) {
    // Si edita, solo validar match si el campo password tiene algo
    if (form.value.password) return basic && passwordsMatch && form.value.password.length >= 6;
    return basic;
  }
  
  return basic && !!form.value.password && form.value.password.length >= 6 && passwordsMatch;
});

/* ---------- Watchers ---------- */
watch(() => props.user, (u) => {
  if (u) {
    form.value = {
      mail: u.mail || "",
      password: "",
      confirmPassword: "",
      name: u.name || "",
      lastName: u.lastName || "",
      phone: u.phone || "",
      roleId: u.roleId || "",
      companyId: u.companyId || "",
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
    // Eliminamos confirmPassword del payload para el servidor
    const { confirmPassword, ...dataToSend } = form.value;
    const payload = { ...dataToSend };
    
    if (isEdit.value && !payload.password) delete payload.password;

    if (isEdit.value) {
      await usuariosService.updateUser(props.user.id, payload);
      showSuccessAlert("Usuario actualizado");
    } else {
      await usuariosService.createUser(payload);
      showSuccessAlert("Usuario registrado");
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
  <v-dialog v-model="dialog" max-width="650px">
    <v-card>
      <v-card-title>{{ isEdit ? "Editar usuario" : "Registrar usuario" }}</v-card-title>

      <v-card-text>
        <div class="row">
          <v-text-field v-model="form.name" label="Nombre(s) *" :rules="nameRules" 
            @blur="touched.name = true" class="flex-1" />
          <v-text-field v-model="form.lastName" label="Apellidos *" :rules="lastNameRules" 
            @blur="touched.lastName = true" class="flex-1" />
        </div>

        <v-text-field v-model="form.mail" label="Correo electrónico *" :rules="mailRules" 
          @blur="touched.mail = true" :disabled="isEdit" />

        <div class="row">
          <v-text-field v-model="form.password" :label="isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'" 
            :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" 
            @click:append-inner="showPassword = !showPassword" :rules="passwordRules" 
            @blur="touched.password = true" class="flex-1" />
          
          <v-text-field v-model="form.confirmPassword" label="Confirmar contraseña *" 
            :type="showPassword ? 'text' : 'password'" :rules="confirmRules" 
            @blur="touched.confirmPassword = true" class="flex-1" />
        </div>

        <div class="row">
          <v-text-field v-model="form.phone" label="Teléfono" class="flex-1" />
          <v-autocomplete v-model="form.roleId" label="Rol *" :items="filteredRoles" item-title="name" 
            item-value="id" :loading="loadingOptions" :rules="roleRules" 
            @blur="touched.roleId = true" class="flex-1" clearable />
        </div>

        <v-autocomplete v-model="form.companyId" label="Empresa *" :items="companies" item-title="name" 
          item-value="id" :loading="loadingOptions" :rules="companyRules" 
          @blur="touched.companyId = true" :disabled="!isSuperUser()" clearable />
          
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
</template>

<style scoped>
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.flex-1 {
  flex: 1;
  min-width: 0;
}
</style>