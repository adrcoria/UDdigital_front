<script lang="ts" setup>
import { ref } from "vue";

const emit = defineEmits(["search"]);
const searchQuery = ref("");

const onSearch = () => {
  emit("search", searchQuery.value);
};

const clearSearch = () => {
  if (!searchQuery.value) {
    emit("search", "");
  }
};
</script>

<template>
  <v-card class="mb-4" elevation="0" border>
    <v-card-text>
      <v-row align="center" dense>
        <v-col cols="12" md="9">
          <v-text-field
            v-model="searchQuery"
            label="Buscar por arete o nombre..."
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            @click:clear="emit('search', '')"
            @keyup.enter="onSearch"
            @input="clearSearch"
          >
            <template #prepend-inner>
              <i class="ph-magnifying-glass" style="font-size: 20px;"></i>
            </template>
          </v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-btn
            color="primary"
            block
            height="48"
            @click="onSearch"
            prepend-icon="ph-magnifying-glass"
          >
            Buscar
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>