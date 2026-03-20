<script lang="ts" setup>
import { ref, watch } from "vue";
import { heatService, usuariosService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";

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

const page = ref(1);
const config = ref({ page: 1, start: 0, end: 0, noOfItems: 0, itemsPerPage: 5 });

const users = ref<any[]>([]);

const form = ref({
  idUser: null as string | null,
  heatDateInit: new Date().toISOString().substring(0, 10),
  heatDateEnd: null as string | null,
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
  try {
    saving.value = true;

    if (isEditing.value) {
      const payload = {
        idUser: form.value.idUser!,
        heatDateInit: form.value.heatDateInit,
        heatDateEnd: form.value.heatDateEnd || null,
        comments: form.value.comments
      };
      await heatService.updateHeat(editingId.value!, payload);
      showSuccessAlert("Celo actualizado");
    } else {
      const payload = {
        idBovine: props.bovine.id,
        idUser: form.value.idUser!,
        heatDateInit: form.value.heatDateInit,
        heatDateEnd: form.value.heatDateEnd || null,
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
const deleteHeat = async (id: string) => {
  try {
    deleting.value = true;
    itemToDelete.value = id;
    await heatService.deleteHeat(id);
    showSuccessAlert("Registro de celo eliminado");
    loadHistory();
  } catch {
    showErrorAlert("Error al eliminar el registro");
  } finally {
    deleting.value = false;
    itemToDelete.value = null;
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
    heatDateEnd: item.heatDateEnd ? item.heatDateEnd.substring(0, 10) : null,
    comments: item.comments || ""
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    idUser: null,
    heatDateInit: new Date().toISOString().substring(0, 10),
    heatDateEnd: null,
    comments: ""
  };
};

watch(page, loadHistory);

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    page.value = 1;
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
                    />
                  </v-col>

                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="form.heatDateInit"
                      type="date"
                      label="Fecha de Inicio"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="form.heatDateEnd"
                      type="date"
                      label="Fecha de Fin (opcional)"
                      variant="outlined"
                      density="comfortable"
                      clearable
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-textarea
                      v-model="form.comments"
                      label="Comentarios"
                      variant="outlined"
                      density="comfortable"
                      rows="2"
                      hide-details
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
                      {{ item.heatDateInit ? new Date(item.heatDateInit).toLocaleDateString() : '---' }}
                    </td>
                    <td>
                      {{ item.heatDateEnd ? new Date(item.heatDateEnd).toLocaleDateString() : '---' }}
                    </td>
                    <td class="text-caption">{{ item.user ? `${item.user.name} ${item.user.lastName}` : '---' }}</td>
                    <td class="text-caption text-grey-darken-1">{{ item.comments || '---' }}</td>
                    <td class="text-center">
                      <v-btn icon="ph-pencil" size="small" variant="text" color="primary" @click="openEdit(item)" />
                      <v-btn icon="ph-trash" size="small" variant="text" color="error" :loading="deleting && itemToDelete === item.id" @click="deleteHeat(item.id)" />
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
</template>
