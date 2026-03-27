<script lang="ts" setup>
import { ref, watch } from "vue";
import { heatService, usuariosService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  bovine: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

/* ------------------ Estado ------------------ */
const loading = ref(false);
const history = ref<any[]>([]);
const showForm = ref(false);
const saving = ref(false);
const deleting = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const itemToDelete = ref<string | null>(null);
const confirmDeleteDialog = ref(false);

const page = ref(1);
const config = ref({ page: 1, start: 0, end: 0, noOfItems: 0, itemsPerPage: 5 });

const users = ref<any[]>([]);
const formRef = ref<any>(null);

const rules = {
  required: (v: any) => !!v || "Campo obligatorio",
  timeEndRequired: (v: any) => {
    if (form.value.heatDateEnd && !v) return "Si captura fecha fin, la hora fin es obligatoria";
    if (!form.value.heatDateEnd && v) return "Si captura hora fin, la fecha fin es obligatoria";
    return true;
  },
  dateEndRequired: (v: any) => {
    if (form.value.heatTimeEnd && !v) return "Si captura hora fin, la fecha fin es obligatoria";
    if (!form.value.heatTimeEnd && v) return "Si captura fecha fin, la hora fin es obligatoria";
    return true;
  }
};

const now = new Date();
const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

const form = ref({
  idUser: null as string | null,
  heatDateInit: now.toISOString().substring(0, 10),
  heatTimeInit: currentTime,
  heatDateEnd: null as string | null,
  heatTimeEnd: null as string | null,
  comments: ""
});

/* ------------------ Carga de usuarios ------------------ */
const loadUsers = async () => {
  try {
    const res = await usuariosService.getUsers();
    users.value = (res.data.data || []).map((u: any) => ({
      value: u.id,
      title: `${u.name} ${u.lastName}`
    }));
  } catch {
    showErrorAlert("No se pudieron cargar los usuarios");
  }
};

/* ------------------ Carga de historial ------------------ */
const loadHistory = async () => {
  if (!props.bovine?.id) return;
  try {
    loading.value = true;
    const res = await heatService.getHistory({
      idBovine: props.bovine.id,
      page: page.value,
      limit: config.value.itemsPerPage
    });
    history.value = res.data?.data?.data || res.data?.data || [];
    config.value.noOfItems = res.data?.data?.total || history.value.length;
  } catch {
    showErrorAlert("No se pudo cargar el historial de celos");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Guardar ------------------ */
const saveHeat = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    saving.value = true;

    const buildDateTime = (date: string, time: string | null) =>
      date && time ? `${date}T${time}` : date || null;

    if (isEditing.value) {
      const payload = {
        idUser: form.value.idUser!,
        heatDateInit: buildDateTime(form.value.heatDateInit, form.value.heatTimeInit)!,
        heatDateEnd: buildDateTime(form.value.heatDateEnd!, form.value.heatTimeEnd) || null,
        comments: form.value.comments
      };
      await heatService.updateHeat(editingId.value!, payload);
      showSuccessAlert("Celo actualizado");
    } else {
      const payload = {
        idBovine: props.bovine.id,
        idUser: form.value.idUser!,
        heatDateInit: buildDateTime(form.value.heatDateInit, form.value.heatTimeInit)!,
        heatDateEnd: buildDateTime(form.value.heatDateEnd!, form.value.heatTimeEnd) || null,
        comments: form.value.comments
      };
      await heatService.createHeat(payload);
      showSuccessAlert("Celo registrado");
    }

    closeForm();
    loadHistory();
  } catch {
    showErrorAlert("Error al guardar el celo");
  } finally {
    saving.value = false;
  }
};

/* ------------------ Eliminar ------------------ */
const confirmDelete = (id: string) => {
  itemToDelete.value = id;
  confirmDeleteDialog.value = true;
};

const deleteHeat = async () => {
  try {
    deleting.value = true;
    await heatService.deleteHeat(itemToDelete.value!);
    showSuccessAlert("Registro de celo eliminado");
    confirmDeleteDialog.value = false;
    itemToDelete.value = null;
    loadHistory();
  } catch {
    showErrorAlert("Error al eliminar el registro");
  } finally {
    deleting.value = false;
  }
};

/* ------------------ Abrir nuevo / Cerrar form ------------------ */
const openNewForm = () => {
  closeForm();
  showForm.value = true;
};

/* ------------------ Editar / Cerrar form ------------------ */
const openEdit = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  form.value = {
    idUser: item.user?.id || null,
    heatDateInit: item.heatDateInit ? item.heatDateInit.substring(0, 10) : "",
    heatTimeInit: item.heatDateInit?.length > 10 ? item.heatDateInit.substring(11, 16) : "",
    heatDateEnd: item.heatDateEnd ? item.heatDateEnd.substring(0, 10) : null,
    heatTimeEnd: item.heatDateEnd?.length > 10 ? item.heatDateEnd.substring(11, 16) : null,
    comments: item.comments || ""
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  isEditing.value = false;
  editingId.value = null;
  const d = new Date();
  form.value = {
    idUser: null,
    heatDateInit: d.toISOString().substring(0, 10),
    heatTimeInit: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    heatDateEnd: null,
    heatTimeEnd: null,
    comments: ""
  };
};

watch(page, loadHistory);

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    page.value = 1;
    loading.value = true;
    closeForm();
    await loadUsers();
    loadHistory();
  }
}, { immediate: true });

