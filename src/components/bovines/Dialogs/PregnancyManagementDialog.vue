<script lang="ts" setup>
import { ref, computed, watch, nextTick } from "vue";
import { pregnancyService, bovineService, liveStockService, usuariosService } from "@/app/http/httpServiceProvider";
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
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const confirmDeleteDialog = ref(false);
const itemToDelete = ref<any>(null);
const deleting = ref(false);

const page = ref(1);
const config = ref({ page: 1, noOfItems: 0, itemsPerPage: 5 });
const pregnancyTypes = ref<any[]>([]);
const listMales = ref<any[]>([]);
const listFemales = ref<any[]>([]);
const listUsers = ref<any[]>([]);

const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const emptyForm = () => ({
  dateInit: "",
  dateEnd: "",
  idPregnancyType: "",
  idUser: "",
  idMaleBovine: null as string | null,
  gestationMonths: 0,
  comments: "",
  origin: "HATO" as "HATO" | "EXTERNO",
  idEmbryoDonorBovine: "",
  externalBovine: { name: "", earTag: "", ranch: "" },
  externalFemaleBovine: { name: "", earTag: "", ranch: "" }
});

const form = ref(emptyForm());

/* ------------------ Cálculo fecha probable parto ------------------ */
watch(() => form.value.dateInit, (newDate) => {
  if (newDate) {
    const date = new Date(newDate);
    date.setDate(date.getDate() + 290);
    form.value.dateEnd = date.toISOString().substring(0, 10);
  }
}, { immediate: true });

/* ------------------ Computed: Tipo de preñez ------------------ */
const selectedType = computed(() => pregnancyTypes.value.find(t => t.id === form.value.idPregnancyType));
const typeName = computed(() => selectedType.value?.name?.toUpperCase() || "");

const isMontaNatural  = computed(() => typeName.value.includes('MONTA NATURAL'));
const isInseminacion  = computed(() => typeName.value.includes('INSEMINACION'));
const isTransferencia = computed(() => typeName.value.includes('TRANSFERENCIA') || typeName.value.includes('EMBRION'));

const showOriginToggle  = computed(() => isInseminacion.value || isTransferencia.value);
const showHatoMale      = computed(() => isMontaNatural.value || (showOriginToggle.value && form.value.origin === 'HATO'));
const showExterno       = computed(() => showOriginToggle.value && form.value.origin === 'EXTERNO');
const showHatoDonor     = computed(() => isTransferencia.value && form.value.origin === 'HATO');
const showExternoDonor  = computed(() => isTransferencia.value && form.value.origin === 'EXTERNO');

/* ------------------ Validación ------------------ */
const formRef = ref<any>(null);
const required = (v: any) => !!v || "Campo requerido";
const suppressTypeWatcher = ref(false);

/* Limpiar campos de toro/externo al cambiar origen */
watch(() => form.value.origin, () => {
  if (suppressTypeWatcher.value) return;
  form.value.idMaleBovine = null;
  form.value.externalBovine = { name: "", earTag: "", ranch: "" };
  form.value.idEmbryoDonorBovine = "";
  form.value.externalFemaleBovine = { name: "", earTag: "", ranch: "" };
});

/* Limpiar campos específicos al cambiar tipo */
watch(() => form.value.idPregnancyType, () => {
  if (suppressTypeWatcher.value) return;
  form.value.origin = "HATO";
  form.value.idMaleBovine = null;
  form.value.idEmbryoDonorBovine = "";
  form.value.externalBovine = { name: "", earTag: "", ranch: "" };
  form.value.externalFemaleBovine = { name: "", earTag: "", ranch: "" };
});

/* ------------------ Historial ------------------ */
const loadHistory = async () => {
  if (!props.bovine?.id) return;
  try {
    loading.value = true;
    const res = await pregnancyService.getHistory({
      idBovine: props.bovine.id,
      page: page.value,
      limit: config.value.itemsPerPage
    });
    history.value = res.data?.data?.data || res.data?.data || [];
    config.value.noOfItems = res.data?.data?.total || history.value.length;
  } catch {
    showErrorAlert("No se pudo cargar el historial");
  } finally {
    loading.value = false;
  }
};

