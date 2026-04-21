<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { birthService, bovineService, pregnancyService, usuariosService } from "@/app/http/httpServiceProvider";
import { localDateStr } from "@/app/utils/date";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import Table from "@/app/common/components/Table.vue";
import RemoveItemConfirmationDialog from "@/app/common/components/RemoveItemConfirmationDialog.vue";
import CreateEditBovineDialog from "./CreateEditBovineDialog.vue";
import { BOVINE_TYPE_IDS } from "@/app/livestock.constants";

const BECERRO_TYPE_ID = BOVINE_TYPE_IDS.BECERRO;
const BECERRA_TYPE_ID = BOVINE_TYPE_IDS.BECERRA;

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
  birthDate: localDateStr(),
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
  // Evitar registrar la misma cría más de una vez
  if (form.value.idBovineSon) {
    const duplicate = history.value.find((b: any) => {
      if (isEditing.value && b.id === editingId.value) return false;
      return b.idBovineSon === form.value.idBovineSon;
    });
    if (duplicate) return showErrorAlert("Esta cría ya tiene un parto registrado.");
  }

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
    birthDate: localDateStr(),
    comments: ""
  };
};

const motherRaceAssignments = ref<any[]>([]);
const lastPregnancy = ref<any>(null);

const loadMotherRaces = async () => {
  if (!props.bovine?.id) return;
  try {
    const [resBovine, resPregnancy] = await Promise.all([
      props.bovine?.raceAssignments?.length ? Promise.resolve(null) : bovineService.getBovineById(props.bovine.id),
      pregnancyService.getHistory({ idBovine: props.bovine.id, page: 1, limit: 1 })
    ]);

    motherRaceAssignments.value = props.bovine?.raceAssignments?.length
      ? props.bovine.raceAssignments
      : (resBovine?.data?.data?.raceAssignments || []);

    const records: any[] = resPregnancy.data?.data?.data || resPregnancy.data?.data || [];
    lastPregnancy.value = records.length ? records[0] : null;
  } catch {
    motherRaceAssignments.value = props.bovine?.raceAssignments || [];
    lastPregnancy.value = null;
  }
};

const lastPregnancyIsMontaNatural = computed(() =>
  lastPregnancy.value?.pregnancyType?.name?.toUpperCase().includes('MONTA NATURAL') ?? false
);

const lastPregnancyFatherId = computed(() =>
  lastPregnancyIsMontaNatural.value ? (lastPregnancy.value?.maleBovine?.id ?? null) : null
);

const onBovineCreated = async (newId: string | null) => {
  await loadBovineSons();
  if (newId) form.value.idBovineSon = newId;
};

const openCreateCria = () => {
  if (!form.value.birthDate) {
    showErrorAlert("Primero captura la fecha de parto antes de registrar una cría");
    return;
  }
  createBovineDialog.value = true;
};

watch(page, loadHistory);

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    page.value = 1;
    loading.value = true;
    closeForm();
    await Promise.all([loadUsers(), loadBovineSons(), loadMotherRaces()]);
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

                <!-- Referencia: última preñez -->
                <v-alert v-if="lastPregnancy" density="compact" variant="tonal"
                  :color="lastPregnancyIsMontaNatural ? 'blue-darken-1' : 'teal'"
                  class="mb-4">
                  <div class="d-flex flex-wrap align-center" style="gap: 12px;">
                    <div>
                      <div class="text-caption text-grey font-weight-bold">ÚLTIMA PREÑEZ</div>
                      <div class="text-body-2 font-weight-bold">
                        {{ lastPregnancy.dateInit ? new Date(lastPregnancy.dateInit).toLocaleDateString('es-MX') : '---' }}
                      </div>
                    </div>
                    <v-divider vertical />
                    <div>
                      <div class="text-caption text-grey font-weight-bold">TIPO</div>
                      <div class="d-flex align-center" style="gap: 6px;">
                        <span class="text-body-2 font-weight-bold">{{ lastPregnancy.pregnancyType?.name || '---' }}</span>
                        <v-chip v-if="lastPregnancyIsMontaNatural" size="x-small" color="blue-darken-1">Monta Natural</v-chip>
                      </div>
                    </div>
                    <v-divider vertical />
                    <div>
                      <div class="text-caption text-grey font-weight-bold">SEMENTAL</div>
                      <template v-if="lastPregnancy.maleBovine">
                        <div class="text-body-2 font-weight-bold">{{ lastPregnancy.maleBovine.name }}</div>
                        <div class="text-caption text-grey">Arete: {{ lastPregnancy.maleBovine.internalEarTag }}</div>
                      </template>
                      <template v-else-if="lastPregnancy.externalBovine?.name">
                        <div class="text-body-2 font-weight-bold">{{ lastPregnancy.externalBovine.name }} <span class="text-caption text-grey">(externo)</span></div>
                        <div class="text-caption text-grey">{{ lastPregnancy.externalBovine.earTag || '' }}</div>
                      </template>
                      <span v-else class="text-body-2 text-grey">Sin registro</span>
                    </div>
                    <v-chip v-if="lastPregnancyIsMontaNatural && lastPregnancy.maleBovine"
                      size="x-small" color="blue-darken-1" variant="flat" class="ml-auto">
                      ID padre autoasignado a la cría
                    </v-chip>
                  </div>
                </v-alert>

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
                      v-model="form.birthDate"
                      type="date"
                      label="Fecha de Parto"
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
                      @click="openCreateCria"
                      title="Registrar nueva cría" />
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
    :initialValues="{ motherId: bovine?.id, birthDate: form.birthDate, raceAssignments: motherRaceAssignments, fatherId: lastPregnancyFatherId }"
    @refresh="onBovineCreated"
  />
</template>
