<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { bovineService } from "@/app/http/httpServiceProvider";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue"]);

const dialog = ref(false);
const loading = ref(false);
const details = ref<any>(null);

// Estado para la galería
const galleryDialog = ref(false);
const currentPhotoIndex = ref(0);

const loadDetails = async () => {
  if (!props.item?.id) return;
  try {
    loading.value = true;
    const response = await bovineService.getBovineById(props.item.id);
    details.value = response.data?.data;
  } catch (error) {
    console.error("Error al cargar ficha de vida");
  } finally {
    loading.value = false;
  }
};

// Lógica de fotos
const mainPhoto = computed(() => {
  return details.value?.bovinePhotos?.length > 0 
    ? details.value.bovinePhotos[0].url 
    : null;
});

const openGallery = (index: number = 0) => {
  currentPhotoIndex.value = index;
  galleryDialog.value = true;
};

watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) loadDetails();
}, { immediate: true });

watch(dialog, (val) => emit("update:modelValue", val));
</script>

<template>
  <v-dialog v-model="dialog" max-width="1000" scrollable>
    <v-card v-if="details" class="rounded-xl">
      <v-card-title class="pa-6 bg-grey-lighten-4 border-b">
        <v-row align="center" no-gutters>
          <v-avatar 
            size="70" 
            color="primary" 
            variant="flat" 
            class="mr-4 rounded-lg cursor-pointer"
            @click="details.bovinePhotos?.length ? openGallery(0) : null"
          >
            <v-img v-if="mainPhoto" :src="mainPhoto" cover />
            <v-icon v-else size="35" color="white">ph-barcode</v-icon>
            
            <v-badge
              v-if="details.bovinePhotos?.length > 1"
              :content="`+${details.bovinePhotos.length - 1}`"
              color="secondary"
              location="bottom right"
              offset-x="5"
              offset-y="5"
            />
          </v-avatar>

          <div>
            <div class="text-h5 font-weight-black text-uppercase">{{ details.name || 'SIN NOMBRE REGISTRADO' }}</div>
            <div class="d-flex align-center mt-1">
              <span class="text-caption font-weight-bold mr-2 text-grey-darken-2">ARETE SINIIGA:</span>
              <v-chip size="small" color="primary" class="mr-4 font-weight-black">{{ details.siniigaEarTag || 'N/A' }}</v-chip>
              <span class="text-caption font-weight-bold mr-2 text-grey-darken-2">ARETE INTERNO:</span>
              <v-chip size="small" variant="outlined" color="primary" class="font-weight-black">{{ details.internalEarTag || 'N/A' }}</v-chip>
            </div>
          </div>
          <v-spacer />
          <div class="text-right">
            <div class="text-caption text-grey font-weight-bold mb-1 text-uppercase">Estado de Salud</div>
            <v-chip :color="details.bovineStatus === 'VIVO' ? 'success' : 'error'" variant="flat" class="font-weight-bold">
              {{ details.bovineStatus || 'DESCONOCIDO' }}
            </v-chip>
          </div>
        </v-row>
      </v-card-title>

      <v-card-text class="pa-0">
        <div class="bg-primary-lighten-5 pa-4 d-flex justify-space-around border-b">
          <div class="text-center">
            <div class="text-caption text-grey-darken-1 text-uppercase">Peso Actual</div>
            <div class="text-h6 font-weight-black">{{ details.netWeight || 0 }} kg</div>
          </div>
          <v-divider vertical inset />
          <div class="text-center">
            <div class="text-caption text-grey-darken-1 text-uppercase">Etapa ciclo vida</div>
            <div class="text-h6 font-weight-black">{{ details.bovineType?.name || 'N/A' }}</div>
          </div>
          <v-divider vertical inset />
          <div class="text-center">
            <div class="text-caption text-grey-darken-1 text-uppercase">Valor Proyectado</div>
            <div class="text-h6 font-weight-black text-success">${{ details.saleValue || '0.00' }}</div>
          </div>
        </div>

        <div class="pa-6">
          <v-row>
            <v-col cols="12" md="4">
              <div class="d-flex align-center mb-4">
                <v-icon color="primary" class="mr-2">ph-info</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary">Caracterización</span>
              </div>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption text-grey">Sexo</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 text-black font-weight-medium">{{ details.sex?.name || 'N/A' }}</v-list-item-subtitle>
                </v-list-item>
              
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption text-grey">Propósito</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 text-black font-weight-medium">{{ details.bovinePurpose?.name || 'N/A' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption text-grey">Origen</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 text-black font-weight-medium">{{ details.bovineOrigin?.name || 'N/A' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <v-divider class="my-4" />
              
              <div class="text-caption font-weight-bold text-grey mb-3">DISTRIBUCIÓN DE RAZA</div>
              <div v-if="details.raceAssignments?.length">
                <div v-for="race in details.raceAssignments" :key="race.id" class="mb-3">
                  <div class="d-flex justify-space-between text-body-2 mb-1">
                    <span>{{ race.bovineRace?.name }}</span>
                    <span class="font-weight-black">{{ race.percentage }}%</span>
                  </div>
                  <v-progress-linear :model-value="race.percentage" color="primary" height="8" rounded />
                </div>
              </div>
              <div v-else class="text-caption text-italic text-grey">Sin composición racial registrada</div>
            </v-col>

            <v-col cols="12" md="4" class="border-s border-e px-6">
              <div class="d-flex align-center mb-4">
                <v-icon color="primary" class="mr-2">ph-tree-structure</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary">Línea de Vida</span>
              </div>
              
              <div class="mb-4">
                <div class="text-caption text-grey">FECHA DE NACIMIENTO</div>
                <div class="text-body-1 font-weight-medium">{{ details.birthDate || 'N/A' }}</div>
              </div>
              <div class="mb-6">
                <div class="text-caption text-grey">INGRESO AL HATO</div>
                <div class="text-body-1 font-weight-medium">{{ details.dateAddedToHerd || 'N/A' }}</div>
              </div>

              <div class="text-caption font-weight-bold text-grey mb-2 text-uppercase">Genealogía</div>
              <v-card variant="outlined" color="blue-grey-lighten-4" class="pa-3 mb-3 border-dashed">
                <div class="text-caption text-blue-grey-darken-1 font-weight-bold">PADRE</div>
                <div class="text-body-2 font-weight-bold text-black">{{ details.father?.name || 'SIN REGISTRO' }}</div>
                <div class="text-caption">ARETE: {{ details.father?.siniigaEarTag || 'N/A' }}</div>
              </v-card>
              <v-card variant="outlined" color="pink-lighten-4" class="pa-3 border-dashed">
                <div class="text-caption text-pink-darken-1 font-weight-bold">MADRE</div>
                <div class="text-body-2 font-weight-bold text-black">{{ details.mother?.name || 'SIN REGISTRO' }}</div>
                <div class="text-caption">ARETE: {{ details.mother?.siniigaEarTag || 'N/A' }}</div>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <div class="d-flex align-center mb-4">
                <v-icon color="primary" class="mr-2">ph-currency-dollar</v-icon>
                <span class="text-subtitle-1 font-weight-bold text-primary">Indicadores Administrativos</span>
              </div>

              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption text-grey">Valor de Compra</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 text-black font-weight-bold">${{ details.purchaseValue || '0.00' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption text-grey">Peso Inicial</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 text-black font-weight-medium">{{ details.birthWeight || 0 }} kg</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <v-divider class="my-4" />

              <div class="text-caption font-weight-bold text-grey mb-2 text-uppercase">RESPONSABLE LEGAL</div>
              <div class="d-flex align-center pa-3 bg-grey-lighten-5 rounded-lg border">
                <v-avatar size="40" color="primary" class="mr-3 text-white font-weight-bold">
                  {{ details.livestockOwner?.firstName?.charAt(0) }}{{ details.livestockOwner?.lastName?.charAt(0) }}
                </v-avatar>
                <div>
                  <div class="text-body-2 font-weight-bold text-uppercase">{{ details.livestockOwner?.firstName }} {{ details.livestockOwner?.lastName }}</div>
                  <div class="text-caption text-primary text-uppercase">{{ details.company?.name || 'Empresa N/A' }}</div>
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row class="mt-4">
            <v-col cols="12">
              <v-card variant="tonal" color="grey" class="pa-4">
                <div class="text-overline font-weight-bold mb-1 text-uppercase">Notas y Observaciones Generales</div>
                <div class="text-body-2">{{ details.notes || 'No se han ingresado observaciones adicionales para este ejemplar.' }}</div>
              </v-card>
            </v-col>

            <v-col cols="12" v-if="details.bovineStatus === 'MUERTO'">
              <v-alert type="error" variant="flat" class="rounded-lg shadow-sm">
                <template #prepend><v-icon size="30">ph-skull</v-icon></template>
                <div>
                  <div class="text-subtitle-1 font-weight-black text-uppercase">Expediente de Defunción</div>
                  <v-row dense class="mt-1">
                    <v-col cols="4"><span class="text-caption font-weight-bold text-uppercase">Fecha:</span> {{ details.deathDate || 'N/A' }}</v-col>
                    <v-col cols="8"><span class="text-caption font-weight-bold text-uppercase">Causa:</span> {{ details.deathCause?.name || 'No especificada' }}</v-col>
                    <v-col cols="12" class="mt-1"><span class="text-caption font-weight-bold text-uppercase">Comentarios:</span> {{ details.deathComments || 'Sin comentarios adicionales.' }}</v-col>
                  </v-row>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-btn color="grey-darken-1" variant="text" @click="dialog = false" class="px-6 font-weight-bold">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="galleryDialog" max-width="800">
    <v-card class="bg-black">
      <v-toolbar color="transparent" density="compact" dark>
        <v-spacer />
        <v-btn icon="ph-x" @click="galleryDialog = false" />
      </v-toolbar>
      <v-window v-model="currentPhotoIndex" show-arrows="hover">
        <v-window-item v-for="(photo, i) in details?.bovinePhotos" :key="i">
          <v-img :src="photo.url" height="500" contain />
        </v-window-item>
      </v-window>
      <v-card-actions class="justify-center white--text pa-4">
        {{ currentPhotoIndex + 1 }} / {{ details?.bovinePhotos?.length }}
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.border-dashed {
  border-style: dashed !important;
  border-width: 1.5px !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>