/* ------------------ Guardar ------------------ */
const savePregnancy = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  try {
    saving.value = true;

    const payload: any = {
      idBovine: props.bovine.id,
      idPregnancyType: form.value.idPregnancyType,
      idUser: form.value.idUser,
      dateInit: form.value.dateInit,
      dateEnd: form.value.dateEnd,
      gestationMonths: form.value.gestationMonths,
      comments: form.value.comments,
      origin: showOriginToggle.value ? form.value.origin : "HATO",
      ...(showHatoMale.value && form.value.idMaleBovine && { idMaleBovine: form.value.idMaleBovine }),
      ...(showExterno.value && { externalBovine: form.value.externalBovine }),
      ...(showHatoDonor.value && { idEmbryoDonorBovine: form.value.idEmbryoDonorBovine }),
      ...(showExternoDonor.value && { externalFemaleBovine: form.value.externalFemaleBovine }),
    };

    if (isEditing.value) {
      await pregnancyService.updatePregnancy(editingId.value!, payload);
      showSuccessAlert("Actualizado");
    } else {
      await pregnancyService.createPregnancy(payload);
      showSuccessAlert("Registrado");
    }

    closeForm();
    loadHistory();
  } catch {
    showErrorAlert("Error al guardar");
  } finally {
    saving.value = false;
  }
};

/* ------------------ Editar ------------------ */
const openEdit = (item: any) => {
  suppressTypeWatcher.value = true;
  isEditing.value = true;
  editingId.value = item.id;
  form.value = {
    dateInit: item.dateInit ? item.dateInit.substring(0, 10) : "",
    dateEnd: item.dateEnd ? item.dateEnd.substring(0, 10) : "",
    idPregnancyType: item.pregnancyType?.id || item.idPregnancyType || "",
    idUser: item.user?.id || item.idUser || "",
    idMaleBovine: item.maleBovine?.id || item.idMaleBovine || null,
    gestationMonths: item.gestationMonths || 0,
    comments: item.comments || "",
    origin: item.origin || "HATO",
    idEmbryoDonorBovine: item.embryoDonorBovine?.id || item.idEmbryoDonorBovine || "",
    externalBovine: item.externalBovine
      ? { name: item.externalBovine.name || "", earTag: item.externalBovine.earTag || "", ranch: item.externalBovine.ranch || "" }
      : { name: "", earTag: "", ranch: "" },
    externalFemaleBovine: item.externalFemaleBovine
      ? { name: item.externalFemaleBovine.name || "", earTag: item.externalFemaleBovine.earTag || "", ranch: item.externalFemaleBovine.ranch || "" }
      : { name: "", earTag: "", ranch: "" }
  };
  nextTick(() => { suppressTypeWatcher.value = false; });
  showForm.value = true;
};

/* ------------------ Eliminar ------------------ */
const confirmDelete = (item: any) => {
  itemToDelete.value = item;
  confirmDeleteDialog.value = true;
};

const deletePregnancy = async () => {
  try {
    deleting.value = true;
    await pregnancyService.deletePregnancy(itemToDelete.value.id);
    showSuccessAlert("Registro eliminado");
    confirmDeleteDialog.value = false;
    itemToDelete.value = null;
    loadHistory();
  } catch {
    showErrorAlert("Error al eliminar");
  } finally {
    deleting.value = false;
  }
};

/* ------------------ Cerrar formulario ------------------ */
const closeForm = () => {
  showForm.value = false;
  isEditing.value = false;
  editingId.value = null;
  form.value = emptyForm();
  nextTick(() => formRef.value?.resetValidation());
};

const openNewForm = () => {
  closeForm();
  nextTick(() => { showForm.value = true; });
};

/* ------------------ Catálogos ------------------ */
const loadCatalogues = async () => {
  const [resT, resSex, resUsers] = await Promise.all([
    liveStockService.getItems("pregnancy-type", { page: 1, limit: 100 }),
    liveStockService.getItems("sex", { page: 1, limit: 10 }),
    usuariosService.getUsers()
  ]);

  pregnancyTypes.value = resT.data?.data?.data || resT.data?.data || [];
  listUsers.value = resUsers.data?.data || resUsers.data || [];

  const sexList = resSex.data?.data?.data || resSex.data?.data || [];
  const maleId   = sexList.find((s: any) => s.name === 'MACHO')?.id;
  const femaleId = sexList.find((s: any) => s.name === 'HEMBRA')?.id;

  const requests: Promise<any>[] = [];
  if (maleId)   requests.push(bovineService.getBovinesBySex(maleId));
  if (femaleId) requests.push(bovineService.getBovinesBySex(femaleId));

  const [resMales, resFemales] = await Promise.all(requests);
  listMales.value   = resMales?.data?.data || [];
  listFemales.value = resFemales?.data?.data || [];
};

