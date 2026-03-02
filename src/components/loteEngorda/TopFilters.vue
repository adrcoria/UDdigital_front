<script setup lang="ts">
const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
});

const onClear = () => {
  emit("update:modelValue", {
    ...props.modelValue,
    query: "",
  });
};
</script>

<template>
  <v-card variant="flat" border class="pa-5 bg-white rounded-lg shadow-sm">
    <v-row dense align="center">
      <v-col cols="4" md="4">
        <v-text-field
          v-model="props.modelValue.query"
          label="Buscar Lote de Engorda"
          prepend-inner-icon="ph-magnifying-glass"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          placeholder="Escribe el nombre del lote para filtrar..."
          @click:clear="onClear"
          @keyup.enter="$emit('update:modelValue', props.modelValue)"
        />
      </v-col>

      <v-col cols="12" md="2">
        <v-btn 
          color="secondary" 
          variant="tonal" 
          block 
          height="48" 
          @click="onClear"
          prepend-icon="ph-eraser"
        >
          Limpiar
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
/* Estilo para mantener la línea ejecutiva de Valladolid */
.v-card {
  transition: all 0.3s ease;
}
</style>