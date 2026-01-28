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
  confirmPassword: "",
  name: "",
  lastName: "",
  phone: "",
  roleId: "",
  companyId: "",
});

const touched = ref({
  mail: false,
  password: false,
  confirmPassword: false,
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
// ✅ Validamos que sea correo SOLO si quieres forzar ese formato. 
// Si no, podemos dejar solo 'req'. He dejado una Regex más flexible.
const emailRule = (v: string) => (v && v.length > 2) || "Usuario demasiado corto"; 

const minPass = (v: string) => (v && v.length >= 6) || "Mínimo 6 caracteres";
const phoneRule = (v: string) => {
  const digits = (v || "").replace(/\D/g, "");
  return digits.length === 10 || "Deben ser 10 dígitos";
};
const matchRule = (v: string) => v === form.value.password || "Las contraseñas no coinciden";

const nameRules = computed(() => touched.value.name ? [req] : []);
const lastNameRules = computed(() => touched.value.lastName ? [req] : []);
const mailRules = computed(() => touched.value.mail ? [req, emailRule] : []);
const phoneRules = computed(() => touched.value.phone ? [req, phoneRule] : []);
const roleRules = computed(() => touched.value.roleId ? [req] : []);
const companyRules = computed(() => touched.value.companyId ? [req] : []);

const passwordRules = computed(() => {
  if (!touched.value.password) return [];
  return isEdit.value ? [] : [req, minPass];
});

const confirmRules = computed(() => {
  if (!touched.value.confirmPassword) return [];
  if (isEdit.value && !form.value.password) return [];
  return [req, matchRule];
});

// ✅ CORRECCIÓN DE LA LÓGICA DEL BOTÓN
const isFormValid = computed(() => {
  const digits = (form.value.phone || "").replace(/\D/g, "");
  
  // Validaciones básicas de campos obligatorios
  const hasBasicInfo = !!form.value.name?.trim() && 
                       !!form.value.lastName?.trim() && 
                       !!form.value.mail?.trim() && 
                       !!form.value.roleId && 
                       !!form.value.companyId && 
                       digits.length === 10;

  const passwordsMatch = form.value.password === form.value.confirmPassword;

  if (isEdit.value) {
    // En edición: si escriben algo en password, debe ser válido y coincidir
    if (form.value.password) {
      return hasBasicInfo && passwordsMatch && form.value.password.length >= 6;
    }
    return hasBasicInfo;
  }
  
  // En creación: password es obligatorio, min 6 caracteres y debe coincidir
  return hasBasicInfo && !!form.value.password && form.value.password.length >= 6 && passwordsMatch;
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
      phone: formatPhone(u.phone || ""),
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
    const payload: any = {
      name: form.value.name.trim(),
      lastName: form.value.lastName.trim(),
      mail: form.value.mail.trim(),
      phone: form.value.phone.replace(/\D/g, ""),
      roleId: form.value.roleId,
      companyId: form.value.companyId,
    };
    
    if (form.value.password) payload.password = form.value.password;

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

        <div class="row">
          <v-text-field v-model="form.password" :label="isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'" 
            :type="showPassword ? 'text' : 'password'" 
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" 
            @click:append-inner="showPassword = !showPassword" 
            :rules="passwordRules" 
            @blur="touched.password = true" 
            autocomplete="new-password"
            variant="filled" class="flex-1" />
          
          <v-text-field v-model="form.confirmPassword" label="Confirmar contraseña *" 
            :type="showPassword ? 'text' : 'password'" 
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" 
            @click:append-inner="showPassword = !showPassword"
            :rules="confirmRules" 
            @blur="touched.confirmPassword = true" 
            autocomplete="new-password"
            variant="filled" class="flex-1" />
        </div>

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
          @blur="touched.companyId = true" :disabled="!isSuperUser()" clearable variant="filled" />
          
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