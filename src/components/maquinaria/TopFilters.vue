<script lang="ts" setup>
import { ref } from "vue";

const emit = defineEmits<{
  (e: "search", value: string): void;
  (e: "create"): void;
}>();

const searchQuery = ref("");

const onSearch = () => emit("search", searchQuery.value);
</script>

<template>
  <v-card class="mb-3" elevation="1">
    <v-card-text class="pa-3">
      <v-row dense align="center">
        <v-col cols="12" md="9">
          <v-text-field
            v-model="searchQuery"
            label="Buscar por nombre, marca, modelo o serie..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="ph-magnifying-glass"
            @keyup.enter="onSearch"
            @click:clear="() => { searchQuery = ''; emit('search', ''); }"
          >
            <template #append>
              <v-btn color="primary" variant="tonal" size="small" @click="onSearch">
                Buscar
              </v-btn>
            </template>
          </v-text-field>
        </v-col>

        <v-col cols="12" md="3" class="text-right">
          <v-btn color="primary" prepend-icon="ph-plus" @click="emit('create')">
            Nueva maquinaria
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
