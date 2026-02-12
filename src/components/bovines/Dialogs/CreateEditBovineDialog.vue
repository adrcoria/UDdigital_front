<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { bovineService, liveStockService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

/* ------------------ State ------------------ */
const dialog = ref(false);
const loading = ref(false);
const loadingCatalogs = ref(false);

const lists = ref<any>({
  sex: [], races: [], types: [], purposes: [], origins: [], owners: [], deathCauses: []
});

const listMales = ref([]);
const listFemales = ref([]);

const form = ref<any>({
  companyId: "2a05091a-6d59-44c0-af4a-d54cc9e5ea0f",
  siniigaEarTag: "",
  internalEarTag: "",
  birthDate: "",
  name: "",
  notes: "",
  dateAddedToHerd: "",
  daysOpen: 0,
  birthWeight: 0,
  saleValue: 0,
  purchaseValue: 0,
  netWeight: 0,
  sexId: null,
  bovineOriginId: null,
  bovineTypeId: null,
  fatherId: null,
  motherId: null,
  birthStatus: "VIVO",
  bovineStatus: "VIVO",
  deathCauseId: null,
  livestockOwnerId: null,
  bovinePurposeId: null,
  deathComments: "",
  raceAssignments: []
});

const selectedRaces = ref<any[]>([{ raceId: null, percentage: 100, order: 1 }]);

/* ------------------ Computed ------------------ */
const totalPercentage = computed(() => {
  return selectedRaces.value.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
});

/* ------------------ Logic ------------------ */
const loadData = async () => {
  try {
    loadingCatalogs.value = true;
    
    const fetchSafe = async (slug: string) => {
      try {
        const res = await liveStockService.getItems(slug, { page: 1, limit: 1000 });
        return res.data?.data || [];
      } catch (e) { return []; }
    };

    const [sex, race, type, purpose, origin, owner, death] = await Promise.all([
      fetchSafe("sex"), fetchSafe("bovine-race"), fetchSafe("bovine-type"),
      fetchSafe("bovine-purpose"), fetchSafe("bovine-origin"), 
      fetchSafe("livestock-owner"), fetchSafe("death-cause")
    ]);

    lists.value = { sex, races: race, types: type, purposes: purpose, origins: origin, owners: owner, deathCauses: death };

    const maleId = sex.find((s: any) => s.name.toUpperCase() === 'MACHO')?.id;
    const femaleId = sex.find((s: any) => s.name.toUpperCase() === 'HEMBRA')?.id;

    if (maleId) {
      const resM = await bovineService.getBovinesBySex(maleId);
      listMales.value = resM.data?.data || [];
    }
    if (femaleId) {
      const resF = await bovineService.getBovinesBySex(femaleId);
      listFemales.value = resF.data?.data || [];
    }

  } catch (e) {
    console.error("Error en carga de datos iniciales");
  } finally {
    loadingCatalogs.value = false;
  }
};

const resetForm = () => {
  form.value = {
    companyId: "2a05091a-6d59-44c0-af4a-d54cc9e5ea0f",
    siniigaEarTag: "", internalEarTag: "", name: "", birthDate: "",
    notes: "", dateAddedToHerd: "", daysOpen: 0, birthWeight: 0,
    saleValue: 0, purchaseValue: 0, netWeight: 0, sexId: null,
    bovineOriginId: null, bovineTypeId: null, fatherId: null, motherId: null,
    birthStatus: "VIVO", bovineStatus: "VIVO", deathCauseId: null,
    livestockOwnerId: null, bovinePurposeId: null, deathComments: ""
  };
  selectedRaces.value = [{ raceId: null, percentage: 100, order: 1 }];
};

/* ------------------ Watchers ------------------ */
watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) {
    loadData();
    if (props.item) {
      form.value = { ...props.item };
      selectedRaces.value = props.item.raceAssignments?.length 
        ? JSON.parse(JSON.stringify(props.item.raceAssignments))
        : [{ raceId: null, percentage: 100, order: 1 }];
    } else {
      resetForm();
    }
  }
}, { immediate: true });

watch(dialog, (v) => {
  emit("update:modelValue", v);
});

/* ------------------ Actions ------------------ */
const addRace = () => selectedRaces.value.push({ raceId: null, percentage: 0, order: selectedRaces.value.length + 1 });
const removeRace = (index: number) => selectedRaces.value.splice(index, 1);

