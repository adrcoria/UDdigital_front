<script setup lang="ts">
import { computed } from "vue";
import QuerySearch from "@/app/common/components/filters/QuerySearch.vue";

const props = defineProps<{
  modelValue: string;
  search: string;
}>();

const emit = defineEmits(["update:modelValue", "update:search"]);

const catalogs = [
  { title: "Productos", value: "products" },
  { title: "Marcas", value: "brands" },
  { title: "Categorías", value: "subcategories" },
];

const query = computed({
  get: () => props.search || "",
  set: (v: string) => emit("update:search", v),
});
</script>

<template>
  <v-card variant="flat" border class="bg-white pa-4">
    <v-row align="center" dense>
      <v-col cols="12" sm="6" md="4">
        <v-select
          label="Catálogo a administrar"
          :items="catalogs"
          :model-value="props.modelValue"
          @update:model-value="emit('update:modelValue', $event)"
          variant="outlined"
          density="comfortable"
          hide-details
          prepend-inner-icon="ph-package"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <QuerySearch v-model="query" placeholder="Escribe lo que deseas buscar" />
      </v-col>
      <v-col cols="12" sm="6" md="auto" class="d-flex align-center">
        <v-btn color="secondary" rounded="md" block @click="emit('update:search', '')">
          Limpiar
          <i class="ph-funnel mx-1" />
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>
