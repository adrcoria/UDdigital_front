<script lang="ts" setup>
import { ref, defineProps, onMounted } from "vue";

const suscription = ref(null);

const props = defineProps({
  subscription: {
    type: Object,
    default: () => ({})
  }
});

onMounted(() => {
  suscription.value = props.subscription;
  console.log('llego', suscription.value);
});
</script>

<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="12" lg="8" class="pe-0">
          <!-- Título de la sección: Folio -->
          <v-card-title>
            <v-row justify="space-between">
              <v-col cols="9">
                <h5 class="text-h6 font-weight-bold text-truncate">FOLIO</h5>
              </v-col>
            </v-row>
          </v-card-title>
          <v-card-text>
            <!-- Folio y fecha de solicitud -->
            <div class="d-flex">
              <div>
                <span class="font-weight-bold">{{ suscription?.folio }}</span>
              </div>
              <v-divider vertical class="mx-3" />
              <div>
                <span class="text-muted">Fecha solicitud: </span>
                <span class="font-weight-bold">{{ suscription?.request_date }}</span>
              </div>
            </div>
            <!-- Nombre del productor/agricultor -->
            <div class="text-subtitle-2 font-weight-bold my-4">
              NOMBRE DEL PRODUCTOR
            </div>
            <div class="text-muted">
              {{ suscription?.farmer?.name }}
              {{ suscription?.farmer?.last_name }}
              {{ suscription?.farmer?.second_last_name }}
            </div>
            <!-- Tipo de suscripción -->
            <div class="text-subtitle-2 font-weight-bold mt-6 mb-4">
              Tipo de suscripción
            </div>
            <div class="text-muted">
              {{ suscription?.subscription_type?.name }}
            </div>
            <!-- Si es agrícola, se muestran Tipo, Modalidad y Ciclo -->
            <div v-if="suscription?.subscription_type?.name === 'AGROPECUARIO'">
              <div class="text-subtitle-2 font-weight-bold mt-6 mb-4">
                Tipo
              </div>
              <div class="text-muted">
                {{ suscription?.agro_type }}
              </div>
              <div class="text-subtitle-2 font-weight-bold mt-6 mb-4">
                Modalidad
              </div>
              <div class="text-muted">
                {{ suscription?.modality }}
              </div>
              <div class="text-subtitle-2 font-weight-bold mt-6 mb-4">
                Ciclo
              </div>
              <div class="text-muted">
                {{ suscription?.cycle }}
              </div>
            </div>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