watch(page, loadHistory);

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    page.value = 1;
    closeForm();
    await loadCatalogues();
    loadHistory();
  }
}, { immediate: true });

const expandedRows = ref<Set<string>>(new Set());

const toggleRow = (id: string) => {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id);
  } else {
    expandedRows.value.add(id);
  }
  expandedRows.value = new Set(expandedRows.value);
};

const headers = [
  { title: "" }, { title: "Fecha Preñez" }, { title: "Tipo" }, { title: "Origen" },
  { title: "Responsable" }, { title: "F. Probable Parto" },
  { title: "Acciones", align: "center" }
];
</script>

<template>
  <v-dialog :model-value="modelValue" fullscreen transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <v-toolbar color="primary" flat>
        <v-btn icon="ph-x" @click="emit('update:modelValue', false)" />
        <v-toolbar-title class="font-weight-bold">Control Reproductivo: {{ bovine?.name }}</v-toolbar-title>
        <v-spacer />
        <v-btn variant="flat" color="white" class="text-primary px-6" @click="openNewForm">
          Nuevo Registro
        </v-btn>
      </v-toolbar>

      <v-container fluid class="pa-6">
        <v-row>
          <v-expand-transition>
            <v-col cols="12" v-if="showForm">
              <v-card border flat class="rounded-lg pa-4 mb-4">
                <v-form ref="formRef">

                  <!-- ── Grupo 1: Información General ── -->
                  <div class="text-caption font-weight-bold text-grey-darken-1 mb-2 px-2">INFORMACIÓN GENERAL</div>
                  <v-row dense class="mb-2">
                    <v-col cols="12" md="2">
                      <v-text-field v-model="form.dateInit" type="date" label="Fecha Preñez"
                        variant="outlined" density="comfortable" :max="today" :rules="[required]" />
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-text-field v-model="form.dateEnd" type="date" label="Probable Parto"
                        variant="outlined" density="comfortable" readonly bg-color="grey-lighten-4" />
                    </v-col>
                    <v-col cols="12" md="1">
                      <v-text-field v-model.number="form.gestationMonths" type="number" label="Meses Gestación"
                        variant="outlined" density="comfortable" min="0" max="24" :rules="[v => v !== '' && v !== null && v !== undefined || 'Campo requerido']" />
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-select v-model="form.idPregnancyType" :items="pregnancyTypes"
                        item-title="name" item-value="id" label="Tipo de Preñez"
                        variant="outlined" density="comfortable" :rules="[required]" />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select v-model="form.idUser" :items="listUsers"
                        item-title="name" item-value="id" label="¿Quién diagnosticó?"
                        variant="outlined" density="comfortable" :rules="[required]">
                        <template #item="{ props: itemProps, item }">
                          <v-list-item v-bind="itemProps"
                            :title="`${item.raw.name} ${item.raw.lastName}`"
                            :subtitle="item.raw.mail" />
                        </template>
                        <template #selection="{ item }">
                          {{ item.raw.name }} {{ item.raw.lastName }}
                        </template>
                      </v-select>
                    </v-col>
                  </v-row>

                  <template v-if="form.idPregnancyType">
                  <v-divider class="mb-3" />

                  <!-- ── Origen de la operación (solo INSEMINACION y TRANSFERENCIA) ── -->
                  <template v-if="showOriginToggle">
                    <div class="text-caption font-weight-bold text-grey-darken-1 mb-2 px-2">ORIGEN DE LA OPERACIÓN</div>
                    <v-row dense class="mb-3">
                      <v-col cols="12" md="auto" class="d-flex align-center">
                        <v-btn-toggle v-model="form.origin" mandatory density="comfortable"
                          color="primary" variant="outlined">
                          <v-btn value="HATO" size="small">Hato</v-btn>
                          <v-btn value="EXTERNO" size="small">Externo</v-btn>
                        </v-btn-toggle>
                      </v-col>
                    </v-row>
                    <v-divider class="mb-3" />
                  </template>

                  <!-- ── Grupo 2: Semental / Padre ── -->
                    <div class="text-caption font-weight-bold text-grey-darken-1 mb-2 px-2">SEMENTAL / PADRE</div>
                    <v-row dense class="mb-2">
                      <!-- Semental del hato -->
                      <v-col cols="12" md="4" v-if="showHatoMale">
                        <v-autocomplete v-model="form.idMaleBovine" :items="listMales"
                          :item-title="(b: any) => `${b.name} ${b.internalEarTag ?? ''}`"
                          item-value="id" label="Semental del Hato"
                          variant="outlined" density="comfortable" clearable :rules="[required]">
                          <template #item="{ props: itemProps, item }">
                            <v-list-item v-bind="itemProps" :title="item.raw.name" :subtitle="`Arete: ${item.raw.internalEarTag}`" />
                          </template>
                          <template #selection="{ item }">
                            {{ item.raw.name }} — {{ item.raw.internalEarTag }}
                          </template>
                        </v-autocomplete>
                      </v-col>
                      <!-- Toro externo -->
                      <template v-if="showExterno">
                        <v-col cols="12" md="3">
                          <v-text-field v-model="form.externalBovine.name" label="Nombre del Toro"
                            variant="outlined" density="comfortable" :rules="[required]" />
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-text-field v-model="form.externalBovine.earTag" label="Arete"
                            variant="outlined" density="comfortable" :rules="[required]" />
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-text-field v-model="form.externalBovine.ranch" label="Rancho"
                            variant="outlined" density="comfortable" :rules="[required]" />
                        </v-col>
                      </template>
                    </v-row>
                  </template>

                  <!-- ── Grupo 3: Vaca Donadora (solo TRANSFERENCIA EMBRION) ── -->
                  <template v-if="isTransferencia">
                    <v-divider class="mb-3" />
                    <div class="text-caption font-weight-bold text-grey-darken-1 mb-2 px-2">VACA DONADORA DE EMBRIÓN</div>
                    <v-row dense class="mb-2">
                      <!-- Donadora interna -->
                      <v-col cols="12" md="5" v-if="showHatoDonor">
                        <v-autocomplete v-model="form.idEmbryoDonorBovine" :items="listFemales"
                          :item-title="(b: any) => `${b.name} ${b.internalEarTag ?? ''}`"
                          item-value="id" label="Vaca Donadora (del hato)"
                          variant="outlined" density="comfortable" clearable :rules="[required]">
                          <template #item="{ props: itemProps, item }">
                            <v-list-item v-bind="itemProps" :title="item.raw.name" :subtitle="`Arete: ${item.raw.internalEarTag}`" />
                          </template>
                          <template #selection="{ item }">
                            {{ item.raw.name }} — {{ item.raw.internalEarTag }}
                          </template>
                        </v-autocomplete>
                      </v-col>
                      <!-- Donadora externa -->
                      <template v-if="showExternoDonor">
                        <v-col cols="12" md="3">
                          <v-text-field v-model="form.externalFemaleBovine.name" label="Nombre de la Vaca"
                            variant="outlined" density="comfortable" :rules="[required]" />
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-text-field v-model="form.externalFemaleBovine.earTag" label="Arete"
                            variant="outlined" density="comfortable" :rules="[required]" />
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-text-field v-model="form.externalFemaleBovine.ranch" label="Rancho"
                            variant="outlined" density="comfortable" :rules="[required]" />
                        </v-col>
                      </template>
                    </v-row>
                  </template>

                  <v-divider class="mb-3" />

                  <!-- ── Comentarios ── -->
                  <v-row dense>
                    <v-col cols="12">
                      <v-text-field v-model="form.comments" label="Diagnóstico / Comentarios"
                        variant="outlined" density="comfortable" :rules="[required]" />
                    </v-col>
                  </v-row>

                  <v-card-actions>
                    <v-spacer />
                    <v-btn color="primary" variant="flat" class="px-10" :loading="saving" @click="savePregnancy">
                      Guardar
                    </v-btn>
                  </v-card-actions>
                </v-form>
              </v-card>
            </v-col>
          </v-expand-transition>

          <v-col cols="12">
            <v-card border flat class="rounded-lg">
              <Table v-model="page" :config="config" :headerItems="headers" :loading="loading" is-pagination>
                <template #body>
                  <template v-for="item in history" :key="item.id">
                    <!-- Fila principal -->
                    <tr>
                      <td>
                        <v-btn
                          :icon="expandedRows.has(item.id) ? 'ph-caret-up' : 'ph-caret-down'"
                          size="x-small" variant="text" color="grey"
                          @click="toggleRow(item.id)"
                        />
                      </td>
                      <td class="font-weight-bold">{{ new Date(item.dateInit).toLocaleDateString() }}</td>
                      <td>
                        <v-chip size="x-small" label color="primary" variant="tonal">
                          {{ item.pregnancyType?.name }}
                        </v-chip>
                      </td>
                      <td>
                        <v-chip size="x-small" :color="item.origin === 'HATO' ? 'success' : 'warning'" variant="tonal">
                          {{ item.origin || '---' }}
                        </v-chip>
                      </td>
                      <td>{{ item.user ? `${item.user.name} ${item.user.lastName}` : '---' }}</td>
                      <td class="text-primary font-weight-black">
                        {{ item.dateEnd ? new Date(item.dateEnd).toLocaleDateString() : 'Pendiente' }}
                      </td>
                      <td class="text-center">
                        <v-btn icon="ph-pencil" size="small" variant="text" color="primary" @click="openEdit(item)" />
                        <v-btn icon="ph-trash" size="small" variant="text" color="error" @click="confirmDelete(item)" />
                      </td>
                    </tr>
                    <!-- Fila expandible -->
                    <tr v-if="expandedRows.has(item.id)" class="bg-grey-lighten-5">
                      <td colspan="7" class="pa-4">
                        <v-row dense>
                          <!-- Semental / Padre -->
                          <v-col cols="12" md="3">
                            <div class="text-caption text-grey font-weight-bold mb-1">SEMENTAL / PADRE</div>
                            <template v-if="item.maleBovine">
                              <span class="font-weight-medium">{{ item.maleBovine.name }}</span>
                              <span class="text-caption text-grey"> · Arete: {{ item.maleBovine.internalEarTag }}</span>
                            </template>
                            <template v-else-if="item.externalBovine?.name">
                              <span class="font-weight-medium">{{ item.externalBovine.name }}</span>
                              <span v-if="item.externalBovine.earTag" class="text-caption text-grey"> · Arete: {{ item.externalBovine.earTag }}</span>
                              <span v-if="item.externalBovine.ranch" class="text-caption text-grey"> · {{ item.externalBovine.ranch }}</span>
                            </template>
                            <span v-else class="text-grey">---</span>
                          </v-col>

                          <!-- Vaca Donadora (interna del hato) -->
                          <v-col cols="12" md="3" v-if="item.embryoDonorBovine">
                            <div class="text-caption text-grey font-weight-bold mb-1">VACA DONADORA</div>
                            <span class="font-weight-medium">{{ item.embryoDonorBovine.name }}</span>
                            <span class="text-caption text-grey"> · Arete: {{ item.embryoDonorBovine.internalEarTag }}</span>
                          </v-col>

                          <!-- Vaca Donadora (externa) -->
                          <v-col cols="12" md="3" v-else-if="item.externalFemaleBovine?.name">
                            <div class="text-caption text-grey font-weight-bold mb-1">VACA DONADORA (EXTERNA)</div>
                            <span class="font-weight-medium">{{ item.externalFemaleBovine.name }}</span>
                            <span v-if="item.externalFemaleBovine.earTag" class="text-caption text-grey"> · Arete: {{ item.externalFemaleBovine.earTag }}</span>
                            <span v-if="item.externalFemaleBovine.ranch" class="text-caption text-grey"> · {{ item.externalFemaleBovine.ranch }}</span>
                          </v-col>

                          <!-- Meses Gestación -->
                          <v-col cols="12" md="2">
                            <div class="text-caption text-grey font-weight-bold mb-1">MESES GESTACIÓN</div>
                            {{ item.gestationMonths ?? '---' }}
                          </v-col>

                          <!-- Comentarios -->
                          <v-col cols="12" md="4">
                            <div class="text-caption text-grey font-weight-bold mb-1">COMENTARIOS</div>
                            {{ item.comments || '---' }}
                          </v-col>
                        </v-row>
                      </td>
                    </tr>
                  </template>
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
    @onConfirm="deletePregnancy"
  />
</template>
