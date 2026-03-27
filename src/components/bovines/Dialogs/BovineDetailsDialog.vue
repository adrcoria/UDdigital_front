<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { bovineService } from "@/app/http/httpServiceProvider";

const props = defineProps<{ modelValue: boolean; item: any | null }>();
const emit = defineEmits(["update:modelValue"]);

const dialog = ref(false);
const loading = ref(false);
const details = ref<any>(null);
const activeTab = ref("info");

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

const mainPhoto = computed(() => details.value?.bovinePhotos?.length > 0 ? details.value.bovinePhotos[0].url : null);

const openGallery = (index: number = 0) => {
  currentPhotoIndex.value = index;
  galleryDialog.value = true;
};

const formatDate = (val: string | null) => {
  if (!val) return '---';
  const hasTime = val.length > 10;
  return new Date(val).toLocaleString('es-MX', {
    dateStyle: 'short',
    ...(hasTime ? { timeStyle: 'short' } : {})
  } as any);
};

watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) { activeTab.value = "info"; loadDetails(); }
}, { immediate: true });

watch(dialog, (val) => emit("update:modelValue", val));
</script>

<template>
  <v-dialog v-model="dialog" max-width="1050" scrollable>
    <v-card class="rounded-xl" style="max-height: 90vh; display: flex; flex-direction: column;">

      <!-- Loader -->
      <template v-if="loading">
        <v-card-text class="d-flex align-center justify-center" style="min-height: 400px;">
          <div class="text-center">
            <v-progress-circular indeterminate color="primary" size="64" width="6" class="mb-4" />
            <div class="text-h6 text-primary font-weight-bold">Cargando ficha...</div>
          </div>
        </v-card-text>
      </template>

      <template v-else-if="details">

        <!-- ── Encabezado compacto ── -->
        <div class="pa-4 bg-grey-lighten-4 border-b flex-shrink-0">
          <div class="d-flex align-center">
            <v-avatar size="56" color="primary" variant="flat" class="mr-3 rounded-lg cursor-pointer flex-shrink-0"
              @click="details.bovinePhotos?.length ? openGallery(0) : null">
              <v-img v-if="mainPhoto" :src="mainPhoto" cover />
              <v-icon v-else size="28" color="white">ph-barcode</v-icon>
              <v-badge v-if="details.bovinePhotos?.length > 1"
                :content="`+${details.bovinePhotos.length - 1}`"
                color="secondary" location="bottom right" offset-x="4" offset-y="4" />
            </v-avatar>

            <div class="flex-grow-1 min-width-0">
              <div class="text-h6 font-weight-black text-uppercase">{{ details.name || 'SIN NOMBRE' }}</div>
              <div class="d-flex align-center flex-wrap mt-1" style="gap: 6px;">
                <v-chip size="x-small" color="primary" label class="font-weight-bold">
                  <span class="text-grey-lighten-2 mr-1">SINIIGA</span> {{ details.siniigaEarTag }}
                </v-chip>
                <v-chip size="x-small" variant="outlined" color="primary" label class="font-weight-bold">
                  <span class="text-grey mr-1">INT</span> {{ details.internalEarTag }}
                </v-chip>
                <v-chip size="x-small" :color="details.bovineStatus === 'VIVO' ? 'success' : 'error'" variant="flat" label class="font-weight-bold">
                  {{ details.bovineStatus }}
                </v-chip>
                <v-chip v-if="details.reproductiveStatus" size="x-small" color="pink-darken-1" variant="tonal" label class="font-weight-bold">
                  {{ details.reproductiveStatus }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- Stats bar compacta -->
          <div class="d-flex mt-3" style="gap: 0;">
            <div class="text-center flex-1 px-2">
              <div class="text-caption text-grey text-uppercase">Peso Actual</div>
              <div class="text-subtitle-2 font-weight-black">{{ details.netWeight || 0 }} kg</div>
            </div>
            <v-divider vertical />
            <div class="text-center flex-1 px-2">
              <div class="text-caption text-grey text-uppercase">Peso Inicial</div>
              <div class="text-subtitle-2 font-weight-black">{{ details.birthWeight || 0 }} kg</div>
            </div>
            <v-divider vertical />
            <div class="text-center flex-1 px-2">
              <div class="text-caption text-grey text-uppercase">Etapa de Vida</div>
              <div class="text-subtitle-2 font-weight-black">{{ details.bovineType?.name || 'N/A' }}</div>
            </div>
            <v-divider vertical />
            <div class="text-center flex-1 px-2">
              <div class="text-caption text-grey text-uppercase">Valor Proyectado</div>
              <div class="text-subtitle-2 font-weight-black text-success">${{ details.saleValue || '0.00' }}</div>
            </div>
          </div>
        </div>

        <!-- ── Tabs ── -->
        <v-tabs v-model="activeTab" color="primary" density="comfortable" class="flex-shrink-0 border-b bg-white">
          <v-tab value="info"><v-icon class="mr-1" size="16">ph-info</v-icon>Información</v-tab>
          <v-tab v-if="details.sex?.name === 'HEMBRA'" value="celo">
            <v-icon class="mr-1" size="16">ph-thermometer-hot</v-icon>Celos
            <v-badge v-if="details.heats?.length" :content="details.heats.length" color="pink-darken-1" inline class="ml-1" />
          </v-tab>
          <v-tab v-if="details.sex?.name === 'HEMBRA'" value="prenez">
            <v-icon class="mr-1" size="16">ph-baby</v-icon>Preñez
            <v-badge v-if="details.pregnancies?.length" :content="details.pregnancies.length" color="primary" inline class="ml-1" />
          </v-tab>
          <v-tab v-if="details.sex?.name === 'HEMBRA'" value="parto">
            <v-icon class="mr-1" size="16">ph-cake</v-icon>Partos
            <v-badge v-if="details.births?.length" :content="details.births.length" color="success" inline class="ml-1" />
          </v-tab>
          <v-tab value="pesos">
            <v-icon class="mr-1" size="16">ph-scales</v-icon>Pesos
            <v-badge v-if="details.weightLogs?.length" :content="details.weightLogs.length" color="secondary" inline class="ml-1" />
          </v-tab>
        </v-tabs>

        <!-- ── Contenido tabs (scrolleable) ── -->
        <v-card-text class="pa-0 flex-grow-1 overflow-y-auto">
          <v-window v-model="activeTab">

            <!-- Tab Información -->
            <v-window-item value="info">
              <div class="pa-5">
                <v-row>
                  <!-- Caracterización -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" class="mr-2" size="18">ph-info</v-icon>
                      <span class="text-subtitle-2 font-weight-bold text-primary">Caracterización</span>
                    </div>
                    <v-list density="compact" class="bg-transparent pa-0">
                      <v-list-item class="px-0">
                        <v-list-item-title class="text-caption text-grey">Sexo</v-list-item-title>
                        <v-list-item-subtitle class="text-body-2 text-black font-weight-medium">{{ details.sex?.name || 'N/A' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item class="px-0">
                        <v-list-item-title class="text-caption text-grey">Propósito</v-list-item-title>
                        <v-list-item-subtitle class="text-body-2 text-black font-weight-medium">{{ details.bovinePurpose?.name || 'N/A' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item class="px-0">
                        <v-list-item-title class="text-caption text-grey">Origen</v-list-item-title>
                        <v-list-item-subtitle class="text-body-2 text-black font-weight-medium">{{ details.bovineOrigin?.name || 'N/A' }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                    <v-divider class="my-3" />
                    <div class="text-caption font-weight-bold text-grey mb-2">DISTRIBUCIÓN DE RAZA</div>
                    <div v-if="details.raceAssignments?.length">
                      <div v-for="race in details.raceAssignments" :key="race.id" class="mb-2">
                        <div class="d-flex justify-space-between text-body-2 mb-1">
                          <span>{{ race.bovineRace?.name }}</span>
                          <span class="font-weight-black">{{ race.percentage }}%</span>
                        </div>
                        <v-progress-linear :model-value="race.percentage" color="primary" height="6" rounded />
                      </div>
                    </div>
                    <div v-else class="text-caption text-grey text-italic">Sin composición racial</div>
                  </v-col>

                  <!-- Línea de Vida -->
                  <v-col cols="12" md="4" class="border-s border-e px-5">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" class="mr-2" size="18">ph-tree-structure</v-icon>
                      <span class="text-subtitle-2 font-weight-bold text-primary">Línea de Vida</span>
                    </div>
                    <div class="mb-3">
                      <div class="text-caption text-grey">NACIMIENTO</div>
                      <div class="text-body-2 font-weight-medium">{{ details.birthDate || 'N/A' }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey">INGRESO AL HATO</div>
                      <div class="text-body-2 font-weight-medium">{{ details.dateAddedToHerd || 'N/A' }}</div>
                    </div>
                    <div class="text-caption font-weight-bold text-grey mb-2">GENEALOGÍA</div>
                    <v-card variant="outlined" color="blue-grey-lighten-4" class="pa-2 mb-2 border-dashed">
                      <div class="text-caption text-blue-grey-darken-1 font-weight-bold">PADRE</div>
                      <div class="text-body-2 font-weight-bold">{{ details.father?.name || 'SIN REGISTRO' }}</div>
                      <div class="text-caption text-grey">{{ details.father?.siniigaEarTag || 'N/A' }}</div>
                    </v-card>
                    <v-card variant="outlined" color="pink-lighten-4" class="pa-2 border-dashed">
                      <div class="text-caption text-pink-darken-1 font-weight-bold">MADRE</div>
                      <div class="text-body-2 font-weight-bold">{{ details.mother?.name || 'SIN REGISTRO' }}</div>
                      <div class="text-caption text-grey">{{ details.mother?.siniigaEarTag || 'N/A' }}</div>
                    </v-card>
                  </v-col>

                  <!-- Indicadores + Responsable -->
                  <v-col cols="12" md="4">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" class="mr-2" size="18">ph-currency-dollar</v-icon>
                      <span class="text-subtitle-2 font-weight-bold text-primary">Indicadores</span>
                    </div>
                    <v-list density="compact" class="bg-transparent pa-0">
                      <v-list-item class="px-0">
                        <v-list-item-title class="text-caption text-grey">Valor de Compra</v-list-item-title>
                        <v-list-item-subtitle class="text-body-2 text-black font-weight-bold">${{ details.purchaseValue || '0.00' }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item class="px-0">
                        <v-list-item-title class="text-caption text-grey">Valor Proyectado</v-list-item-title>
                        <v-list-item-subtitle class="text-body-2 text-success font-weight-bold">${{ details.saleValue || '0.00' }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                    <v-divider class="my-3" />
                    <div class="text-caption font-weight-bold text-grey mb-2">RESPONSABLE LEGAL</div>
                    <div class="d-flex align-center pa-2 bg-grey-lighten-5 rounded-lg border">
                      <v-avatar size="36" color="primary" class="mr-2 text-white font-weight-bold text-caption">
                        {{ details.livestockOwner?.firstName?.charAt(0) }}{{ details.livestockOwner?.lastName?.charAt(0) }}
                      </v-avatar>
                      <div>
                        <div class="text-body-2 font-weight-bold text-uppercase">{{ details.livestockOwner?.firstName }} {{ details.livestockOwner?.lastName }}</div>
                        <div class="text-caption text-primary">{{ details.company?.name || 'N/A' }}</div>
                      </div>
                    </div>
                    <v-divider class="my-3" />
                    <div class="text-caption font-weight-bold text-grey mb-2">NOTAS</div>
                    <div class="text-body-2 text-grey-darken-2">{{ details.notes || 'Sin observaciones.' }}</div>
                  </v-col>
                </v-row>

                <!-- Defunción -->
                <v-alert v-if="details.bovineStatus === 'MUERTO'" type="error" variant="flat" class="rounded-lg mt-4">
                  <template #prepend><v-icon size="24">ph-skull</v-icon></template>
                  <div class="text-subtitle-2 font-weight-black">EXPEDIENTE DE DEFUNCIÓN</div>
                  <v-row dense class="mt-1">
                    <v-col cols="4"><span class="text-caption font-weight-bold">Fecha:</span> {{ details.deathDate || 'N/A' }}</v-col>
                    <v-col cols="8"><span class="text-caption font-weight-bold">Causa:</span> {{ details.deathCause?.name || 'No especificada' }}</v-col>
                    <v-col cols="12"><span class="text-caption font-weight-bold">Comentarios:</span> {{ details.deathComments || '---' }}</v-col>
                  </v-row>
                </v-alert>
              </div>
            </v-window-item>

            <!-- Tab Celos -->
            <v-window-item value="celo">
              <div class="pa-4">
                <v-table density="compact" class="rounded-lg border">
                  <thead>
                    <tr>
                      <th>Fecha / Hora Inicio</th>
                      <th>Fecha / Hora Fin</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="h in details.heats" :key="h.id">
                      <td class="font-weight-bold">{{ formatDate(h.heatDateInit) }}</td>
                      <td>{{ formatDate(h.heatDateEnd) }}</td>
                      <td class="text-caption text-grey-darken-1">{{ h.comments || '---' }}</td>
                    </tr>
                    <tr v-if="!details.heats?.length">
                      <td colspan="3" class="text-center py-8 text-grey">Sin registros de celo</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>

            <!-- Tab Preñez -->
            <v-window-item value="prenez">
              <div class="pa-4">
                <v-table density="compact" class="rounded-lg border">
                  <thead>
                    <tr>
                      <th>Fecha Inicio</th>
                      <th>F. Probable Parto</th>
                      <th>Meses Gestación</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in details.pregnancies" :key="p.id">
                      <td>{{ formatDate(p.dateInit) }}</td>
                      <td class="text-primary font-weight-bold">{{ formatDate(p.dateEnd) }}</td>
                      <td>{{ p.gestationMonths ?? '---' }}</td>
                      <td class="text-caption text-grey-darken-1">{{ p.comments || '---' }}</td>
                    </tr>
                    <tr v-if="!details.pregnancies?.length">
                      <td colspan="4" class="text-center py-8 text-grey">Sin registros de preñez</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>

            <!-- Tab Partos -->
            <v-window-item value="parto">
              <div class="pa-4">
                <v-table density="compact" class="rounded-lg border">
                  <thead>
                    <tr>
                      <th>Fecha de Parto</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in details.births" :key="b.id">
                      <td class="font-weight-bold">{{ formatDate(b.birthDate) }}</td>
                      <td class="text-caption text-grey-darken-1">{{ b.comments || '---' }}</td>
                    </tr>
                    <tr v-if="!details.births?.length">
                      <td colspan="2" class="text-center py-8 text-grey">Sin registros de parto</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>

            <!-- Tab Pesos -->
            <v-window-item value="pesos">
              <div class="pa-4">
                <v-table density="compact" class="rounded-lg border">
                  <thead>
                    <tr>
                      <th>Fecha de Registro</th>
                      <th>Peso (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="w in details.weightLogs" :key="w.id">
                      <td>{{ formatDate(w.registerDate) }}</td>
                      <td class="font-weight-bold">{{ w.weight }} kg</td>
                    </tr>
                    <tr v-if="!details.weightLogs?.length">
                      <td colspan="2" class="text-center py-8 text-grey">Sin registros de peso</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-window-item>

          </v-window>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-3 bg-grey-lighten-4 flex-shrink-0">
          <v-btn color="grey-darken-1" variant="text" @click="dialog = false" class="px-6 font-weight-bold">Cerrar</v-btn>
        </v-card-actions>

      </template>
    </v-card>
  </v-dialog>

  <!-- Galería -->
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
.border-dashed { border-style: dashed !important; border-width: 1.5px !important; }
.cursor-pointer { cursor: pointer; }
.flex-1 { flex: 1; }
</style>
