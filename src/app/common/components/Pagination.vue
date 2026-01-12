<script lang="ts" setup>
import { PaginationType } from "@/app/common/types/table.types";
import { computed } from "vue";
import { type PropType } from "vue";
const prop = defineProps({
  config: {
    type: Object as PropType<PaginationType>,
    default: {
      current: 10,
      total: 15,
      length: 2,
    },
  },
  modelValue: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["update:modelValue"]);

const page = computed({
  get() {
    return prop.modelValue;
  },
  set(newVal: number) {
    emit("update:modelValue", newVal);
  },
});
</script>
<template>
  <div class="d-flex justify-space-between align-center mt-4">
    <div class="text-muted">
      Mostrando <b>{{ config.current }}</b> de <b>{{ config.total }}</b> Results
    </div>
    <v-pagination
      v-model="page"
      :length="config.length"
      density="compact"
      color="primary"
      variant="text"
      total-visible="3"
      prev-icon="ph-arrow-left"
      next-icon="ph-arrow-right"
      class="table-pagination"
    />
  </div>
</template>
