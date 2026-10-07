<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { roleService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { esRolDelSistema, type Role } from "../utils";

const props = defineProps<{ modelValue: boolean; role: Role | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
watch(() => props.modelValue, (v) => (dialog.value = v), { immediate: true });
watch(dialog, (v) => emit("update:modelValue", v));

const saving = ref(false);
const touched = ref(false);
const esEdicion = computed(() => !!props.role?.id);
const esDelSistema = computed(() => !!props.role?.id && esRolDelSistema(props.role.id));

const form = ref({ name: "", description: "", isActive: true });

watch(
  () => props.role,
  (r) => {
    form.value = {
      name: r?.name ?? "",
      description: r?.description ?? "",
      isActive: r?.isActive ?? true,
    };
    touched.value = false;
  },
  { immediate: true }
);

const errorName = computed(() => {
  const nombre = form.value.name.trim();
  if (!nombre) return "El nombre es obligatorio";
  if (nombre.length < 3) return "Debe tener al menos 3 caracteres";
  return "";
});

const isValid = computed(() => !errorName.value);

const guardar = async () => {
  touched.value = true;
  if (!isValid.value) return;

  const payload = {
    name: form.value.name.trim(),
    description: form.value.description.trim() || undefined,
    isActive: form.value.isActive,
  };

  try {
    saving.value = true;

    if (esEdicion.value) {
      await roleService.updateRole(props.role!.id, payload);
      showSuccessAlert("Rol actualizado");
    } else {
      await roleService.createRole(payload);
      showSuccessAlert("Rol creado");
    }

    emit("refresh");
    dialog.value = false;
  } catch (error: any) {
    const msg = error.response?.data?.message;
    showErrorAlert(Array.isArray(msg) ? msg[0] : msg || "No se pudo guardar el rol");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="520" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon class="mr-2">ph-identification-badge</v-icon>
        <span class="text-subtitle-1 font-weight-bold">
          {{ esEdicion ? "Editar rol" : "Nuevo rol" }}
        </span>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" size="small" @click="dialog = false" />
      </v-card-title>

      <v-card-text class="pa-5">
        <v-alert
          v-if="esDelSistema"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4 text-caption"
        >
          Es un rol del sistema: se puede renombrar, pero no desactivar ni eliminar.
        </v-alert>

        <v-text-field
          v-model="form.name"
          label="Nombre *"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          autofocus
          :error-messages="touched && errorName ? [errorName] : []"
        />

        <v-textarea
          v-model="form.description"
          label="Descripción"
          hint="Para qué sirve este rol"
          persistent-hint
          variant="outlined"
          density="comfortable"
          rows="2"
          class="mb-4"
        />

        <v-switch
          v-model="form.isActive"
          color="primary"
          density="compact"
          hide-details
          :disabled="esDelSistema"
          :label="form.isActive ? 'Activo' : 'Inactivo'"
        />
        <div class="text-caption text-medium-emphasis">
          Un rol inactivo deja de aparecer al asignar permisos y al dar de alta usuarios.
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="px-6" :loading="saving" @click="guardar">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