const save = async () => {
  if (totalPercentage.value !== 100) {
    showErrorAlert("La suma de porcentajes de raza debe ser exactamente 100%");
    return;
  }
  try {
    loading.value = true;
    const finalPayload = { 
      ...form.value, 
      raceAssignments: selectedRaces.value.map((r, i) => ({ ...r, order: i + 1 }))
    };
    
    if (props.item?.id) {
      await bovineService.updateBovine(props.item.id, finalPayload);
      showSuccessAlert("Bovino actualizado");
    } else {
      await bovineService.createBovine(finalPayload);
      showSuccessAlert("Bovino registrado");
    }
    emit("refresh");
    dialog.value = false;
  } catch (error: any) {
    showErrorAlert(error.response?.data?.message || "Error al guardar");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="1000px" scrollable persistent>
    <v-card v-if="dialog">
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon icon="ph-cow" class="mr-2" />
        <span class="text-h6 font-weight-bold">{{ item ? 'Editar' : 'Registrar' }} Bovino</span>
        <v-spacer />
        <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" />
      </v-card-title>

      <v-card-text class="pa-6">
        <div v-if="loadingCatalogs" class="text-center py-10">
          <v-progress-circular indeterminate color="primary" />
          <div class="mt-2 text-grey">Preparando formulario...</div>
        </div>

        <v-row v-else dense>
          <v-col cols="12" md="4"><v-text-field label="Arete Siniiga" v-model="form.siniigaEarTag" variant="outlined" /></v-col>
          <v-col cols="12" md="4"><v-text-field label="Arete Interno" v-model="form.internalEarTag" variant="outlined" /></v-col>
          <v-col cols="12" md="4"><v-text-field label="Nombre / Apodo" v-model="form.name" variant="outlined" /></v-col>

          <v-col cols="12" md="3"><v-text-field label="Fecha Nac." type="date" v-model="form.birthDate" variant="outlined" /></v-col>
          <v-col cols="12" md="3"><v-text-field label="Fecha Ingreso Hato" type="date" v-model="form.dateAddedToHerd" variant="outlined" /></v-col>
          <v-col cols="12" md="3"><v-text-field label="Peso Nac. (kg)" type="number" v-model="form.birthWeight" variant="outlined" /></v-col>
          <v-col cols="12" md="3"><v-text-field label="Peso Neto (kg)" type="number" v-model="form.netWeight" variant="outlined" /></v-col>

          <v-col cols="12" md="4">
            <v-autocomplete label="Sexo" v-model="form.sexId" :items="lists.sex" item-title="name" item-value="id" variant="outlined" />
          </v-col>
          <v-col cols="12" md="4">
            <v-autocomplete label="Propietario" v-model="form.livestockOwnerId" :items="lists.owners" :item-title="i => `${i.firstName} ${i.lastName}`" item-value="id" variant="outlined" />
          </v-col>
          <v-col cols="12" md="4">
            <v-autocomplete label="Origen" v-model="form.bovineOriginId" :items="lists.origins" item-title="name" item-value="id" variant="outlined" />
          </v-col>

          <v-col cols="12" v-if="lists.origins.find(o => o.id === form.bovineOriginId)?.name.toUpperCase().includes('HATO')">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-autocomplete label="Padre (Semental)" v-model="form.fatherId" :items="listMales" item-title="name" item-value="id" variant="outlined" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete label="Madre (Vaca)" v-model="form.motherId" :items="listFemales" item-title="name" item-value="id" variant="outlined" clearable />
              </v-col>
            </v-row>
          </v-col>

          <v-col cols="12"><v-divider class="my-3" />Estatus</v-col>
          <v-col cols="12" md="4">
            <v-autocomplete label="Estatus al Nacer" v-model="form.birthStatus" :items="['VIVO', 'MUERTO']" variant="outlined" />
          </v-col>
          <v-col cols="12" md="4">
            <v-autocomplete label="Estatus Actual" v-model="form.bovineStatus" :items="['VIVO', 'MUERTO']" variant="outlined" />
          </v-col>
          <v-col cols="12" md="4" v-if="form.bovineStatus === 'MUERTO'">
            <v-autocomplete label="Causa de Muerte" v-model="form.deathCauseId" :items="lists.deathCauses" item-title="name" item-value="id" variant="outlined" />
          </v-col>

          <v-col cols="12">
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2">Composición Racial (%)</span>
              <v-btn size="small" color="secondary" variant="flat" @click="addRace" :disabled="totalPercentage >= 100">+ Añadir Raza</v-btn>
            </div>
            <v-row v-for="(race, index) in selectedRaces" :key="index" dense align="center">
              <v-col cols="7">
                <v-autocomplete label="Raza" v-model="race.raceId" :items="lists.races" item-title="name" item-value="id" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="3">
                <v-text-field label="%" v-model="race.percentage" type="number" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="2">
                <v-btn icon="ph-trash" variant="text" color="error" @click="removeRace(index)" v-if="selectedRaces.length > 1" />
              </v-col>
            </v-row>
            <v-alert v-if="totalPercentage !== 100" type="warning" density="compact" variant="tonal" class="mt-2 text-caption">
              La suma debe ser 100%. Actual: {{ totalPercentage }}%
            </v-alert>
          </v-col>

          <v-col cols="12">
            <v-textarea label="Notas Generales" v-model="form.notes" variant="outlined" rows="2" />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false" class="text-none">Cancelar</v-btn>
        <v-btn color="primary" @click="save" :loading="loading" :disabled="totalPercentage !== 100" class="text-none px-6">
          {{ item ? 'Actualizar' : 'Guardar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>