<script lang="ts" setup>
import { ref, watch } from "vue";
import { heatService, usuariosService, pregnancyService, birthService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";
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
};

const now = new Date();
const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

const form = ref({
  idUser: null as string | null,
  heatDateInit: localDateStr(now),
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

  // Evitar duplicado en la misma fecha
  const duplicate = history.value.find((h: any) => {
    if (isEditing.value && h.id === editingId.value) return false;
    return h.heatDateInit?.substring(0, 10) === form.value.heatDateInit;
  });
  if (duplicate) return showErrorAlert("Ya existe un registro de celo en esa fecha.");

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

/* ------------------ Validación: preñez activa ------------------ */
const activePregnancyWarning = ref(false);
const activePregnancyInfo = ref<any>(null);
const checkingPregnancy = ref(false);

const hasActivePregnancy = async (): Promise<boolean> => {
  if (!props.bovine?.id) return false;
  try {
    const [resPreg, resBirth, resHeat] = await Promise.all([
      pregnancyService.getHistory({ idBovine: props.bovine.id, page: 1, limit: 100 }),
      birthService.getHistory({ idBovine: props.bovine.id, page: 1, limit: 100 }),
      heatService.getHistory({ idBovine: props.bovine.id, page: 1, limit: 100 })
    ]);

    const pregnancies: any[] = resPreg.data?.data?.data || resPreg.data?.data || [];
    const births: any[] = resBirth.data?.data?.data || resBirth.data?.data || [];
    const heats: any[] = resHeat.data?.data?.data || resHeat.data?.data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = pregnancies.find((p: any) => {
      const pregStart = new Date(p.dateInit);
      const dateEnd = new Date(p.dateEnd);
      if (dateEnd < today) return false; // ya venció
      // resuelta por parto
      if (births.some((b: any) => new Date(b.birthDate) >= pregStart)) return false;
      // ya desestimada por un celo anterior
      if (heats.some((h: any) => new Date(h.heatDateInit) >= pregStart)) return false;
      return true; // genuinamente activa
    });

    if (active) {
      activePregnancyInfo.value = active;
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/* ------------------ Validación: celo reciente (< 18 días) ------------------ */
const recentHeatWarning = ref(false);
const recentHeatInfo = ref<any>(null);
const HEAT_MIN_DAYS = 18;

const getRecentHeat = async (): Promise<any | null> => {
  if (!props.bovine?.id) return null;
  try {
    const res = await heatService.getHistory({ idBovine: props.bovine.id, page: 1, limit: 100 });
    const heats: any[] = res.data?.data?.data || res.data?.data || [];
    if (!heats.length) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const recent = heats.find((h: any) => {
      const diff = (today.getTime() - new Date(h.heatDateInit).getTime()) / (1000 * 60 * 60 * 24);
      return diff < HEAT_MIN_DAYS;
    });
    return recent ?? null;
  } catch { return null; }
};

/* ------------------ Abrir nuevo / Cerrar form ------------------ */
const openNewForm = async () => {
  checkingPregnancy.value = true;
  const [hasActive, recentHeat] = await Promise.all([hasActivePregnancy(), getRecentHeat()]);
  checkingPregnancy.value = false;

  if (hasActive) {
    activePregnancyWarning.value = true;
  } else if (recentHeat) {
    recentHeatInfo.value = recentHeat;
    recentHeatWarning.value = true;
  } else {
    closeForm();
    showForm.value = true;
  }
};

const confirmHeatOverride = () => {
  activePregnancyWarning.value = false;
  // después de confirmar preñez, verificar celo reciente
  if (recentHeatInfo.value) {
    recentHeatWarning.value = true;
  } else {
    closeForm();
    showForm.value = true;
  }
};

const confirmRecentHeatOverride = () => {
  recentHeatWarning.value = false;
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
    heatDateInit: localDateStr(d),
    heatTimeInit: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    heatDateEnd: null,
    heatTimeEnd: null,
    comments: ""
  };
};

/* ------------------ Cálculo automático fecha/hora fin (+24h) ------------------ */
const calcEnd = () => {
  if (!form.value.heatDateInit || !form.value.heatTimeInit) return;
  const [year, month, day] = form.value.heatDateInit.split('-').map(Number);
  const [h, m] = form.value.heatTimeInit.split(':').map(Number);
  // Construir en tiempo local para evitar el desfase UTC
  const start = new Date(year, month - 1, day, h, m, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  form.value.heatDateEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  form.value.heatTimeEnd = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
};

watch(() => [form.value.heatDateInit, form.value.heatTimeInit], calcEnd);

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
        <v-btn variant="flat" color="white" class="text-primary px-6"
          :loading="checkingPregnancy" @click="showForm ? closeForm() : openNewForm()">
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
                      :max="localDateStr()"
                      :rules="[rules.required, (v: any) => !v || v <= localDateStr() || 'No se permiten fechas futuras']"
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
                      label="Fecha Fin"
                      hint="Calculado +24 hrs"
                      persistent-hint
                      variant="outlined"
                      density="comfortable"
                      readonly
                      bg-color="grey-lighten-4"
                    />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="form.heatTimeEnd"
                      type="time"
                      label="Hora Fin"
                      hint="Calculado +24 hrs"
                      persistent-hint
                      variant="outlined"
                      density="comfortable"
                      readonly
                      bg-color="grey-lighten-4"
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

  <!-- Advertencia preñez activa -->
  <v-dialog v-model="activePregnancyWarning" max-width="480" persistent>
    <v-card class="rounded-xl">
      <v-card-title class="pa-4 bg-orange-darken-2 text-white d-flex align-center">
        <v-icon class="mr-2">ph-warning</v-icon> Preñez activa detectada
      </v-card-title>
      <v-card-text class="pa-5">
        <p class="text-body-2 mb-3">
          Este bovino tiene una preñez activa registrada:
        </p>
        <v-sheet color="orange-lighten-5" rounded="lg" class="pa-3 text-body-2" v-if="activePregnancyInfo">
          <div><span class="font-weight-bold">Fecha preñez:</span> {{ new Date(activePregnancyInfo.dateInit).toLocaleDateString('es-MX') }}</div>
          <div><span class="font-weight-bold">Probable parto:</span> {{ new Date(activePregnancyInfo.dateEnd).toLocaleDateString('es-MX') }}</div>
        </v-sheet>
        <p class="text-body-2 mt-3 text-orange-darken-3 font-weight-medium">
          Registrar un nuevo celo implica que la preñez actual ya no está vigente. ¿Deseas continuar?
        </p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="activePregnancyWarning = false">Cancelar</v-btn>
        <v-btn color="orange-darken-2" variant="flat" class="px-6" @click="confirmHeatOverride">
          Sí, registrar celo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Advertencia celo reciente -->
  <v-dialog v-model="recentHeatWarning" max-width="480" persistent>
    <v-card class="rounded-xl">
      <v-card-title class="pa-4 bg-pink-darken-2 text-white d-flex align-center">
        <v-icon class="mr-2">ph-thermometer-hot</v-icon> Celo reciente detectado
      </v-card-title>
      <v-card-text class="pa-5">
        <p class="text-body-2 mb-3">
          Ya existe un celo registrado hace menos de <strong>{{ HEAT_MIN_DAYS }} días</strong>:
        </p>
        <v-sheet color="pink-lighten-5" rounded="lg" class="pa-3 text-body-2" v-if="recentHeatInfo">
          <div><span class="font-weight-bold">Fecha inicio:</span> {{ new Date(recentHeatInfo.heatDateInit).toLocaleDateString('es-MX') }}</div>
          <div v-if="recentHeatInfo.heatDateEnd"><span class="font-weight-bold">Fecha fin:</span> {{ new Date(recentHeatInfo.heatDateEnd).toLocaleDateString('es-MX') }}</div>
        </v-sheet>
        <p class="text-body-2 mt-3 text-pink-darken-2 font-weight-medium">
          El ciclo estral bovino es de 18–24 días. ¿Deseas registrar el celo de todas formas?
        </p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="recentHeatWarning = false">Cancelar</v-btn>
        <v-btn color="pink-darken-2" variant="flat" class="px-6" @click="confirmRecentHeatOverride">
          Sí, registrar celo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <RemoveItemConfirmationDialog
    v-if="confirmDeleteDialog"
    v-model="confirmDeleteDialog"
    :loading="deleting"
    @onConfirm="deleteHeat"
  />
</template>
