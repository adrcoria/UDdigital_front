<script setup lang="ts">
import { computed, onMounted, ref, reactive } from "vue";
import { v4 as uuidv4 } from "uuid";
import { defineProps, defineEmits } from "vue";
import Swal from "sweetalert2";
import { userService } from "@/app/http/httpServiceProvider";
import { formatPhoneMX } from "@/app/common/types/stringUtils";
// Asegúrate de que el componente Card esté importado o registrado globalmente
// import Card from "@/components/Card.vue";

// ===================================================================
// 1. Props & Emits
// ===================================================================
const emit = defineEmits(["update:modelValue", "onUpdate", "onCreate"]);
const prop = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userDetail: {
    type: Object,
    default: () => ({}),
  },
  loading: { type: Boolean, default: false },
});

const loadingRoles = ref(true);

// ===================================================================
// 2. Estado del modal (Abrir/Cerrar) y si es creación o edición
// ===================================================================
const dialogValue = computed({
  get: () => prop.modelValue,
  set: (val: boolean) => emit("update:modelValue", val),
});

const isCreate = computed(() => !prop.userDetail?.uuid);

// ===================================================================
// 3. Objeto reactivo con los campos de formulario
// ===================================================================
const userForm = reactive({
  uuid: prop.userDetail?.uuid || "",
  name: prop.userDetail?.name || "",
  last_name: prop.userDetail?.last_name || "",
  mail: prop.userDetail?.mail || "",
  uuid_role: prop.userDetail?.role?.uuid || "",
  phone:
    (prop.userDetail?.phone
      ?.replace(/^\+52/, "")
      .replace(/\D+/g, "")) || "",
});

// ===================================================================
// 4. Roles (combo) y carga inicial
// ===================================================================
const roles = ref<any[]>([]);
const getRoles = async () => {
  loadingRoles.value = true;
  try {
    const response = await userService.getRoles();
    roles.value = response.data.data.map((role: any) => ({
      value: role.uuid,
      title: role.name,
    }));
  } catch (error) {
    console.error("Error al obtener roles:", error);
  } finally {
    loadingRoles.value = false;
  }
};
onMounted(() => {
  getRoles();
});

// ===================================================================
// 5. Máscara de teléfono con guiones
// ===================================================================



// ===================================================================
// 6. Validaciones simples para <v-form>
// ===================================================================
const requiredRule = [(v: string) => !!v || "Este campo es requerido"];
const emailRules = [
  (v: string) => !!v || "El correo es requerido",
  (v: string) => {
    const pattern = /^[^@\s]+@[^@\s]+(\.[^@\s]+)+$/;
    return pattern.test(v) || "Por favor ingrese un correo válido";
  },
];
const phoneRules = [
  (v: string) => !!v || "El teléfono es requerido",
  (v: string) => {
    const digits = v.replace(/\D+/g, "");
    return digits.length === 10 || "El teléfono debe tener 10 dígitos";
  },
];

const phoneMasked = computed({
  get() {
    return formatPhoneMX(userForm.phone);
  },
  set(val: string) {
    userForm.phone = val.replace(/\D+/g, "").slice(0, 10);
  },
});



const formRef = ref();

// ===================================================================
// 7. Crear o Actualizar
// ===================================================================
const onCreateUpdate = async () => {
  if (formRef.value) {
    const result = await formRef.value.validate();
    if (!result.valid) {
      return;
    }
  }

  if (!isCreate.value) {
    // Modo Actualizar
    emit("onUpdate", {
      uuid: userForm.uuid,
      name: userForm.name,
      last_name: userForm.last_name,
      phone: "+52" + userForm.phone,
      mail: userForm.mail,
      uuid_role: userForm.uuid_role,
    });
  } else {
    // Modo Crear
    const payload = {
      uuid: "",
      name: userForm.name,
      last_name: userForm.last_name,
      phone: "+52" + userForm.phone,
      mail: userForm.mail,
      uuid_role: userForm.uuid_role,
      password: "T12345678w",
    };
    emit("onCreate", payload);
    dialogValue.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialogValue" width="600" persistent scrollable>
    <Card :title="isCreate ? 'Agregar usuario' : 'Editar usuario'" title-class="bg-light text-center">

      <template #title-action>
        <v-btn icon="ph-x" variant="plain" density="compact" @click="dialogValue = false" />
      </template>
      <v-form ref="formRef">
        <v-card-text data-simplebar style="max-height: calc(100vh - 400px)">
          <!-- Nombre y Apellido -->
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="userForm.name" density="compact" :rules="requiredRule" label="Nombre"
                class="mb-2 custom-label" variant="outlined" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="userForm.last_name" density="compact" :rules="requiredRule" label="Apellido"
                class="mb-2 custom-label" variant="outlined" />
            </v-col>
          </v-row>

          <!-- Teléfono & Correo -->
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="phoneMasked" :rules="phoneRules" density="compact"
                label="Teléfono (formato: 443-333-12-12)" class="mb-2 custom-label" variant="outlined" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="userForm.mail" density="compact" :rules="emailRules" label="Correo electrónico"
                class="mb-2 custom-label" variant="outlined" />
            </v-col>
          </v-row>

          <!-- Rol -->
          <v-select v-model="userForm.uuid_role" :loading="loadingRoles" :disabled="loadingRoles" :items="roles"
            item-text="title" item-value="value" :rules="requiredRule" label="Seleccione un rol" variant="outlined"
            density="compact" class="mb-2 custom-label" />
        </v-card-text>
        <v-card-actions class="d-flex justify-end px-5 pb-3">
          <v-btn color="light" elevation="0" variant="elevated" @click="dialogValue = false">
            Cerrar
          </v-btn>
          <v-btn :loading="prop.loading" color="success" elevation="0" variant="elevated" @click="onCreateUpdate">
            {{ isCreate ? "Agregar Usuario" : "Actualizar" }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </Card>
  </v-dialog>
</template>

<style scoped>
/* Placeholder / Label color */
::v-deep .custom-label:not(.v-text-field--is-focused) .v-label {
  color: #9e9e9e !important;
  font-size: 12px !important;
}

/* Estilos error */
.is-invalid .v-field__control,
.is-invalid .v-field__input {
  border-color: #f44336 !important;
}

.invalid-feedback {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: 4px;
}
</style>
