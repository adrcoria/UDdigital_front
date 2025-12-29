<script lang="ts" setup>
import { computed } from "vue";
import QuerySearch from "@/app/common/components/filters/QuerySearch.vue";
const emit = defineEmits(["update:modelValue"]);
const prop = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const query = computed({
  get() {
    return prop.modelValue.query || "";
  },
  set(updatedQuery: string) {
    emit("update:modelValue", {
      ...prop.modelValue,
      query: updatedQuery,
    });
  },
});

const brands = computed({
  get() {
    return prop.modelValue.brands || [];
  },
  set(brands: string) {
    emit("update:modelValue", {
      ...prop.modelValue,
      brands,
    });
  },
});

const categories = computed({
  get() {
    return prop.modelValue.category || [];
  },
  set(category: string) {
    emit("update:modelValue", {
      ...prop.modelValue,
      category,
    });
  },
});

const discount = computed({
  get() {
    return prop.modelValue.discount || [];
  },
  set(discount: string) {
    emit("update:modelValue", {
      ...prop.modelValue,
      discount,
    });
  },
});

const onClear = () => {
  emit("update:modelValue", {
    query: "",
    brands: [],
    category: "",
    discount: "",
  });
};
</script>
<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="12" lg="3">
          <QuerySearch
            v-model="query"
            placeholder="Escribe lo que deseas buscar"
          />
        </v-col>
        <v-col cols="12" sm="6" lg="auto" class="d-flex align-center">
          <v-btn color="secondary" rounded="md" class="" block @click="onClear">
            Limpiar
            <i class="ph-funnel mx-1" />
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
