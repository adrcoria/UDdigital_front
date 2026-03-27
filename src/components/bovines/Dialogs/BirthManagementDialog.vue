<script lang="ts" setup>
import { ref, watch } from "vue";
import { birthService, bovineService, usuariosService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditBovineDialog from "./CreateEditBovineDialog.vue";

const BECERRO_TYPE_ID = "1cdd9c4f-d9bc-430b-b03f-782d8309fc09";
const BECERRA_TYPE_ID = "6eff8abc-f6de-4be6-869e-ff9332b77ef8";

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

const confirmDeleteDialog = ref(false);
const itemToDelete = ref<any | null>(null);

const createBovineDialog = ref(false);

const page = ref(1);
const config = ref({ page: 1, start: 0, end: 0, noOfItems: 0, itemsPerPage: 5 });

const users = ref<any[]>([]);
const bovineSonOptions = ref<any[]>([]); // raw bovine objects

const form = ref({
  idUser: null as string | null,
  idBovineSon: null as string | null,
  birthDate: new Date().toISOString().substring(0, 10),
  comments: ""
});

/* ------------------ Carga de catálogos (una sola vez) ------------------ */
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

const loadBovineSons = async () => {
  try {
    const [resBecerro, resBecerra] = await Promise.all([
      bovineService.getBovinesByType(BECERRO_TYPE_ID),
      bovineService.getBovinesByType(BECERRA_TYPE_ID)
    ]);
    const becerros = resBecerro.data?.data?.data || resBecerro.data?.data || resBecerro.data || [];
    const becerras = resBecerra.data?.data?.data || resBecerra.data?.data || resBecerra.data || [];
    bovineSonOptions.value = [...becerros, ...becerras];
  } catch {
    showErrorAlert("No se pudieron cargar las crías");
  }
};

/* ------------------ Helpers para mostrar nombres en tabla ------------------ */
const getUserName = (idUser: string) => {
  const u = users.value.find((x) => x.value === idUser);
  return u ? u.title : idUser || "---";
};

const getBovineSonName = (idBovineSon: string) => {
  const b = bovineSonOptions.value.find((x) => x.id === idBovineSon);
  return b ? (b.name || b.siniigaEarTag || b.internalEarTag || idBovineSon) : idBovineSon || "---";
};

/* ------------------ Carga de historial ------------------ */
const loadHistory = async () => {
  if (!props.bovine?.id) return;
  try {
    loading.value = true;
    const res = await birthService.getHistory({
      idBovine: props.bovine.id,
      page: page.value,
      limit: config.value.itemsPerPage
    });
    history.value = res.data?.data?.data || res.data?.data || [];
    config.value.noOfItems = res.data?.data?.total || history.value.length;
  } catch {
    showErrorAlert("No se pudo cargar el historial de partos");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Guardar ------------------ */
const saveBirth = async () => {
  try {
    saving.value = true;

    if (isEditing.value) {
      const payload = {
        idUser: form.value.idUser!,
        idBovineSon: form.value.idBovineSon!,
        birthDate: form.value.birthDate,
        comments: form.value.comments
      };
      await birthService.updateBirth(editingId.value!, payload);
      showSuccessAlert("Parto actualizado");
    } else {
      const payload = {
        idBovine: props.bovine.id,
        idUser: form.value.idUser!,
        idBovineSon: form.value.idBovineSon!,
        birthDate: form.value.birthDate,
        comments: form.value.comments
      };
      await birthService.createBirth(payload);
      showSuccessAlert("Parto registrado");
    }

    closeForm();
    loadHistory();
  } catch {
    showErrorAlert("Error al guardar el registro de parto");
  } finally {
    saving.value = false;
  }
};

/* ------------------ Eliminar (con confirmación) ------------------ */
const confirmDelete = (item: any) => {
  itemToDelete.value = item;
  confirmDeleteDialog.value = true;
};

const deleteBirth = async () => {
  try {
    deleting.value = true;
    await birthService.deleteBirth(itemToDelete.value.id);
    showSuccessAlert("Registro de parto eliminado");
    confirmDeleteDialog.value = false;
    itemToDelete.value = null;
    loadHistory();
  } catch {
    showErrorAlert("Error al eliminar el registro");
  } finally {
    deleting.value = false;
  }
};

/* ------------------ Formulario ------------------ */
const openNewForm = () => {
  closeForm();
  showForm.value = true;
};

const openEdit = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  // La respuesta es plana: usar idUser e idBovineSon directamente
  form.value = {
    idUser: item.idUser || item.user?.id || null,
    idBovineSon: item.idBovineSon || item.bovineSon?.id || null,
    birthDate: item.birthDate ? item.birthDate.substring(0, 10) : "",
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
    idBovineSon: null,
    birthDate: new Date().toISOString().substring(0, 10),
    comments: ""
  };
};

const onBovineCreated = async (newId: string | null) => {
  await loadBovineSons();
  if (newId) form.value.idBovineSon = newId;
};

watch(page, loadHistory);

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    page.value = 1;
    loading.value = true;
    closeForm();
    await Promise.all([loadUsers(), loadBovineSons()]);
    loadHistory();
  }
}, { immediate: true });

