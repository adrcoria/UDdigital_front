<script lang="ts" setup>
import { computed } from "vue";

const prop = defineProps({
  placeholder: {
    type: String,
    default: "",
  },
  items: {
    type: Array,
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Array],
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const selected = computed({
  get() {
    return prop.modelValue || "";
  },
  set(selected: string | any) {
    emit("update:modelValue", selected);
  },
});

const onClear = () => {
  emit("update:modelValue", "");
};
</script>
<template>
  <v-autocomplete
    class="menu-select-filter menu-select-autocomplete"
    v-model="selected"
    variant="solo"
    :items="items"
    density="compact"
    clearable
    hide-selected
    hide-details
    item-title="label"
    item-value="value"
    closable-chips
    single-line
    :chips="multiple"
    :multiple="multiple"
    :placeholder="placeholder"
    clear-icon="ph-x"
    :item-height="30"
    @click:clear="onClear"
  >
  </v-autocomplete>
</template>