const headers = [
  { title: "Fecha Inicio" },
  { title: "Fecha Fin" },
  { title: "Responsable" },
  { title: "Comentarios" },
  { title: "Acciones", align: "center" }
];
</script>

<template>
  <v-dialog :model-value="modelValue" fullscreen transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <v-toolbar color="primary" flat>
        <v-btn icon="ph-x" @click="emit('update:modelValue', false)" />
        <v-toolbar-title class="font-weight-bold">
          <v-icon class="mr-2">ph-thermometer-hot</v-icon>
          Control de Celos: {{ bovine?.name }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn variant="flat" color="white" class="text-primary px-6" @click="openNewForm">
          {{ showForm ? 'Cerrar Formulario' : 'Nuevo Registro' }}
        </v-btn>
      </v-toolbar>

      <v-container fluid class="pa-6">
        <v-row>
          <!-- Formulario de registro / edición -->
          <v-expand-transition>
            <v-col cols="12" v-if="showForm">
              <v-card border flat class="rounded-lg pa-6 mb-4">
                <div class="text-subtitle-1 font-weight-bold mb-4 text-pink-darken-2">
                  {{ isEditing ? 'Editar registro de celo' : 'Nuevo registro de celo' }}
                </div>
                <v-form ref="formRef">
                <v-row dense>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="form.idUser"
                      :items="users"
                      item-value="value"
                      item-title="title"
                      label="Responsable"
                      variant="outlined"
                      density="comfortable"
                      :rules="[rules.required]"
                    />
                  </v-col>

                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="form.heatDateInit"
                      type="date"
                      label="Fecha Inicio"
                      variant="outlined"
                      density="comfortable"
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="form.heatTimeInit"
                      type="time"
                      label="Hora Inicio"
                      variant="outlined"
                      density="comfortable"
                      :rules="[rules.required]"
                    />
                  </v-col>

                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="form.heatDateEnd"
                      type="date"
                      label="Fecha Fin (opcional)"
                      variant="outlined"
                      density="comfortable"
                      clearable
                      :rules="[rules.dateEndRequired]"
                    />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="form.heatTimeEnd"
                      type="time"
                      label="Hora Fin (opcional)"
                      variant="outlined"
                      density="comfortable"
                      clearable
                      :rules="[rules.timeEndRequired]"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-textarea
                      v-model="form.comments"
                      label="Comentarios"
                      variant="outlined"
                      density="comfortable"
                      rows="2"
                      :rules="[rules.required]"
                    />
                  </v-col>
                </v-row>
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="text" @click="closeForm">Cancelar</v-btn>
                  <v-btn color="primary" variant="flat" class="px-10" :loading="saving" @click="saveHeat">
                    Guardar
                  </v-btn>
                </v-card-actions>
                </v-form>
              </v-card>
            </v-col>
          </v-expand-transition>

          <!-- Historial -->
          <v-col cols="12">
            <v-card border flat class="rounded-lg">
              <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
                <template #body>
                  <tr v-for="item in history" :key="item.id">
                    <td class="font-weight-bold">
                      {{ item.heatDateInit ? new Date(item.heatDateInit).toLocaleString() : '---' }}
                    </td>
                    <td>
                      {{ item.heatDateEnd ? new Date(item.heatDateEnd).toLocaleString() : '---' }}
                    </td>
                    <td class="text-caption">{{ item.user ? `${item.user.name} ${item.user.lastName}` : '---' }}</td>
                    <td class="text-caption text-grey-darken-1">{{ item.comments || '---' }}</td>
                    <td class="text-center">
                      <v-btn icon="ph-pencil" size="small" variant="text" color="primary" @click="openEdit(item)" />
                      <v-btn icon="ph-trash" size="small" variant="text" color="error" :loading="deleting && itemToDelete === item.id" @click="confirmDelete(item.id)" />
                    </td>
                  </tr>

                  <tr v-if="!loading && history.length === 0">
                    <td colspan="5" class="text-center py-10 text-grey">Sin registros de celo</td>
                  </tr>
                </template>
              </Table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>

  <RemoveItemConfirmationDialog
    v-if="confirmDeleteDialog"
    v-model="confirmDeleteDialog"
    :loading="deleting"
    @onConfirm="deleteHeat"
  />
</template>
