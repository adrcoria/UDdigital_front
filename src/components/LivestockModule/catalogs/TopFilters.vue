<script setup lang="ts">
import { computed } from "vue";
import QuerySearch from "@/app/common/components/filters/QuerySearch.vue";

const props = defineProps<{
  modelValue: string;
  search: string;
}>();

const emit = defineEmits([
  "update:modelValue",
  "update:search"
]);

const catalogs = [
  { title: "Propósito de ganado", value: "bovine-purpose" },
  { title: "Etapa de vida", value: "bovine-type" },
  { title: "Sexos", value: "sex" },
  { title: "Orígenes", value: "bovine-origin" },
  { title: "Propietarios", value: "livestock-owner" },
  { title: "Razas", value: "bovine-race" },
];

/* ------------------ Computed para buscador ------------------ */

const query = computed({
  get() {
    return props.search || "";
  },
  set(value: string) {
    emit("update:search", value);
  }
});

const onClear = () => {
  emit("update:search", "");
};
</script>

<template>
  <v-card variant="flat" border class="bg-white pa-4">
    <v-row align="center" dense>
      <v-col cols="12" sm="6" md="4">
        <v-select label="Catálogo a administrar" :items="catalogs" :model-value="props.modelValue"
          @update:model-value="emit('update:modelValue', $event)" variant="outlined" density="comfortable" hide-details
          prepend-inner-icon="ph-book-open" />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <QuerySearch v-model="query" placeholder="Escribe lo que deseas buscar" />
      </v-col>

      <!-- Botón limpiar -->
      <v-col cols="12" sm="6" md="auto" class="d-flex align-center">
        <v-btn color="secondary" rounded="md" block @click="onClear">
          Limpiar
          <i class="ph-funnel mx-1" />
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>