const headers = [
  { title: "Fecha de Parto" },
  { title: "Cría" },
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
          <v-icon class="mr-2">ph-baby</v-icon>
          Registro de Partos: {{ bovine?.name }}
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
                <div class="text-subtitle-1 font-weight-bold mb-4 text-brown-darken-2">
                  {{ isEditing ? 'Editar registro de parto' : 'Nuevo registro de parto' }}
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
                    <v-autocomplete
                      v-model="form.idBovineSon"
                      :items="bovineSonOptions"
                      :item-title="(b: any) => `${b.name ?? ''} ${b.internalEarTag ?? ''}`"
                      item-value="id"
                      label="Cría (bovino)"
                      variant="outlined"
                      density="comfortable"
                      clearable
                    >
                      <template #item="{ props: itemProps, item }">
                        <v-list-item v-bind="itemProps" :title="item.raw.name || item.raw.siniigaEarTag" :subtitle="`Arete: ${item.raw.internalEarTag}`" />
                      </template>
                      <template #selection="{ item }">
                        {{ item.raw.name || item.raw.siniigaEarTag }} — {{ item.raw.internalEarTag }}
                      </template>
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="auto" class="d-flex align-center pt-1">
                    <v-btn icon="ph-plus-circle" size="small" variant="tonal" color="primary"
                      @click="createBovineDialog = true"
                      title="Registrar nueva cría" />
                  </v-col>

                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="form.birthDate"
                      type="date"
                      label="Fecha de Parto"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="form.comments"
                      label="Comentarios"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="text" @click="closeForm">Cancelar</v-btn>
                  <v-btn color="primary" variant="flat" class="px-10" :loading="saving" @click="saveBirth">
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
                      {{ item.birthDate ? new Date(item.birthDate).toLocaleDateString() : '---' }}
                    </td>
                    <td class="text-caption">{{ getBovineSonName(item.idBovineSon) }}</td>
                    <td class="text-caption">{{ getUserName(item.idUser) }}</td>
                    <td class="text-caption">{{ item.comments || '---' }}</td>
                    <td class="text-center">
                      <v-btn icon="ph-pencil" size="small" variant="text" color="primary" @click="openEdit(item)" />
                      <v-btn icon="ph-trash" size="small" variant="text" color="error" :loading="deleting && itemToDelete?.id === item.id" @click="confirmDelete(item)" />
                    </td>
                  </tr>

                  <tr v-if="!loading && history.length === 0">
                    <td colspan="5" class="text-center py-10 text-grey">Sin registros de parto</td>
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
    v-model="confirmDeleteDialog"
    :loading="deleting"
    @onConfirm="deleteBirth"
  />

  <CreateEditBovineDialog
    v-if="createBovineDialog"
    v-model="createBovineDialog"
    :item="null"
    :isCria="true"
    :initialValues="{ motherId: bovine?.id }"
    @refresh="onBovineCreated"
  />
</template>
